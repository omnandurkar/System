'use client';
import { useState } from 'react';
import { Plus, Trash2, CheckCircle, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { addFinanceGoal, deleteFinanceGoal, getFinanceGoals, completeGoal } from '@/app/finance-actions';
import { cn } from '@/lib/utils';

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

// Feature #11 — SVG Progress Ring
function ProgressRing({ pct, size = 56, stroke = 6 }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = Math.min(pct, 100) / 100 * circ;
    const color = pct >= 100 ? '#22c55e' : pct >= 50 ? '#3b82f6' : '#f97316';
    return (
        <svg width={size} height={size} className="shrink-0">
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={stroke} />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.8s ease' }} />
            <text x={size / 2} y={size / 2 + 4} textAnchor="middle"
                style={{ fontSize: 10, fill: color, fontFamily: 'monospace', fontWeight: 'bold' }}>
                {Math.min(pct, 100)}%
            </text>
        </svg>
    );
}

// Feature #12 — Milestone badges
function MilestoneBadges({ pct }) {
    const milestones = [25, 50, 75, 100];
    return (
        <div className="flex gap-1">
            {milestones.map(m => (
                <span key={m} className={cn(
                    'text-[9px] font-mono px-1.5 py-0.5 rounded border',
                    pct >= m
                        ? 'bg-green-500/10 text-green-400 border-green-500/30'
                        : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                )}>{m}%</span>
            ))}
        </div>
    );
}

export default function GoalsTracker({ goals, setGoals, monthlySavings, totalLiquid }) {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', targetAmount: '', priority: 'SHORT', deadline: '' });
    // Feature #13 — accelerate slider state
    const [accelerateGoalId, setAccelerateGoalId] = useState(null);
    const [extraSavings, setExtraSavings] = useState(5000);

    const activeGoals = goals.filter(g => !g.completedAt);
    const completedGoals = goals.filter(g => g.completedAt);

    async function handleAdd() {
        if (!form.title || !form.targetAmount) return;
        await addFinanceGoal(form.title, form.targetAmount, form.priority, form.deadline || null);
        setGoals(await getFinanceGoals());
        setForm({ title: '', targetAmount: '', priority: 'SHORT', deadline: '' });
        setShowForm(false);
    }

    async function handleDelete(id) {
        await deleteFinanceGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
    }

    async function handleComplete(id) {
        await completeGoal(id);
        setGoals(await getFinanceGoals());
    }

    function calcEta(goal, extraPerMonth = 0) {
        const shortfall = Math.max(0, goal.targetAmount - totalLiquid);
        if (shortfall === 0) return { canAffordNow: true };
        const rate = (monthlySavings || 0) + extraPerMonth;
        if (rate <= 0) return { canAffordNow: false, months: null };
        const months = Math.ceil(shortfall / rate);
        const date = new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
        return { canAffordNow: false, months, date, shortfall };
    }

    const inp = "rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 w-full";
    const sel = "rounded border border-zinc-700 bg-zinc-800/80 px-2 py-1.5 text-xs text-white font-mono focus:outline-none";

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-500 font-mono">Savings rate: <span className="text-green-400 font-bold">{fmt(monthlySavings)}/mo</span></p>
                <button onClick={() => setShowForm(v => !v)}
                    className="cursor-pointer text-xs font-mono text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded hover:bg-purple-500/10 flex items-center gap-1">
                    <Plus size={11} /> NEW GOAL
                </button>
            </div>

            {showForm && (
                <div className="rounded-xl border border-purple-500/20 bg-zinc-900/60 p-4 space-y-2">
                    <div className="flex gap-2">
                        <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Goal (e.g. iPhone 16 Pro)" className={inp} />
                        <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className={sel}>
                            <option value="SHORT">SHORT</option>
                            <option value="LONG">LONG</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))} placeholder="₹ Target" className={inp} />
                        <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className={inp} />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button onClick={() => setShowForm(false)} className="cursor-pointer text-xs text-zinc-500 hover:text-white font-mono px-3 py-1">CANCEL</button>
                        <button onClick={handleAdd} className="cursor-pointer text-xs font-bold bg-purple-600 text-white px-4 py-1 rounded hover:bg-purple-500 font-mono">ADD GOAL</button>
                    </div>
                </div>
            )}

            {/* Active Goals */}
            {activeGoals.length === 0 && !showForm && (
                <p className="text-center text-xs text-zinc-600 font-mono py-8">No active goals. Add one to see your ETA.</p>
            )}

            <div className="space-y-3">
                {activeGoals.map(goal => {
                    const pct = Math.min(100, Math.round((totalLiquid / goal.targetAmount) * 100));
                    const eta = calcEta(goal);
                    // Feature #14 — deadline risk
                    const atRisk = goal.deadline && eta.months !== null && !eta.canAffordNow &&
                        new Date(goal.deadline) < new Date(Date.now() + eta.months * 30 * 24 * 60 * 60 * 1000);
                    // Feature #13 — accelerate mode
                    const isAccelerating = accelerateGoalId === goal.id;
                    const accelEta = isAccelerating ? calcEta(goal, extraSavings) : null;

                    return (
                        <div key={goal.id} className={cn("rounded-xl border bg-zinc-900/60 p-4",
                            eta.canAffordNow ? "border-green-500/30" : atRisk ? "border-red-500/30" : "border-zinc-700")}>
                            {/* Feature #14 — At Risk badge */}
                            {atRisk && (
                                <div className="flex items-center gap-1 text-[10px] font-mono text-red-400 mb-2">
                                    <AlertTriangle size={10} /> AT RISK — won&apos;t meet deadline at current rate
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                {/* Feature #11 — Ring */}
                                <ProgressRing pct={pct} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-bold font-mono">{goal.title}</p>
                                        <div className="flex items-center gap-1">
                                            {eta.canAffordNow && (
                                                <button onClick={() => handleComplete(goal.id)}
                                                    className="cursor-pointer text-[10px] font-mono text-green-400 border border-green-500/30 px-2 py-0.5 rounded hover:bg-green-500/10">
                                                    COMPLETE
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(goal.id)} className="cursor-pointer text-zinc-600 hover:text-red-400"><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${goal.priority === 'SHORT' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' : 'text-purple-400 border-purple-500/30 bg-purple-500/10'}`}>
                                            {goal.priority} TERM
                                        </span>
                                        <span className="text-xs font-mono text-white font-bold">{fmt(goal.targetAmount)}</span>
                                    </div>
                                    {/* Feature #12 — Milestones */}
                                    <div className="mt-2"><MilestoneBadges pct={pct} /></div>
                                    {/* ETA */}
                                    <p className="mt-2 text-xs font-mono text-zinc-500">
                                        {eta.canAffordNow ? <span className="text-green-400 flex items-center gap-1"><CheckCircle size={11} /> Affordable now!</span>
                                            : eta.months !== null ? <span className="flex items-center gap-1">
                                                <Clock size={11} className="text-yellow-400" />
                                                <span className="text-yellow-300 font-bold">{eta.months}mo</span> →{' '}
                                                {eta.date?.toLocaleString('en-IN', { month: 'short', year: 'numeric' })}
                                            </span> : 'Set savings rate for ETA'}
                                    </p>
                                </div>
                            </div>

                            {/* Feature #13 — Accelerate Simulator */}
                            <div className="mt-3 border-t border-zinc-800 pt-3">
                                <button onClick={() => setAccelerateGoalId(isAccelerating ? null : goal.id)}
                                    className="cursor-pointer text-[10px] font-mono text-zinc-500 hover:text-blue-400 flex items-center gap-1">
                                    <ChevronDown size={10} className={`transition-transform ${isAccelerating ? 'rotate-180' : ''}`} />
                                    ACCELERATE SIMULATOR
                                </button>
                                {isAccelerating && (
                                    <div className="mt-2 space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-zinc-500 font-mono whitespace-nowrap">Extra/mo: {fmt(extraSavings)}</span>
                                            <input type="range" min={0} max={50000} step={1000} value={extraSavings}
                                                onChange={e => setExtraSavings(parseInt(e.target.value))}
                                                className="flex-1 accent-blue-500 cursor-pointer" />
                                        </div>
                                        {accelEta && !accelEta.canAffordNow && accelEta.months !== null && (
                                            <p className="text-xs text-blue-300 font-mono">
                                                → Saves you <span className="font-bold text-white">{(eta.months || 0) - accelEta.months} months</span> — reach by{' '}
                                                <span className="text-green-400">{accelEta.date?.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</span>
                                            </p>
                                        )}
                                        {accelEta?.canAffordNow && <p className="text-xs text-green-400 font-mono">→ You can afford this now!</p>}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Feature #15 — Completed Goals Archive */}
            {completedGoals.length > 0 && (
                <div className="rounded-xl border border-green-500/10 bg-green-500/5 overflow-hidden">
                    <p className="text-xs text-green-400 font-mono uppercase tracking-widest px-4 py-3 border-b border-green-500/10">
                        ✓ Completed Missions ({completedGoals.length})
                    </p>
                    <div className="divide-y divide-zinc-800/40">
                        {completedGoals.map(g => (
                            <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={14} className="text-green-400" />
                                    <p className="text-xs font-mono text-zinc-400 line-through">{g.title}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono text-zinc-500">
                                        {g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                                    </span>
                                    <span className="text-xs font-mono text-green-400">{fmt(g.targetAmount)}</span>
                                    <button onClick={() => handleDelete(g.id)} className="cursor-pointer text-zinc-700 hover:text-red-400"><Trash2 size={11} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
