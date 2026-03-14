'use client';
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, Edit2, Save, X, Unlock, Lock, AlertTriangle } from 'lucide-react';
import {
    addNetWorthAsset, updateNetWorthAsset, deleteNetWorthAsset,
    getNetWorthAssets, saveNetWorthSnapshot, getNetWorthHistory
} from '@/app/finance-actions';

const ASSET_TYPES = ['SAVINGS', 'FD', 'SIP', 'STOCKS', 'PF', 'CRYPTO', 'CASH', 'OTHER'];
const TYPE_COLORS = {
    SAVINGS: '#3b82f6', FD: '#f97316', SIP: '#22c55e',
    STOCKS: '#a855f7', PF: '#06b6d4', CRYPTO: '#eab308',
    CASH: '#6b7280', OTHER: '#71717a'
};

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

// Feature #7 — SVG Ring Gauge
function RingGauge({ liquid, total }) {
    const pct = total > 0 ? liquid / total : 0;
    const r = 70, cx = 90, cy = 90;
    const circ = 2 * Math.PI * r;
    const dash = pct * circ;
    return (
        <div className="flex flex-col items-center">
            <svg width="180" height="180" className="drop-shadow-lg">
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#27272a" strokeWidth="18" />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f97316" strokeWidth="18"
                    strokeDasharray={`${circ - dash} ${circ}`} strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 1s ease' }} />
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#22c55e" strokeWidth="18"
                    strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                    transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: 'stroke-dasharray 1s ease' }} />
                <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white" style={{ fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' }}>
                    {Math.round(pct * 100)}%
                </text>
                <text x={cx} y={cy + 14} textAnchor="middle" style={{ fontSize: 10, fill: '#71717a', fontFamily: 'monospace' }}>LIQUID</text>
            </svg>
            <div className="flex gap-4 text-xs font-mono mt-1">
                <span className="text-green-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Liquid</span>
                <span className="text-orange-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Locked</span>
            </div>
        </div>
    );
}

// Feature #9 — Asset Health Score
function calcHealthScore(assets, monthlySavings) {
    let score = 0;
    const reasons = [];
    const total = assets.reduce((s, a) => s + a.amount, 0);
    const liquid = assets.filter(a => a.isLiquid).reduce((s, a) => s + a.amount, 0);
    const invested = assets.filter(a => ['SIP', 'STOCKS', 'FD', 'PF'].includes(a.type)).reduce((s, a) => s + a.amount, 0);
    if (liquid >= monthlySavings * 6) { score += 25; reasons.push({ ok: true, text: 'Emergency fund ≥ 6 months ✓' }); }
    else { reasons.push({ ok: false, text: `Emergency fund low (${fmt(liquid)} of ${fmt(monthlySavings * 6)} target)` }); }
    if (total > 0 && invested / total >= 0.2) { score += 25; reasons.push({ ok: true, text: 'Investments ≥ 20% of net worth ✓' }); }
    else { reasons.push({ ok: false, text: 'Invest more — target 20% of net worth' }); }
    if (assets.some(a => a.type === 'SIP')) { score += 25; reasons.push({ ok: true, text: 'Active SIP detected ✓' }); }
    else { reasons.push({ ok: false, text: 'Start a SIP for long-term wealth' }); }
    if (total > 0 && liquid / total >= 0.2 && liquid / total <= 0.6) { score += 25; reasons.push({ ok: true, text: 'Liquid ratio healthy (20–60%) ✓' }); }
    else { reasons.push({ ok: false, text: 'Liquid ratio outside 20–60% range' }); }
    const grade = score >= 75 ? 'A' : score >= 50 ? 'B' : score >= 25 ? 'C' : 'D';
    return { score, grade, reasons };
}

export default function NetWorthHub({ assets, setAssets, monthlySavings }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', type: 'SAVINGS', amount: '', investedAmount: '', isLiquid: true, maturityDate: '' });
    const [editingId, setEditingId] = useState(null);
    const [editAmount, setEditAmount] = useState('');
    const [history, setHistory] = useState([]);

    const totalNetWorth = assets.reduce((s, a) => s + a.amount, 0);
    const totalLiquid = assets.filter(a => a.isLiquid).reduce((s, a) => s + a.amount, 0);
    const totalLocked = totalNetWorth - totalLiquid;
    const health = calcHealthScore(assets, monthlySavings || 0);

    // Feature #10 — FD maturity alerts
    const today = new Date();
    const expiringFDs = assets.filter(a => {
        if (!a.maturityDate) return false;
        const diff = (new Date(a.maturityDate) - today) / (1000 * 60 * 60 * 24);
        return diff >= 0 && diff <= 30;
    });

    useEffect(() => {
        getNetWorthHistory().then(setHistory);
    }, []);

    async function handleAdd() {
        if (!form.name || !form.amount) return;
        await addNetWorthAsset(form.name, form.type, form.amount, form.isLiquid, form.maturityDate || null, '', form.investedAmount || 0);
        const updated = await getNetWorthAssets();
        setAssets(updated);
        const newTotal = updated.reduce((s, a) => s + a.amount, 0);
        await saveNetWorthSnapshot(newTotal);
        setForm({ name: '', type: 'SAVINGS', amount: '', investedAmount: '', isLiquid: true, maturityDate: '' });
        setShowForm(false);
        getNetWorthHistory().then(setHistory);
    }

    async function handleUpdate(id) {
        await updateNetWorthAsset(id, editAmount);
        setAssets(prev => prev.map(a => a.id === id ? { ...a, amount: parseFloat(editAmount) } : a));
        setEditingId(null);
        const updated = await getNetWorthAssets();
        await saveNetWorthSnapshot(updated.reduce((s, a) => s + a.amount, 0));
        getNetWorthHistory().then(setHistory);
    }

    async function handleDelete(id) {
        await deleteNetWorthAsset(id);
        const updated = await getNetWorthAssets();
        setAssets(updated);
        await saveNetWorthSnapshot(updated.reduce((s, a) => s + a.amount, 0));
        getNetWorthHistory().then(setHistory);
    }

    const inp = "rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 w-full";
    const sel = "rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1.5 text-xs text-white font-mono focus:outline-none";

    const gradeColor = { A: 'text-green-400', B: 'text-blue-400', C: 'text-yellow-400', D: 'text-red-400' };

    return (
        <div className="space-y-6">
            {/* Feature #10 — FD Maturity Alerts */}
            {expiringFDs.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-2">
                    <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
                    <p className="text-xs font-mono text-yellow-200">
                        <span className="font-bold">{a.name}</span> matures in{' '}
                        <span className="text-yellow-400 font-bold">
                            {Math.ceil((new Date(a.maturityDate) - today) / (1000 * 60 * 60 * 24))} days
                        </span>
                        {' '}— Review reinvestment options.
                    </p>
                </div>
            ))}

            {/* Top stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
                {[
                    { label: 'Total Net Worth', val: totalNetWorth, color: 'text-blue-300', border: 'border-blue-500/20' },
                    { label: 'Liquid', val: totalLiquid, color: 'text-green-300', border: 'border-green-500/20' },
                    { label: 'Locked', val: totalLocked, color: 'text-orange-300', border: 'border-orange-500/20' },
                ].map(c => (
                    <div key={c.label} className={`rounded-xl border ${c.border} bg-zinc-900/60 p-4`}>
                        <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-1">{c.label}</p>
                        <p className={`text-xl font-bold font-mono ${c.color}`}>{fmt(c.val)}</p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Feature #7 — Ring Gauge */}
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4 flex flex-col items-center justify-center">
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-3">Liquid vs Locked</p>
                    <RingGauge liquid={totalLiquid} total={totalNetWorth} />
                    <p className="text-xs font-mono text-zinc-500 mt-2">{fmt(totalLiquid)} available now</p>
                </div>

                {/* Feature #6 — History Graph */}
                <div className="lg:col-span-2 rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest mb-3">Net Worth History</p>
                    {history.length > 1 ? (
                        <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={history}>
                                <defs>
                                    <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#52525b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                                <YAxis hide />
                                <Tooltip formatter={v => fmt(v)} contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8, fontFamily: 'monospace', fontSize: 12 }} />
                                <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fill="url(#nwGrad)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-xs text-zinc-600 font-mono">
                            Add/update assets across months to see history here.
                        </div>
                    )}
                </div>
            </div>

            {/* Feature #9 — Health Score */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Asset Health Score</p>
                    <span className={`text-2xl font-bold font-mono ${gradeColor[health.grade]}`}>GRADE {health.grade}</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 mb-3 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${health.grade === 'A' ? 'bg-green-500' : health.grade === 'B' ? 'bg-blue-500' : health.grade === 'C' ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${health.score}%` }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {health.reasons.map((r, i) => (
                        <p key={i} className={`text-xs font-mono ${r.ok ? 'text-green-400' : 'text-zinc-500'}`}>{r.text}</p>
                    ))}
                </div>
            </div>

            {/* Asset List */}
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-700/50">
                    <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest">All Assets</p>
                    <button onClick={() => setShowForm(v => !v)} className="cursor-pointer text-xs font-mono text-blue-400 border border-blue-500/30 px-2 py-1 rounded hover:bg-blue-500/10 flex items-center gap-1">
                        <Plus size={11} /> ADD
                    </button>
                </div>
                {showForm && (
                    <div className="p-4 border-b border-zinc-700/50 bg-zinc-800/30 space-y-2">
                        <div className="flex gap-2">
                            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Asset name" className={inp} />
                            <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={sel}>
                                {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="Current ₹ value" className={inp} />
                            {/* Feature #8 — Invested amount for ROI */}
                            <input type="number" value={form.investedAmount} onChange={e => setForm(f => ({ ...f, investedAmount: e.target.value }))} placeholder="Invested ₹ (optional)" className={inp} />
                        </div>
                        <div className="flex gap-3 items-center">
                            <label className="flex items-center gap-1 text-xs font-mono text-zinc-400 cursor-pointer">
                                <input type="checkbox" checked={form.isLiquid} onChange={e => setForm(f => ({ ...f, isLiquid: e.target.checked }))} className="accent-green-500" />
                                Liquid
                            </label>
                            <input type="date" value={form.maturityDate} onChange={e => setForm(f => ({ ...f, maturityDate: e.target.value }))} className={`${sel} flex-1`} />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowForm(false)} className="cursor-pointer text-xs text-zinc-500 hover:text-white font-mono px-3 py-1">CANCEL</button>
                            <button onClick={handleAdd} className="cursor-pointer text-xs font-bold bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-500 font-mono">ADD</button>
                        </div>
                    </div>
                )}
                <div className="divide-y divide-zinc-800/70 max-h-80 overflow-y-auto">
                    {assets.length === 0 && <p className="p-6 text-center text-xs text-zinc-600 font-mono">No assets added yet.</p>}
                    {assets.map(a => {
                        // Feature #8 — ROI display
                        const hasROI = a.investedAmount && a.investedAmount > 0;
                        const roi = hasROI ? ((a.amount - a.investedAmount) / a.investedAmount * 100).toFixed(1) : null;
                        return (
                            <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/30 transition-colors">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: TYPE_COLORS[a.type] || '#6b7280' }} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-mono text-white">{a.name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] text-zinc-500">{a.type}</span>
                                        {a.isLiquid ? <span className="text-[10px] text-green-500">●LIQUID</span> : <span className="text-[10px] text-orange-500">●LOCKED</span>}
                                        {roi !== null && (
                                            <span className={`text-[10px] font-mono ${parseFloat(roi) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                {parseFloat(roi) >= 0 ? '+' : ''}{roi}% ROI
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {editingId === a.id ? (
                                    <div className="flex items-center gap-1">
                                        <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                                            className="w-24 rounded border border-zinc-600 bg-zinc-800 px-2 py-1 text-xs text-white font-mono" />
                                        <button onClick={() => handleUpdate(a.id)} className="cursor-pointer text-green-400"><Save size={13} /></button>
                                        <button onClick={() => setEditingId(null)} className="cursor-pointer text-zinc-500"><X size={13} /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold font-mono text-blue-300">{fmt(a.amount)}</span>
                                        <button onClick={() => { setEditingId(a.id); setEditAmount(a.amount); }} className="cursor-pointer text-zinc-600 hover:text-blue-400"><Edit2 size={12} /></button>
                                        <button onClick={() => handleDelete(a.id)} className="cursor-pointer text-zinc-600 hover:text-red-400"><Trash2 size={12} /></button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
