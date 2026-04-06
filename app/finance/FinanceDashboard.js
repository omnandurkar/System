'use client';

import { useState, useTransition, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
    Wallet, TrendingDown, ShoppingCart, Landmark, Plus, Trash2,
    CheckCircle2, Circle, Zap, Edit2, BarChart3, FlaskConical,
    RefreshCw, FileDown, ChevronDown, ChevronUp, Clock, CalendarDays,
    PiggyBank, X, ShoppingBag
} from 'lucide-react';
import {
    updateBudgetMeta, addFixedExpense, toggleFixedPaid, deleteFixedExpense,
    addVariableExpense, deleteVariableExpense, checkAndAwardSavingsXP,
    getOrCreateBudgetWithCaps, copyRecurringExpenses,
    settleSavingsToNetWorth, getNetWorthAssets, getFinanceGoals
} from '@/app/finance-actions';
import ShortTermGoals from './ShortTermGoals';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import {
    CategoryBarChart, MonthComparison, SpendingVelocity,
    TopSpendingDays, WeeklyDigest, CategoryCaps,
    EmergencyFundTracker, TreasuryReportCard, AnnualView
} from './TreasuryExtras';
import QuickExpenseLogger from './QuickExpenseLogger';

const AdvancedFinancePanel = dynamic(() => import('./AdvancedFinancePanel'), { ssr: false });

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
        <div className={cn("rounded-xl border bg-zinc-900/80 p-5 flex flex-col gap-2 relative overflow-hidden",
            color === 'red' && "border-red-500/20", color === 'yellow' && "border-yellow-500/20",
            color === 'green' && "border-green-500/20", color === 'blue' && "border-blue-500/20",
            (!color || color === 'default') && "border-zinc-700")}>
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 uppercase tracking-widest font-mono">{label}</p>
                <Icon size={16} className={cn(color === 'red' && "text-red-400", color === 'yellow' && "text-yellow-400", color === 'green' && "text-green-400", color === 'blue' && "text-blue-400", (!color || color === 'default') && "text-zinc-400")} />
            </div>
            <p className={cn("text-2xl font-bold font-mono", color === 'red' && "text-red-300", color === 'yellow' && "text-yellow-300", color === 'green' && "text-green-300", color === 'blue' && "text-blue-300", (!color || color === 'default') && "text-white")}>{value}</p>
            {sub && <p className="text-xs text-zinc-600 font-mono">{sub}</p>}
            <div className={cn("absolute bottom-0 left-0 h-0.5 w-full opacity-50", color === 'red' && "bg-red-500", color === 'yellow' && "bg-yellow-500", color === 'green' && "bg-green-500", color === 'blue' && "bg-blue-500", (!color || color === 'default') && "bg-zinc-700")} />
        </div>
    );
}

const CategoryBadge = ({ cat }) => {
    const color = CAT_COLORS[cat] || '#6b7280';
    return (
        <span className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-[9px] font-mono text-zinc-400 group-hover/item:border-white/10 group-hover/item:text-zinc-300 transition-all">
            <span className="w-1 h-1 rounded-full shadow-[0_0_8px] animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
            {cat}
        </span>
    );
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-mono shadow-xl">
                <p className="text-zinc-400">{payload[0].name}</p>
                <p className="text-white font-bold">{fmt(payload[0].value)}</p>
            </div>
        );
    }
    return null;
};

// Feature #20 — CSV Export
function exportToCSV(budget, month, year) {
    const MONTHS_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    let csv = `Treasury Report — ${MONTHS_FULL[month - 1]} ${year}\n\n`;
    csv += 'TYPE,NAME,CATEGORY,AMOUNT,NOTE\n';
    (budget.fixedExpenses || []).forEach(e => {
        csv += `Fixed,${e.name},${e.category},${e.amount},${e.note || ''}\n`;
    });
    (budget.variableExpenses || []).forEach(e => {
        csv += `Variable,${e.name},${e.category},${e.amount},${e.note || ''}\n`;
    });
    const totalFixed = (budget.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
    const totalVar = (budget.variableExpenses || []).reduce((s, e) => s + e.amount, 0);
    csv += `\nINCOME,,, ${budget.income || 0},\n`;
    csv += `TOTAL FIXED,,, ${totalFixed},\n`;
    csv += `TOTAL VARIABLE,,, ${totalVar},\n`;
    csv += `SAVINGS,,, ${Math.max(0, (budget.income || 0) - totalFixed - totalVar)},\n`;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `treasury_${MONTHS_FULL[month - 1].toLowerCase()}_${year}.csv`;
    a.click(); URL.revokeObjectURL(url);
}

const TABS = ['TREASURY', 'WISH LIST'];

export default function FinanceDashboard({ initialBudget, currentMonth, currentYear }) {
    const [activeTab, setActiveTab] = useState('TREASURY');
    const [budget, setBudget] = useState(initialBudget);
    const [month, setMonth] = useState(currentMonth);
    const [year, setYear] = useState(currentYear);
    const [prevBudget, setPrevBudget] = useState(null);
    const [isPending, startTransition] = useTransition();
    const [editingMeta, setEditingMeta] = useState(false);
    const [incomeInput, setIncomeInput] = useState(budget?.income || '');
    const [goalInput, setGoalInput] = useState(budget?.savingsGoal || '');
    const [goals, setGoals] = useState([]);

    useEffect(() => {
        getFinanceGoals().then(setGoals);
    }, []);

    // Fixed expense form
    const [showFixedForm, setShowFixedForm] = useState(false);
    const [fixedName, setFixedName] = useState('');
    const [fixedAmount, setFixedAmount] = useState('');
    const [fixedCat, setFixedCat] = useState('OTHER');
    const [fixedNote, setFixedNote] = useState('');       // #17
    const [fixedRecurring, setFixedRecurring] = useState(false); // #12
    const [fixedEmiTotal, setFixedEmiTotal] = useState('');      // #10
    const [fixedEmiPaid, setFixedEmiPaid] = useState('');        // #10

    // Variable expense form
    const [showVarForm, setShowVarForm] = useState(false);
    const [varName, setVarName] = useState('');
    const [varAmount, setVarAmount] = useState('');
    const [varCat, setVarCat] = useState('OTHER');
    const [varNote, setVarNote] = useState('');  // #17

    // Feature #4 — Floating quick-log sheet
    const [quickLog, setQuickLog] = useState(false);

    const [savingsModal, setSavingsModal] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showAnnual, setShowAnnual] = useState(false);

    // Monthly Settlement
    const [showSettlement, setShowSettlement] = useState(false);
    const [settleToAssetId, setSettleToAssetId] = useState('');
    const [assets, setAssets] = useState([]);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, type: null, name: '' });


    useEffect(() => {
        if (showSettlement) {
            getNetWorthAssets().then(setAssets);
        }
    }, [showSettlement]);

    const handleSettle = async () => {
        if (!settleToAssetId) return;
        const res = await settleSavingsToNetWorth(budget.id, parseInt(settleToAssetId));
        if (res.success) {
            alert(`Successfully settled ${fmt(res.settledAmount)} !`);
            setShowSettlement(false);
            const newBudget = await getOrCreateBudgetWithCaps(month, year);
            setBudget(newBudget);
        } else {
            alert("Settlement failed. Ensure you have positive savings.");
        }
    };

    const totalFixed = (budget?.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
    const totalVariable = (budget?.variableExpenses || []).reduce((s, e) => s + e.amount, 0);
    const income = budget?.income || 0;
    const savingsGoal = budget?.savingsGoal || 0;
    const remaining = income - totalFixed - totalVariable;
    const actualSavings = Math.max(0, remaining);
    const savingsPct = savingsGoal > 0 ? Math.min(100, Math.round((actualSavings / savingsGoal) * 100)) : 0;
    const goalMet = actualSavings >= savingsGoal && savingsGoal > 0;
    const monthlyExpenses = totalFixed + totalVariable;

    // Only true when the viewed month has completely passed — savings can still change mid-month
    const now = new Date();
    const isMonthComplete = year < now.getFullYear() ||
        (year === now.getFullYear() && month < now.getMonth() + 1);

    const pieData = income > 0 ? [
        { name: 'Fixed', value: totalFixed },
        { name: 'Variable', value: totalVariable },
        { name: 'Remaining', value: Math.max(0, remaining) },
    ].filter(d => d.value > 0) : [];

    async function switchMonth(m, y) {
        setMonth(m); setYear(y);
        // Fetch prev month for #2 comparison
        const prevM = m === 1 ? 12 : m - 1;
        const prevY = m === 1 ? y - 1 : y;
        const [newBudget, prev] = await Promise.all([
            getOrCreateBudgetWithCaps(m, y),
            getOrCreateBudgetWithCaps(prevM, prevY)
        ]);
        setBudget(newBudget);
        setPrevBudget(prev);
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
        await addFixedExpense(
            budget.id, fixedName, fixedAmount, fixedCat,
            fixedNote, fixedRecurring,
            fixedEmiTotal ? parseInt(fixedEmiTotal) : null,
            fixedEmiPaid ? parseInt(fixedEmiPaid) : 0
        );
        const newBudget = await getOrCreateBudgetWithCaps(month, year);
        setBudget(newBudget);
        setFixedName(''); setFixedAmount(''); setFixedCat('OTHER');
        setFixedNote(''); setFixedRecurring(false); setFixedEmiTotal(''); setFixedEmiPaid('');
        setShowFixedForm(false);
    }

    async function handleTogglePaid(id) {
        await toggleFixedPaid(id);
        setBudget(b => ({ ...b, fixedExpenses: b.fixedExpenses.map(e => e.id === id ? { ...e, isPaid: !e.isPaid } : e) }));
    }

    async function handleDeleteFixed(id) {
        setConfirmDelete({ show: true, id, type: 'FIXED', name: budget.fixedExpenses.find(e => e.id === id)?.name || '' });
    }

    async function executeDeleteFixed(id) {
        await deleteFixedExpense(id);
        setBudget(b => ({ ...b, fixedExpenses: b.fixedExpenses.filter(e => e.id !== id) }));
        setConfirmDelete({ show: false, id: null, type: null, name: '' });
    }


    async function handleAddVariable() {
        if (!varName || !varAmount || !budget) return;
        await addVariableExpense(budget.id, varName, varAmount, varCat, varNote);
        const newBudget = await getOrCreateBudgetWithCaps(month, year);
        setBudget(newBudget);
        setVarName(''); setVarAmount(''); setVarCat('OTHER'); setVarNote('');
        setShowVarForm(false);
    }

    async function handleDeleteVariable(id) {
        setConfirmDelete({ show: true, id, type: 'VARIABLE', name: budget.variableExpenses.find(e => e.id === id)?.name || '' });
    }

    async function executeDeleteVariable(id) {
        await deleteVariableExpense(id);
        setBudget(b => ({ ...b, variableExpenses: b.variableExpenses.filter(e => e.id !== id) }));
        setConfirmDelete({ show: false, id: null, type: null, name: '' });
    }


    // Feature #4 — Quick Log submit
    async function handleQuickLog() {
        if (!quickAmount || !budget) return;
        await addVariableExpense(budget.id, quickName || quickCat, quickAmount, quickCat, '');
        const newBudget = await getOrCreateBudgetWithCaps(month, year);
        setBudget(newBudget);
        setQuickAmount(''); setQuickName(''); setQuickCat('FOOD');
        setQuickLog(false);
    }

    // Feature #12 — Copy recurring
    async function handleCopyRecurring() {
        if (!prevBudget || !budget) return;
        const res = await copyRecurringExpenses(prevBudget.id, budget.id);
        if (res.success) {
            const newBudget = await getOrCreateBudgetWithCaps(month, year);
            setBudget(newBudget);
        }
    }

    async function handleCheckSavings() {
        if (!budget) return;
        const result = await checkAndAwardSavingsXP(budget.id);
        if (result.xpAwarded) setSavingsModal(true);
    }

    async function refreshBudget() {
        const newBudget = await getOrCreateBudgetWithCaps(month, year);
        setBudget(newBudget);
    }

    const [showAllTransactions, setShowAllTransactions] = useState(false);

    // const transactions = [...(budget?.variableExpenses || [])].sort(
    //     (a, b) => new Date(b.date) - new Date(a.date)
    // );
    const transactions = [...(budget?.variableExpenses || [])].reverse()

    const visibleTransactions = showAllTransactions
        ? transactions
        : transactions.slice(0, 5);

    const inputClass = "w-full rounded border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500";
    const selectClass = "rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500";

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            {/* Savings Modal */}
            {savingsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-xl border border-green-500/30 bg-zinc-900 p-8 shadow-2xl text-center">
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-green-500 to-transparent rounded-t-xl" />
                        <div className="text-5xl mb-4">⚡</div>
                        <p className="text-xs font-mono text-green-400 tracking-widest uppercase mb-2">System Alert</p>
                        <h2 className="text-2xl font-bold mb-2">SAVINGS PROTOCOL COMPLETE</h2>
                        <p className="text-zinc-400 text-sm mb-1 font-mono">Financial discipline acknowledged.</p>
                        <p className="text-green-400 font-bold text-lg mb-6 font-mono">+500 XP AWARDED</p>
                        <button onClick={() => setSavingsModal(false)} className="cursor-pointer px-6 py-2 rounded border border-green-500/40 text-green-400 hover:bg-green-500/10 font-mono transition-colors">ACKNOWLEDGE</button>
                    </div>
                </div>
            )}

            {/* Deletion Confirmation Modal */}
            {confirmDelete.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertTriangle size={24} />
                            <h3 className="font-mono text-sm font-bold uppercase tracking-widest">DELETION_PROTOCOL</h3>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
                            Are you sure you want to delete <span className="text-white font-bold">"{confirmDelete.name}"</span>?
                            This action cannot be reverted by the System.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete({ show: false, id: null, type: null, name: '' })}
                                className="flex-1 py-1.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-900 font-mono text-[9px] uppercase tracking-widest transition-all"
                            >
                                ABORT
                            </button>
                            <button
                                onClick={() => confirmDelete.type === 'FIXED' ? executeDeleteFixed(confirmDelete.id) : executeDeleteVariable(confirmDelete.id)}
                                className="flex-1 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[9px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                            >
                                CONFIRM_DELETE
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Advanced Panel */}

            {showAdvanced && <AdvancedFinancePanel
                onClose={() => setShowAdvanced(false)}
                monthlySavings={actualSavings}
                monthlyExpenses={monthlyExpenses}
            />}

            {/* Settlement Modal */}
            {showSettlement && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-mono text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><PiggyBank size={18} className="text-green-500" /> MONTHLY_SETTLEMENT</h3>
                            <button onClick={() => setShowSettlement(false)} className="text-zinc-500 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
                            You have <span className="text-green-400 font-bold">{fmt(actualSavings)}</span> remaining in your budget.
                            Select a Net Worth asset to deposit these savings into.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-mono text-zinc-600 uppercase">Target Asset Protocol</label>
                                <select
                                    value={settleToAssetId}
                                    onChange={e => setSettleToAssetId(e.target.value)}
                                    className="w-full rounded border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-white font-mono focus:border-green-500 focus:outline-none"
                                >
                                    <option value="">-- SELECT ASSET --</option>
                                    {assets.filter(a => a.type === 'SAVINGS' || a.type === 'CASH').map(a => (
                                        <option key={a.id} value={a.id}>{a.name} ({fmt(a.amount)})</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                disabled={!settleToAssetId}
                                onClick={handleSettle}
                                className="w-full py-3 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-30 disabled:hover:bg-green-600 text-white font-mono font-bold text-xs uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] active:scale-95"
                            >
                                EXECUTE_SETTLEMENT
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature #4 — Quick Log (new numpad drawer) */}
            {quickLog && (
                <QuickExpenseLogger
                    onClose={() => setQuickLog(false)}
                    recentExpenses={budget?.variableExpenses || []}
                    onSubmit={async (name, amount, category) => {
                        await addVariableExpense(budget.id, name, amount, category, '');
                        const newBudget = await getOrCreateBudgetWithCaps(month, year);
                        setBudget(newBudget);
                    }}
                />
            )}

            <div className="max-w-6xl mx-auto p-6 space-y-8">
                {/* Tab Navigation */}
                <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/60 p-1.5">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                'cursor-pointer flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-mono font-bold uppercase tracking-widest transition-all',
                                activeTab === tab
                                    ? tab === 'WISH LIST'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            )}
                        >
                            {tab === 'WISH LIST' && <ShoppingBag size={12} />}
                            {tab === 'TREASURY' && <Wallet size={12} />}
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Wish List Tab */}
                {activeTab === 'WISH LIST' && (
                    <ShortTermGoals
                        goals={goals}
                        setGoals={setGoals}
                        monthlySavings={actualSavings}
                    />
                )}

                {activeTab === 'TREASURY' && <>
                    {/* Header */}
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-mono text-zinc-500 tracking-widest uppercase">System Module</p>
                            <h1 className="text-3xl font-bold flex items-center gap-3">
                                <Wallet className="text-blue-400" size={28} />
                                Treasury Intelligence
                            </h1>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <select value={month} onChange={e => switchMonth(parseInt(e.target.value), year)} className={selectClass}>
                                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                            </select>
                            <input type="number" value={year} onChange={e => switchMonth(month, parseInt(e.target.value))}
                                className="w-20 rounded border border-zinc-700 bg-zinc-800 px-2 py-1.5 text-xs text-white font-mono focus:outline-none" />
                            {/* Feature #20 — CSV Export */}
                            <button onClick={() => exportToCSV(budget, month, year)}
                                className="cursor-pointer flex items-center gap-1 text-xs font-mono border border-zinc-600 text-zinc-400 px-3 py-1.5 rounded hover:bg-zinc-800 transition-colors">
                                <FileDown size={12} /> CSV
                            </button>
                            <button onClick={() => setShowAdvanced(true)}
                                className="cursor-pointer relative flex items-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/5 px-4 py-2 text-xs font-bold font-mono text-yellow-400 transition-all hover:bg-yellow-500/15 hover:border-yellow-400 hover:shadow-[0_0_20px_rgba(234,179,8,0.2)] group">
                                <FlaskConical size={14} className="group-hover:animate-bounce" />
                                ADVANCED
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                                </span>
                            </button>
                            {actualSavings > 0 && (
                                <button onClick={() => setShowSettlement(true)}
                                    className="cursor-pointer flex items-center gap-2 rounded-lg border border-green-500/40 bg-green-500/5 px-4 py-2 text-xs font-bold font-mono text-green-400 transition-all hover:bg-green-500/15 hover:border-green-400 group">
                                    <PiggyBank size={14} className="group-hover:animate-bounce" />
                                    SETTLE
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Income / Savings Goal */}
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

                    {/* Stat Cards */}
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <StatCard icon={Wallet} label="Monthly Income" value={fmt(income)} color="blue" sub="Base salary" />
                        <StatCard icon={TrendingDown} label="Fixed Obligations" value={fmt(totalFixed)} color="red"
                            sub={`${(budget?.fixedExpenses || []).filter(e => e.isPaid).length}/${(budget?.fixedExpenses || []).length} paid`} />
                        <StatCard icon={ShoppingCart} label="Variable Spent" value={fmt(totalVariable)} color="yellow"
                            sub={`${(budget?.variableExpenses || []).length} transactions`} />
                        <StatCard icon={Landmark} label="Free to Spend" value={fmt(remaining)} color={remaining >= 0 ? 'green' : 'red'}
                            sub={remaining < 0 ? '⚠ Over budget!' : 'Balance remaining'} />
                    </div>

                    {/* Feature #5 — Spending Velocity */}
                    <SpendingVelocity variableExpenses={budget?.variableExpenses || []} income={income} totalFixed={totalFixed} />

                    {/* Savings Progress + Donut */}
                    <div className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300 font-mono">Savings Progress</h3>
                                {goalMet && !budget?.xpAwarded && isMonthComplete && (
                                    <button onClick={handleCheckSavings} className="cursor-pointer flex items-center gap-1 text-xs font-mono bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500 transition-colors">
                                        <Zap size={12} /> CLAIM 500 XP
                                    </button>
                                )}
                                {budget?.xpAwarded && <span className="text-xs font-mono text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> XP Claimed</span>}
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-mono">
                                    <span className="text-zinc-400">Actual Savings</span>
                                    <span className={cn("font-bold", goalMet ? "text-green-400" : "text-yellow-400")}>{fmt(actualSavings)}</span>
                                </div>
                                <div className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all duration-700", goalMet ? "bg-green-500" : "bg-blue-500")} style={{ width: `${savingsPct}%` }} />
                                </div>
                                <div className="flex justify-between text-xs text-zinc-500 font-mono">
                                    <span>{savingsPct}% of goal</span><span>Goal: {fmt(savingsGoal)}</span>
                                </div>
                            </div>
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
                        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-5 flex flex-col gap-2">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 size={16} className="text-zinc-400" />
                                <h3 className="font-bold text-sm uppercase tracking-widest text-zinc-300 font-mono">Allocation Breakdown</h3>
                            </div>
                            {pieData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
                                            {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend formatter={(v) => <span className="text-xs text-zinc-400 font-mono">{v}</span>} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-zinc-600 text-sm font-mono">Set income to see chart</div>
                            )}
                        </div>
                    </div>

                    {/* Analytics Row — #1, #8, #7 */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
                            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Category Breakdown</p>
                            <CategoryBarChart variableExpenses={budget?.variableExpenses || []} fixedExpenses={budget?.fixedExpenses || []} />
                        </div>
                        <WeeklyDigest variableExpenses={budget?.variableExpenses || []} income={income} totalFixed={totalFixed} />
                        <TopSpendingDays variableExpenses={budget?.variableExpenses || []} />
                    </div>

                    {/* #11 Emergency Fund + #6 Caps + #2 Month Comparison */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <EmergencyFundTracker monthlyExpenses={monthlyExpenses} totalLiquid={actualSavings} />
                        {budget && (
                            <CategoryCaps
                                budgetId={budget.id}
                                caps={budget.categoryBudgetCaps || []}
                                variableExpenses={budget.variableExpenses || []}
                                fixedExpenses={budget.fixedExpenses || []}
                                onUpdate={refreshBudget}
                            />
                        )}
                        {prevBudget ? (
                            <MonthComparison current={budget} previous={prevBudget} />
                        ) : (
                            <div className="rounded-xl border border-dashed border-zinc-700 p-4 flex items-center justify-center">
                                <p className="text-xs text-zinc-600 font-mono text-center">Switch months to see<br />month-over-month comparison</p>
                            </div>
                        )}
                    </div>

                    {/* #14 — Treasury Report Card */}
                    {budget && income > 0 && <TreasuryReportCard budget={budget} month={month} year={year} isMonthComplete={isMonthComplete} />}

                    {/* Fixed Obligations */}
                    <div className="group relative rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-md overflow-hidden">
                        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/5 to-transparent transition-opacity" />

                        {/* HUD Corners */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20 rounded-tl-sm" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-white/20 rounded-tr-sm" />

                        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
                            <div>
                                <h3 className="font-bold tracking-[0.2em] text-[10px] uppercase font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">Fixed Obligations</h3>
                                <p className="text-[10px] text-zinc-600 font-mono italic">Primary System Drain</p>
                            </div>
                            <div className="flex gap-2">
                                {prevBudget && (
                                    <button onClick={handleCopyRecurring} className="cursor-pointer flex items-center gap-1.5 text-[10px] font-mono border border-zinc-700/50 text-zinc-500 px-3 py-1.5 rounded-lg hover:bg-white/5 hover:text-white transition-all" title="Copy recurring from last month">
                                        <RefreshCw size={11} /> RECUR
                                    </button>
                                )}
                                <button onClick={() => setShowFixedForm(v => !v)} className="cursor-pointer flex items-center gap-1.5 text-[10px] font-mono bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all">
                                    <Plus size={12} /> ADD FIXED
                                </button>
                            </div>
                        </div>

                        {showFixedForm && (
                            <div className="relative z-10 border-b border-zinc-700/50 px-5 py-5 bg-black/40 space-y-3">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <input value={fixedName} onChange={e => setFixedName(e.target.value)} placeholder="Description" className={cn(inputClass, "flex-1")} />
                                    <input type="number" value={fixedAmount} onChange={e => setFixedAmount(e.target.value)} placeholder="₹ Amount" className={cn(inputClass, "w-32")} />
                                    <select value={fixedCat} onChange={e => setFixedCat(e.target.value)} className={selectClass}>
                                        {FIXED_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                                <input value={fixedNote} onChange={e => setFixedNote(e.target.value)} placeholder="Note (optional)" className={inputClass} />
                                <div className="flex flex-wrap gap-4 items-center">
                                    <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 cursor-pointer">
                                        <input type="checkbox" checked={fixedRecurring} onChange={e => setFixedRecurring(e.target.checked)} className="accent-blue-500 h-3 w-3" />
                                        RECURRING PROTOCOL
                                    </label>
                                    <div className="flex-1 flex gap-2">
                                        <input type="number" value={fixedEmiTotal} onChange={e => setFixedEmiTotal(e.target.value)} placeholder="Total Months" className={cn(inputClass, "flex-1")} />
                                        <input type="number" value={fixedEmiPaid} onChange={e => setFixedEmiPaid(e.target.value)} placeholder="Paid" className={cn(inputClass, "w-24")} />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={() => setShowFixedForm(false)} className="cursor-pointer px-4 py-2 text-[10px] font-mono text-zinc-500 hover:text-white uppercase transition-colors">Cancel</button>
                                    <button onClick={handleAddFixed} className="cursor-pointer px-6 py-2 text-[10px] font-bold font-mono bg-blue-600 text-white rounded hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">CONFIRM ADDITION</button>
                                </div>
                            </div>
                        )}

                        <div className="relative z-10 divide-y divide-zinc-800/50">
                            {(budget?.fixedExpenses || []).length === 0 && (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-[10px] text-zinc-600 font-mono italic uppercase tracking-widest">No primary drains detected.</p>
                                </div>
                            )}
                            {(budget?.fixedExpenses || []).map(exp => {
                                const emiLeft = exp.emiMonthsTotal ? exp.emiMonthsTotal - (exp.emiMonthsPaid || 0) : null;
                                return (
                                    <div key={exp.id} className={cn("group/item flex items-center gap-4 px-5 py-3.5 transition-all hover:bg-white/2 relative", exp.isPaid && "opacity-40")}>
                                        <div className="absolute inset-y-0 left-0 w-0.5 bg-blue-500 scale-y-0 group-hover/item:scale-y-100 transition-transform origin-top duration-300" />

                                        <button onClick={() => handleTogglePaid(exp.id)} className="cursor-pointer shrink-0 text-zinc-700 hover:text-green-500 transition-all">
                                            {exp.isPaid ? <CheckCircle2 size={20} className="text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]" /> : <Circle size={20} />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn("text-sm font-mono tracking-tight", exp.isPaid && "line-through text-zinc-600")}>{exp.name}</p>
                                            <div className="flex items-center gap-3 mt-1 cursor-default">
                                                {exp.isRecurring && <span className="text-[8px] text-blue-400 font-bold font-mono border border-blue-500/20 px-1.5 py-0.5 rounded-sm bg-blue-500/5">RECURRING</span>}
                                                {emiLeft !== null && (
                                                    <span className="flex items-center gap-1 text-[8px] text-orange-400 font-bold font-mono border border-orange-500/20 px-1.5 py-0.5 rounded-sm bg-orange-500/5">
                                                        <Clock size={8} /> {emiLeft}M REMAINING
                                                    </span>
                                                )}
                                                {exp.note && <span className="text-[9px] text-zinc-600 font-mono truncate max-w-[150px] group-hover/item:text-zinc-400 transition-colors">[{exp.note}]</span>}
                                            </div>
                                        </div>
                                        <CategoryBadge cat={exp.category} />
                                        <p className="text-sm font-bold font-mono text-red-400 w-24 text-right transition-all group-hover/item:scale-105">{fmt(exp.amount)}</p>
                                        <button onClick={() => handleDeleteFixed(exp.id)} className="cursor-pointer text-zinc-800 hover:text-red-500 transition-all p-1.5 rounded opacity-0 group-hover/item:opacity-100 hover:bg-red-500/10">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                            {(budget?.fixedExpenses || []).length > 0 && (
                                <div className="flex justify-end px-5 py-4 bg-zinc-950/20 border-t border-zinc-800/30">
                                    <span className="text-[10px] text-zinc-500 font-mono mr-4 tracking-widest uppercase mt-1">Total Obligations</span>
                                    <span className="text-lg font-black font-mono text-red-400">{fmt(totalFixed)}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Variable Expenses */}


                    <div className="group relative rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-md overflow-hidden">

                        <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/5 to-transparent transition-opacity" />

                        {/* HUD Corners */}
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-white/20 rounded-bl-sm" />
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 rounded-br-sm" />

                        {/* Header */}
                        <div className="relative z-10 flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
                            <div>
                                <h3 className="font-bold tracking-[0.2em] text-[10px] uppercase font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">
                                    Tactical Expenditure
                                </h3>
                                <p className="text-[10px] text-zinc-600 font-mono italic">
                                    Daily Sector Activity
                                </p>
                            </div>

                            <button
                                onClick={() => setQuickLog(true)}
                                className="cursor-pointer flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-[10px] font-bold font-mono text-yellow-400 hover:bg-yellow-500/20 transition-all shadow-lg shadow-yellow-500/10 active:scale-95"
                            >
                                <Plus size={14} /> SYSTEM LOG
                            </button>
                        </div>

                        {/* Transactions */}
                        <div className="relative z-10 divide-y divide-zinc-800/50">

                            {transactions.length === 0 && (
                                <div className="px-5 py-12 text-center">
                                    <p className="text-[10px] text-zinc-600 font-mono italic uppercase tracking-widest">
                                        No sector activity recorded.
                                    </p>
                                </div>
                            )}

                            {visibleTransactions.map(exp => (
                                <div
                                    key={exp.id}
                                    className="group/item flex items-center gap-4 px-5 py-4 transition-all hover:bg-white/2 relative"
                                >

                                    <div className="absolute inset-y-0 left-0 w-0.5 bg-yellow-500 scale-y-0 group-hover/item:scale-y-100 transition-transform origin-top duration-300" />

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-mono tracking-tight group-hover/item:text-white transition-colors">
                                            {exp.name}
                                        </p>

                                        <div className="flex items-center gap-3 mt-1 cursor-default">
                                            <div className="flex items-center gap-1 text-[9px] text-zinc-600 font-mono uppercase tracking-tighter">
                                                <CalendarDays size={10} />
                                                {new Date(exp.date).toLocaleDateString('en-IN', {
                                                    day: '2-digit',
                                                    month: 'short'
                                                })}
                                            </div>

                                            {exp.note && (
                                                <p className="text-[9px] text-zinc-500 italic font-mono truncate max-w-[200px] border-l border-zinc-800 pl-3">
                                                    [{exp.note}]
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <CategoryBadge cat={exp.category} />

                                    <p className="text-sm font-bold font-mono text-yellow-400 w-24 text-right transition-all group-hover/item:scale-105">
                                        {fmt(exp.amount)}
                                    </p>

                                    <button
                                        onClick={() => handleDeleteVariable(exp.id)}
                                        className="cursor-pointer text-zinc-800 hover:text-red-500 transition-all p-1.5 rounded opacity-0 group-hover/item:opacity-100 hover:bg-red-500/10"
                                    >
                                        <Trash2 size={14} />
                                    </button>

                                </div>
                            ))}

                            {/* See More / Less */}
                            {transactions.length > 5 && (
                                <div className="flex justify-center py-3 border-t border-zinc-800/50">
                                    <button
                                        onClick={() => setShowAllTransactions(prev => !prev)}
                                        className="text-[10px] font-mono text-yellow-400 uppercase tracking-widest hover:text-yellow-300 transition"
                                    >
                                        {showAllTransactions ? "Show Less ▲" : "See More ▼"}
                                    </button>
                                </div>
                            )}

                            {/* Total */}
                            {transactions.length > 0 && (
                                <div className="flex justify-end px-5 py-4 bg-zinc-950/20 border-t border-zinc-800/30">
                                    <span className="text-[10px] text-zinc-500 font-mono mr-4 tracking-widest uppercase mt-1">
                                        Tactical Total
                                    </span>
                                    <span className="text-lg font-black font-mono text-yellow-400">
                                        {fmt(totalVariable)}
                                    </span>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* Feature #19 — Annual View (collapsible) */}
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 overflow-hidden">
                        <button onClick={() => setShowAnnual(v => !v)}
                            className="cursor-pointer w-full flex items-center justify-between px-5 py-4 hover:bg-zinc-800/30 transition-colors">
                            <div className="flex items-center gap-2">
                                <CalendarDays size={16} className="text-zinc-400" />
                                <span className="font-bold text-sm uppercase tracking-widest font-mono">Annual View — {year}</span>
                            </div>
                            {showAnnual ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
                        </button>
                        {showAnnual && (
                            <div className="px-5 pb-5">
                                <p className="text-xs text-zinc-600 font-mono mb-3">🟢 Green = Savings month · 🔴 Red = Expense bar · Snapshot auto-logs when you visit each month</p>
                                <AnnualView year={year} />
                            </div>
                        )}
                    </div>

                </>}
            </div>

            {/* Feature #4 — Floating Quick-Log FAB */}
            <div className="fixed bottom-10 right-10 z-100 group pointer-events-auto">
                <button
                    onClick={() => setQuickLog(true)}
                    className="cursor-pointer flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-zinc-900 shadow-[0_0_50px_rgba(234,179,8,0.5)] hover:bg-yellow-300 transition-all hover:scale-110 active:scale-95 border-4 border-zinc-950 relative"
                >
                    <Plus size={32} strokeWidth={3} />
                    <div className="absolute -top-10 right-0 bg-yellow-400 text-zinc-900 text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none uppercase tracking-tighter shadow-xl border border-zinc-900/10">
                        Quick Log
                    </div>
                </button>
            </div>
        </div >
    );
}
