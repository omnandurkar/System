'use client';

import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Plus, Trash2, Edit2, Save, X, Unlock, Lock, AlertTriangle,
    Briefcase, Landmark, Shield, TrendingUp, TrendingDown,
    PiggyBank, Coins, HeartPulse, Zap, Info, ArrowUpRight,
    Search, Filter, LayoutGrid, List
} from 'lucide-react';
import {
    addNetWorthAsset, updateNetWorthAsset, deleteNetWorthAsset,
    getNetWorthAssets, saveNetWorthSnapshot, getNetWorthHistory
} from '@/app/finance-actions';
import { cn } from '@/lib/utils';

const ASSET_TYPES = ['SAVINGS', 'FD', 'SIP', 'STOCKS', 'PF', 'CRYPTO', 'CASH', 'GOLD', 'LOAN_GIVEN', 'OTHER'];

const CATEGORIES = {
    BANKING: { label: 'Bank Accounts', icon: Landmark, color: 'text-blue-400', types: ['SAVINGS'] },
    INVESTMENTS: { label: 'Investments', icon: Briefcase, color: 'text-green-400', types: ['SIP', 'STOCKS', 'FD', 'PF', 'CRYPTO'] },
    PHYSICAL: { label: 'Physical Assets', icon: Coins, color: 'text-yellow-400', types: ['CASH', 'GOLD'] },
    RECEIVABLES: { label: 'Receivables', icon: PiggyBank, color: 'text-purple-400', types: ['LOAN_GIVEN'] },
};

const BANK_DATA = {
    HDFC: { color: '#004c8f', logo: 'H' },
    SBI: { color: '#2b95d1', logo: 'S' },
    ICICI: { color: '#f5821f', logo: 'I' },
    AXIS: { color: '#97124b', logo: 'A' },
    KOTAK: { color: '#ee1c25', logo: 'K' },
    IDFC: { color: '#9b1c1c', logo: 'I' },
    DEFAULT: { color: '#3f3f46', logo: 'B' }
};

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

// Bank Logo Helper
function BankLogo({ name }) {
    const key = Object.keys(BANK_DATA).find(k => name.toUpperCase().includes(k));
    const data = BANK_DATA[key] || BANK_DATA.DEFAULT;
    return (
        <div
            className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-inner"
            style={{ backgroundColor: data.color }}
        >
            {data.logo}
        </div>
    );
}

// Advanced Intelligence Metric Component
function MetricCard({ label, value, sub, icon: Icon, trend, colorClass }) {
    return (
        <div className="group relative rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 hover:border-white/10 transition-all overflow-hidden">
            <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
                <Icon size={14} className={cn("text-zinc-600 transition-colors group-hover:text-white", colorClass)} />
            </div>
            <p className="text-lg font-bold font-mono tracking-tight">{value}</p>
            {sub && (
                <div className="flex items-center gap-1 mt-1">
                    {trend === 'up' && <TrendingUp size={10} className="text-green-400" />}
                    {trend === 'down' && <TrendingDown size={10} className="text-red-400" />}
                    <span className="text-[9px] font-mono text-zinc-600">{sub}</span>
                </div>
            )}
            <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-white/20 transition-all duration-500 group-hover:w-full" />
        </div>
    );
}

export default function NetWorthHub({ assets, setAssets, monthlySavings, monthlyExpenses }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'SAVINGS', amount: '', investedAmount: '', isLiquid: true, maturityDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [history, setHistory] = useState([]);
    const [viewMode, setViewMode] = useState('GRID'); // GRID or LIST

    const totalNetWorth = assets.reduce((s, a) => s + a.amount, 0);
    const totalLiquid = assets.filter(a => a.isLiquid).reduce((s, a) => s + a.amount, 0);

    // --- ADVANCED METRICS ---
    const survivalMonths = monthlyExpenses > 0 ? (totalLiquid / monthlyExpenses).toFixed(1) : '∞';

    // Wealth Velocity (NW Growth)
    const lastMonthValue = history.length > 2 ? history[history.length - 2].value : totalNetWorth;
    const wealthVelocity = lastMonthValue > 0 ? ((totalNetWorth - lastMonthValue) / lastMonthValue * 100).toFixed(1) : 0;

    // Asset Concentration
    const maxAsset = assets.length > 0 ? Math.max(...assets.map(a => a.amount)) : 0;
    const concentrationRisk = totalNetWorth > 0 ? (maxAsset / totalNetWorth * 100) : 0;
    const highestAsset = assets.find(a => a.amount === maxAsset)?.name || 'None';

    // FI Progress (Assuming 25x annual expenses rule)
    const annualBurn = (monthlyExpenses || 50000) * 12;
    const fiTarget = annualBurn * 25;
    const fiProgress = Math.min(100, (totalNetWorth / fiTarget * 100)).toFixed(1);

    // Lifestyle Creep (Simplified: current expense ratio indicator)
    const currentBurnRate = (monthlyExpenses + monthlySavings) > 0 ? (monthlyExpenses / (monthlyExpenses + monthlySavings) * 100) : 0;
    const creep = currentBurnRate.toFixed(1); // Percent of income spent


    useEffect(() => {
        getNetWorthHistory().then(setHistory);
    }, []);

    async function handleAdd() {
        if (!form.name || !form.amount) return;
        await addNetWorthAsset(form.name, form.type, form.amount, form.isLiquid, form.maturityDate || null, '', form.investedAmount || 0);
        const updated = await getNetWorthAssets();
        setAssets(updated);
        saveNetWorthSnapshot(updated.reduce((s, a) => s + a.amount, 0));
        setForm({ name: '', type: 'SAVINGS', amount: '', investedAmount: '', isLiquid: true, maturityDate: '' });
        setShowForm(false);
        getNetWorthHistory().then(setHistory);
    }

    async function handleUpdate(id) {
        await updateNetWorthAsset(id, editAmount);
        setAssets(prev => prev.map(a => a.id === id ? { ...a, amount: parseFloat(editAmount) } : a));
        setEditingId(null);
        getNetWorthHistory().then(setHistory);
    }

    async function handleDelete(id) {
        await deleteNetWorthAsset(id);
        const updated = await getNetWorthAssets();
        setAssets(updated);
        getNetWorthHistory().then(setHistory);
    }

    const inp = "rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 w-full";
    const sel = "rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1.5 text-xs text-white font-mono focus:outline-none";

    return (
        <div className="space-y-6">
            {/* Top Stat Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <MetricCard
                    label="Survival Duration"
                    value={`${survivalMonths} Mo`}
                    sub="Until bankruptcy"
                    icon={Shield}
                    colorClass={parseFloat(survivalMonths) > 6 ? 'text-green-400' : 'text-red-400'}
                />
                <MetricCard
                    label="Wealth Velocity"
                    value={`${wealthVelocity}%`}
                    sub="Net Worth growth"
                    icon={Zap}
                    trend={parseFloat(wealthVelocity) >= 0 ? 'up' : 'down'}
                    colorClass="text-yellow-400"
                />
                <MetricCard
                    label="FI Progress"
                    value={`${fiProgress}%`}
                    sub={`Target: ${fmt(fiTarget)}`}
                    icon={ArrowUpRight}
                    colorClass="text-blue-400"
                />
                <MetricCard
                    label="Lifestyle Creep"
                    value={creep > 0.05 ? "ALERT" : "STABLE"}
                    sub={creep > 0 ? `+${(creep * 100).toFixed(1)}% burn` : "OPTIMIZED"}
                    icon={HeartPulse}
                    trend={creep > 0 ? 'up' : 'down'}
                    colorClass={creep > 0.05 ? 'text-red-400' : 'text-green-400'}
                />
                <MetricCard
                    label="Concentration"
                    value={`${concentrationRisk.toFixed(0)}%`}
                    sub={`Dominant: ${highestAsset}`}
                    icon={AlertTriangle}
                    colorClass={concentrationRisk > 40 ? 'text-red-400' : 'text-zinc-600'}
                />
            </div>

            {/* Asset Allocation & History */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">Net Worth Snapshot</p>
                            <Landmark size={14} className="text-zinc-700" />
                        </div>
                        <p className="text-3xl font-black font-mono text-white tracking-tighter">{fmt(totalNetWorth)}</p>
                        <div className="mt-4 space-y-2">
                            <div className="flex justify-between text-xs font-mono">
                                <span className="text-zinc-500">LIQUID RESERVES</span>
                                <span className="text-green-400">{fmt(totalLiquid)}</span>
                            </div>
                            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all duration-1000 shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                                    style={{ width: `${(totalLiquid / totalNetWorth) * 100}%` }}
                                />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-zinc-600">
                                <span>LOCKED: {fmt(totalNetWorth - totalLiquid)}</span>
                                <span>{((totalLiquid / totalNetWorth) * 100 || 0).toFixed(0)}% LIQUID</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-4">Intelligence History</p>
                    <div className="h-32">
                        {history.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={history}>
                                    <defs>
                                        <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Tooltip
                                        formatter={v => fmt(v)}
                                        contentStyle={{ background: '#09090b', border: '1px border #27272a', borderRadius: 8, fontFamily: 'monospace', fontSize: 10 }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#nwGrad)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[10px] text-zinc-700 font-mono">INSIGINIFICANT DATA POINTS</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Categorized Assets */}
            <div className="space-y-6">
                {Object.entries(CATEGORIES).map(([key, cat]) => {
                    const catAssets = assets.filter(a => cat.types.includes(a.type));
                    if (catAssets.length === 0 && !showForm) return null;
                    const catTotal = catAssets.reduce((s, a) => s + a.amount, 0);

                    return (
                        <div key={key} className="relative group">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <div className="flex items-center gap-2">
                                    <cat.icon size={16} className={cat.color} />
                                    <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-zinc-200">{cat.label}</h3>
                                    <span className="text-[10px] font-mono text-zinc-600">/ {catAssets.length} UNITS</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-mono font-bold text-zinc-400">{fmt(catTotal)}</span>
                                    <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full", cat.color.replace('text', 'bg'))}
                                            style={{ width: `${(catTotal / totalNetWorth) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {catAssets.map(a => (
                                    <div key={a.id} className="relative group/item rounded-xl border border-zinc-800/50 bg-zinc-900/30 p-4 hover:bg-zinc-800/20 hover:border-zinc-700 transition-all">
                                        <div className="flex items-center gap-3">
                                            {key === 'BANKING' ? <BankLogo name={a.name} /> : <div className="w-6 h-6 rounded bg-zinc-800 flex items-center justify-center"><Coins size={12} className="text-zinc-500" /></div>}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-mono font-bold text-zinc-300 truncate">{a.name}</p>
                                                    {editingId === a.id ? (
                                                        <div className="flex gap-1 animate-in slide-in-from-right-2">
                                                            <input
                                                                type="number"
                                                                value={editAmount}
                                                                onChange={e => setEditAmount(e.target.value)}
                                                                className="w-20 bg-black border border-zinc-700 text-xs px-1 text-white font-mono"
                                                            />
                                                            <button onClick={() => handleUpdate(a.id)} className="text-green-500 hover:text-green-400 p-0.5"><Save size={12} /></button>
                                                            <button onClick={() => setEditingId(null)} className="text-zinc-500 p-0.5"><X size={12} /></button>
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs font-mono font-bold text-white transition-transform group-hover/item:scale-105">{fmt(a.amount)}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center justify-between mt-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[9px] font-mono text-zinc-500 uppercase">{a.type}</span>
                                                        {a.isLiquid ? <span className="text-[8px] text-green-500/80 border border-green-500/20 px-1 rounded-sm">LIQUID</span> : <span className="text-[8px] text-orange-500/80 border border-orange-500/20 px-1 rounded-sm">LOCKED</span>}
                                                    </div>
                                                    {editingId !== a.id && (
                                                        <div className="flex gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                            <button onClick={() => { setEditingId(a.id); setEditAmount(a.amount); }} className="text-zinc-600 hover:text-blue-400 transition-colors"><Edit2 size={10} /></button>
                                                            <button onClick={() => handleDelete(a.id)} className="text-zinc-600 hover:text-red-500 transition-colors"><Trash2 size={10} /></button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Asset Add Form Trigger */}
            <div className="pt-4 flex justify-center">
                {!showForm ? (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 rounded-full border border-dashed border-zinc-700 px-6 py-2 text-[10px] font-mono text-zinc-500 hover:border-zinc-500 hover:text-white transition-all"
                    >
                        <Plus size={14} /> REGISTER NEW ASSET PROTOCOL
                    </button>
                ) : (
                    <div className="w-full max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/80 p-6 space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Initialization Form</h4>
                            <button onClick={() => setShowForm(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-600 uppercase">Asset Name</label>
                                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. HDFC Salary" className={inp} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-600 uppercase">Type</label>
                                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={sel + " w-full h-[34px]"}>
                                    {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-600 uppercase">Amount (₹)</label>
                                <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Valuation" className={inp} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-mono text-zinc-600 uppercase">Invested (Optional)</label>
                                <input type="number" value={form.investedAmount} onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))} placeholder="Cost Basis" className={inp} />
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 cursor-pointer group">
                                <input type="checkbox" checked={form.isLiquid} onChange={e => setForm(f => ({ ...f, isLiquid: e.target.checked }))} className="accent-blue-500" />
                                <span className="group-hover:text-zinc-300 transition-colors uppercase">Liquid Asset</span>
                            </label>
                            <div className="flex-1 flex flex-col gap-1">
                                <label className="text-[9px] font-mono text-zinc-600 uppercase">Maturity (Optional)</label>
                                <input type="date" value={form.maturityDate} onChange={e => setForm(f => ({ ...f, maturityDate: e.target.value }))} className={sel + " w-full"} />
                            </div>
                        </div>
                        <button
                            onClick={handleAdd}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded transition-all shadow-[0_4px_12px_rgba(37,99,235,0.3)] active:translate-y-0.5"
                        >
                            CONFIRM_NEW_ASSET
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
