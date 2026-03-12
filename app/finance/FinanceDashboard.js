'use client';

import { useState, useTransition, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
    Wallet, TrendingDown, ShoppingCart, Landmark, Plus, Trash2,
    CheckCircle2, Circle, ChevronDown, Zap, X, Edit2, Save, BarChart3
} from 'lucide-react';
import {
    updateBudgetMeta, addFixedExpense, toggleFixedPaid, deleteFixedExpense,
    addVariableExpense, deleteVariableExpense, getOrCreateBudget, checkAndAwardSavingsXP
} from '@/app/finance-actions';
import { cn } from '@/lib/utils';

const FIXED_CATEGORIES = ['HOUSING', 'INVESTMENT', 'EMI', 'SUBSCRIPTION', 'UTILITIES', 'OTHER'];
const VAR_CATEGORIES = ['FOOD', 'TRANSPORT', 'HEALTH', 'ENTERTAINMENT', 'SHOPPING', 'OTHER'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CAT_COLORS = {
    HOUSING: '#ef4444', INVESTMENT: '#22c55e', EMI: '#f97316',
    SUBSCRIPTION: '#a855f7', UTILITIES: '#3b82f6', OTHER: '#6b7280',
    FOOD: '#eab308', TRANSPORT: '#06b6d4', HEALTH: '#ec4899',
    ENTERTAINMENT: '#f97316', SHOPPING: '#8b5cf6',
};

const PIE_COLORS = ['#ef4444', '#eab308', '#22c55e', '#3b82f6'];

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

function StatCard({ icon: Icon, label, value, color, sub }) {
    return (
        <div className={cn(
            "rounded-xl border bg-zinc-900/80 p-5 flex flex-col gap-2 relative overflow-hidden",
            color === 'red' && "border-red-500/20",
            color === 'yellow' && "border-yellow-500/20",
            color === 'green' && "border-green-500/20",
            color === 'blue' && "border-blue-500/20",
            (!color || color === 'default') && "border-zinc-700",
        )}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{label}</p>
                <Icon size={16} className={cn(
                    color === 'red' && "text-red-400",
                    color === 'yellow' && "text-yellow-400",
                    color === 'green' && "text-green-400",
                    color === 'blue' && "text-blue-400",
                    (!color || color === 'default') && "text-zinc-400",
                )} />
            </div>
            <p className={cn(
                "text-2xl font-bold font-mono",
                color === 'red' && "text-red-300",
                color === 'yellow' && "text-yellow-300",
                color === 'green' && "text-green-300",
                color === 'blue' && "text-blue-300",
                (!color || color === 'default') && "text-white",
            )}>{value}</p>
            {sub && <p className="text-xs text-zinc-600 font-mono">{sub}</p>}

            {/* Glow accent */}
            <div className={cn(
                "absolute bottom-0 left-0 h-0.5 w-full opacity-50",
                color === 'red' && "bg-red-500",
                color === 'yellow' && "bg-yellow-500",
                color === 'green' && "bg-green-500",
                color === 'blue' && "bg-blue-500",
                (!color || color === 'default') && "bg-zinc-700",
            )} />
        </div>
    );
}

function CategoryBadge({ cat }) {
    const color = CAT_COLORS[cat] || '#6b7280';
    return (
        <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider"
            style={{ background: color + '22', color, border: `1px solid ${color}44` }}>
            {cat}
        </span>
    );
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono shadow-xl">
                <p className="text-zinc-400">{payload[0].name}</p>
                <p className="text-white font-bold">{fmt(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

export default function FinanceDashboard({ initialBudget, currentMonth, currentYear }) {
    const [budget, setBudget] = useState(initialBudget);
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [isPending, startTransition] = useTransition();

    // Income editor
    const [editingMeta, setEditingMeta] = useState(false);
    const [incomeInput, setIncomeInput] = useState(budget?.income || '');
    const [goalInput, setGoalInput] = useState(budget?.savingsGoal || '');

    // Add fixed expense form
    const [showFixedForm, setShowFixedForm] = useState(false);
    const [fixedName, setFixedName] = useState('');
    const [fixedAmount, setFixedAmount] = useState('');
    const [fixedCat, setFixedCat] = useState('OTHER');

    // Add variable expense form
    const [showVarForm, setShowVarForm] = useState(false);
    const [varName, setVarName] = useState('');
    const [varAmount, setVarAmount] = useState('');
    const [varCat, setVarCat] = useState('OTHER');

    // Savings modal
    const [savingsModal, setSavingsModal] = useState(false);

    // Computed values
    const totalFixed = (budget?.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
    const totalVariable = (budget?.variableExpenses || []).reduce((s, e) => s + e.amount, 0);
    const income = budget?.income || 0;
    const savingsGoal = budget?.savingsGoal || 0;
    const remaining = income - totalFixed - totalVariable;
    const actualSavings = Math.max(0, remaining);
    const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((actualSavings / savingsGoal) * 100)) : 0;
    const goalMet = actualSavings >= savingsGoal && savingsGoal > 0;

    const pieData = income > 0 ? [
        { name: 'Fixed', value: totalFixed },
        { name: 'Variable', value: totalVariable },
        { name: 'Remaining', value: Math.max(0, remaining) },
    ].filter(d => d.value > 0) : [];

    async function switchMonth(m, y) {
        setMonth(m);
        setYear(y);
        const newBudget = await getOrCreateBudget(m, y);
        setBudget(newBudget);
        setIncomeInput(newBudget?.income || '');
        setGoalInput(newBudget?.savingsGoal || '');
    }

    async function handleSaveMeta() {
        if (!budget) return;
        await updateBudgetMeta(budget.id, incomeInput, goalInput);
        setBudget(b => ({ ...b, income: parseFloat(incomeInput) || 0, savingsGoal: parseFloat(goalInput) || 0 }));
        setEditingMeta(false);
    }

    async function handleAddFixed() {
        if (!fixedName || !fixedAmount || !budget) return;
        const res = await addFixedExpense(budget.id, fixedName, fixedAmount, fixedCat);
        if (res.success) {
            const newBudget = await getOrCreateBudget(month, year);
            setBudget(newBudget);
            setFixedName(''); setFixedAmount(''); setFixedCat('OTHER');
            setShowFixedForm(false);
        }
    }

    async function handleTogglePaid(id) {
        await toggleFixedPaid(id);
        setBudget(b => ({ ...b, fixedExpenses: b.fixedExpenses.map(e => e.id === id ? { ...e, isPaid: !e.isPaid } : e) }));
    }

    async function handleDeleteFixed(id) {
        await deleteFixedExpense(id);
        setBudget(b => ({ ...b, fixedExpenses: b.fixedExpenses.filter(e => e.id !== id) }));
    }

    async function handleAddVariable() {
        if (!varName || !varAmount || !budget) return;
        const res = await addVariableExpense(budget.id, varName, varAmount, varCat);
        if (res.success) {
            const newBudget = await getOrCreateBudget(month, year);
            setBudget(newBudget);
            setVarName(''); setVarAmount(''); setVarCat('OTHER');
            setShowVarForm(false);
        }
    }

    async function handleDeleteVariable(id) {
        await deleteVariableExpense(id);
        setBudget(b => ({ ...b, variableExpenses: b.variableExpenses.filter(e => e.id !== id) }));
    }

    async function handleCheckSavings() {
        if (!budget) return;
        const result = await checkAndAwardSavingsXP(budget.id);
        if (result.xpAwarded) setSavingsModal(true);
    }

    const inputClass = "w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500";
    const selectClass = "rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500";

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Savings Goal Modal */}
            {savingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-xl border border-green-500/30 bg-zinc-900 p-8 shadow-2xl text-center">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-green-500 to-transparent rounded-t-xl" />
                        <div className="text-5xl mb-4">⚡</div>
                        <p className="text-xs font-mono text-green-400 tracking-widest uppercase mb-2">System Alert</p>
                        <h2 className="text-2xl font-bold mb-2">SAVINGS PROTOCOL COMPLETE</h2>
                        <p className="text-zinc-400 text-sm mb-1 font-mono">Financial discipline acknowledged.</p>
                        <p className="text-green-400 font-bold text-lg mb-6 font-mono">+500 XP AWARDED</p>
                        <button onClick={() => setSavingsModal(false)} className="cursor-pointer px-6 py-2 rounded border border-green-500/40 text-green-400 hover:bg-green-500/10 font-mono transition-colors">
                            ACKNOWLEDGE
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* ─── Header ─── */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">System Module</p>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <Wallet className="text-blue-400" size={28} />
                            Treasury Intelligence
                        </h1>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-2">
                        <select
                            value={month}
                            onChange={e => switchMonth(parseInt(e.target.value), year)}
                            className={selectClass}
                        >
                            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input
                            type="number"
                            value={year}
                            onChange={e => switchMonth(month, parseInt(e.target.value))}
                            className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white font-mono focus:outline-none"
                        />
                    </div>
                </div>

                {/* ─── Income / Savings Goal Bar ─── */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5">
                    {editingMeta ? (
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-1 block">Monthly Income (₹)</label>
                                <input type="number" value={incomeInput} onChange={e => setIncomeInput(e.target.value)} placeholder="e.g. 80000" className={inputClass} />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-1 block">Savings Goal (₹)</label>
                                <input type="number" value={goalInput} onChange={e => setGoalInput(e.target.value)} placeholder="e.g. 20000" className={inputClass} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingMeta(false)} className="cursor-pointer px-4 py-2 text-xs font-mono text-zinc-400 border border-zinc-700 rounded hover:bg-zinc-800 transition-colors">CANCEL</button>
                                <button onClick={handleSaveMeta} className="cursor-pointer px-4 py-2 text-xs font-bold font-mono bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors">SAVE</button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="flex gap-8">
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Base Income</p>
                                    <p className="text-2xl font-bold text-blue-300 font-mono">{fmt(income)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-500 uppercase font-mono tracking-widest">Savings Goal</p>
                                    <p className="text-2xl font-bold text-green-300 font-mono">{fmt(savingsGoal)}</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingMeta(true)} className="cursor-pointer flex items-center gap-2 text-xs text-zinc-400 border border-zinc-700 rounded px-3 py-2 hover:bg-zinc-800 hover:text-white transition-colors font-mono">
                                <Edit2 size={12} /> EDIT
                            </button>
                        </div>
                    )}
                </div>

                {/* ─── Stat Cards ─── */}
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <StatCard icon={Wallet} label="Monthly Income" value={fmt(income)} color="blue" sub="Base salary" />
                    <StatCard icon={TrendingDown} label="Fixed Obligations" value={fmt(totalFixed)} color="red"
                        sub={`${(budget?.fixedExpenses || []).filter(e => e.isPaid).length}/${(budget?.fixedExpenses || []).length} paid`} />
                    <StatCard icon={ShoppingCart} label="Variable Spent" value={fmt(totalVariable)} color="yellow"
                        sub={`${(budget?.variableExpenses || []).length} transactions`} />
                    <StatCard icon={Landmark} label="Free to Spend" value={fmt(remaining)} color={remaining >= 0 ? 'green' : 'red'}
                        sub={remaining < 0 ? '⚠ Over budget!' : 'Balance remaining'} />
                </div>

                {/* ─── Savings Progress + Donut ─── */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Savings Progress */}
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300 font-mono">Savings Progress</h3>
                            {goalMet && !budget?.xpAwarded && (
                                <button onClick={handleCheckSavings}
                                    className="cursor-pointer flex items-center gap-1 text-xs font-mono bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 transition-colors">
                                    <Zap size={12} /> CLAIM 500 XP
                                </button>
                            )}
                            {budget?.xpAwarded && (
                                <span className="text-xs font-mono text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> XP Claimed</span>
                            )}
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm font-mono">
                                <span className="text-zinc-400">Actual Savings</span>
                                <span className={cn("font-bold", goalMet ? "text-green-400" : "text-yellow-400")}>{fmt(actualSavings)}</span>
                            </div>
                            <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-700",
                                        goalMet ? "bg-green-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${savingsPct}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-zinc-500 font-mono">
                                <span>{savingsPct}% of goal</span>
                                <span>Goal: {fmt(savingsGoal)}</span>
                            </div>
                        </div>

                        {/* Spending Breakdown Text */}
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs font-mono">
                            {[
                                { label: 'Fixed', value: totalFixed, color: 'text-red-400' },
                                { label: 'Variable', value: totalVariable, color: 'text-yellow-400' },
                                { label: 'Savings', value: actualSavings, color: 'text-green-400' },
                                { label: 'Total Out', value: totalFixed + totalVariable, color: 'text-orange-400' },
                            ].map(item => (
                                <div key={item.label} className="rounded bg-zinc-800/60 px-3 py-2">
                                    <p className="text-zinc-500 uppercase tracking-wider text-[10px]">{item.label}</p>
                                    <p className={cn("font-bold", item.color)}>{fmt(item.value)}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Donut Chart */}
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-2">
                            <BarChart3 size={16} className="text-zinc-400" />
                            <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300 font-mono">Allocation Breakdown</h3>
                        </div>
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={220}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                                        dataKey="value" paddingAngle={3}>
                                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend formatter={(v) => <span className="text-xs text-zinc-400 font-mono">{v}</span>} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm font-mono">
                                Set income to see chart
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Fixed Obligations ─── */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/50">
                        <div>
                            <h3 className="font-bold tracking-widest text-sm uppercase font-mono">Fixed Obligations</h3>
                            <p className="text-xs text-zinc-500 font-mono">Rent, SIP, EMI, Subscriptions</p>
                        </div>
                        <button onClick={() => setShowFixedForm(v => !v)}
                            className="cursor-pointer flex items-center gap-1 text-xs font-mono border border-zinc-600 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors">
                            <Plus size={12} /> ADD
                        </button>
                    </div>

                    {showFixedForm && (
                        <div className="border-b border-zinc-700/50 px-5 py-4 bg-zinc-800/30">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input value={fixedName} onChange={e => setFixedName(e.target.value)} placeholder="Name (e.g. Rent)" className={cn(inputClass, "flex-1")} />
                                <input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="Amount ₹" className={cn(inputClass, "w-32")} />
                                <select value={fixedCat} onChange={e => setFixedCat(e.target.value)} className={selectClass}>
                                    {FIXED_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <button onClick={handleAddFixed} className="cursor-pointer px-4 py-1.5 text-xs font-bold font-mono bg-blue-600 text-white rounded hover:bg-blue-500 transition-colors whitespace-nowrap">
                                    ADD OBLIGATION
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-800">
                        {(budget?.fixedExpenses || []).length === 0 && (
                            <p className="px-5 py-8 text-center text-xs text-zinc-600 font-mono">No fixed obligations added yet.</p>
                        )}
                        {(budget?.fixedExpenses || []).map(exp => (
                            <div key={exp.id} className={cn("flex items-center gap-4 px-5 py-3 transition-colors hover:bg-zinc-800/30", exp.isPaid && "opacity-50")}>
                                <button onClick={() => handleTogglePaid(exp.id)} className="cursor-pointer flex-shrink-0 text-zinc-500 hover:text-green-400 transition-colors">
                                    {exp.isPaid ? <CheckCircle2 size={18} className="text-green-400" /> : <Circle size={18} />}
                                </button>
                                <div className="flex-1 min-w-0">
                                    <p className={cn("text-sm font-mono", exp.isPaid && "line-through")}>{exp.name}</p>
                                </div>
                                <CategoryBadge cat={exp.category} />
                                <p className="text-sm font-bold font-mono text-red-300 w-24 text-right">{fmt(exp.amount)}</p>
                                <button onClick={() => handleDeleteFixed(exp.id)} className="cursor-pointer text-zinc-600 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {(budget?.fixedExpenses || []).length > 0 && (
                            <div className="flex justify-end px-5 py-3 bg-zinc-900/40">
                                <span className="text-xs text-zinc-500 font-mono mr-4">TOTAL FIXED</span>
                                <span className="text-sm font-bold font-mono text-red-300">{fmt(totalFixed)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Variable Expenses ─── */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700/50">
                        <div>
                            <h3 className="font-bold tracking-widest text-sm uppercase font-mono">Variable Expenses</h3>
                            <p className="text-xs text-zinc-500 font-mono">Daily spend log</p>
                        </div>
                        <button onClick={() => setShowVarForm(v => !v)}
                            className="cursor-pointer flex items-center gap-1 text-xs font-mono border border-zinc-600 text-zinc-300 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors">
                            <Plus size={12} /> LOG EXPENSE
                        </button>
                    </div>

                    {showVarForm && (
                        <div className="border-b border-zinc-700/50 px-5 py-4 bg-zinc-800/30">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input value={varName} onChange={e => setVarName(e.target.value)} placeholder="Description (e.g. Dinner)" className={cn(inputClass, "flex-1")} />
                                <input type="number" value={varAmount} onChange={e => setVarAmount(e.target.value)} placeholder="Amount ₹" className={cn(inputClass, "w-32")} />
                                <select value={varCat} onChange={e => setVarCat(e.target.value)} className={selectClass}>
                                    {VAR_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                                <button onClick={handleAddVariable} className="cursor-pointer px-4 py-1.5 text-xs font-bold font-mono bg-yellow-600 text-white rounded hover:bg-yellow-500 transition-colors whitespace-nowrap">
                                    LOG
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-zinc-800">
                        {(budget?.variableExpenses || []).length === 0 && (
                            <p className="px-5 py-8 text-center text-xs text-zinc-600 font-mono">No expenses logged this month.</p>
                        )}
                        {(budget?.variableExpenses || []).map(exp => (
                            <div key={exp.id} className="flex items-center gap-4 px-5 py-3 hover:bg-zinc-800/30 transition-colors">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-mono">{exp.name}</p>
                                    <p className="text-xs text-zinc-600 font-mono">
                                        {new Date(exp.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                    </p>
                                </div>
                                <CategoryBadge cat={exp.category} />
                                <p className="text-sm font-bold font-mono text-yellow-300 w-24 text-right">{fmt(exp.amount)}</p>
                                <button onClick={() => handleDeleteVariable(exp.id)} className="cursor-pointer text-zinc-600 hover:text-red-400 transition-colors">
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                        {(budget?.variableExpenses || []).length > 0 && (
                            <div className="flex justify-end px-5 py-3 bg-zinc-900/40">
                                <span className="text-xs text-zinc-500 font-mono mr-4">TOTAL VARIABLE</span>
                                <span className="text-sm font-bold font-mono text-yellow-300">{fmt(totalVariable)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
