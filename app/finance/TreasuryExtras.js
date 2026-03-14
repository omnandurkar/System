'use client';
/**
 * TreasuryExtras.js — Houses features #1,#2,#5,#6,#7,#8,#9,#10,#11,#14,#19
 * These are extra analytics sections added to the main FinanceDashboard.
 */
import { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';
import {
    TrendingUp, TrendingDown, AlertTriangle, ShieldCheck, Trophy,
    CalendarDays, ChevronDown, ChevronUp, Minus, Star
} from 'lucide-react';
import { getAnnualSummary, upsertCategoryBudgetCap, deleteCategoryBudgetCap } from '@/app/finance-actions';
import { cn } from '@/lib/utils';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

const CAT_COLORS = {
    HOUSING: '#ef4444', INVESTMENT: '#22c55e', EMI: '#f97316', SUBSCRIPTION: '#a855f7',
    UTILITIES: '#3b82f6', OTHER: '#6b7280', FOOD: '#eab308', TRANSPORT: '#06b6d4',
    HEALTH: '#ec4899', ENTERTAINMENT: '#f97316', SHOPPING: '#8b5cf6'
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
        return (
            <div className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono shadow-xl">
                <p className="text-zinc-400 mb-1">{label}</p>
                {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {fmt(p.value)}</p>)}
            </div>
        );
    }
    return null;
};

// --- POLISH COMPONENTS ---

function HUDCard({ children, className, title, headerAction }) {
    return (
        <div className={cn(
            "group relative rounded-xl border border-zinc-700/50 bg-zinc-900/40 backdrop-blur-md overflow-hidden transition-all duration-300 hover:border-zinc-500/50",
            className
        )}>
            {/* Inner Glow Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-linear-to-b from-white/5 to-transparent transition-opacity group-hover:opacity-80" />

            {/* HUD Corner Brackets */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-zinc-500/30 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-zinc-500/30 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-zinc-500/30 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-zinc-500/30 rounded-br-sm pointer-events-none" />

            {title && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 relative z-10">
                    <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 group-hover:text-zinc-400 transition-colors">{title}</h3>
                    {headerAction}
                </div>
            )}
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
}

const CategoryDot = ({ color }) => (
    <span className="inline-block w-1.5 h-1.5 rounded-full mr-2 shadow-[0_0_8px_rgba(255,255,255,0.3)] animate-pulse" style={{ backgroundColor: color }} />
);

// --- END POLISH COMPONENTS ---


// Feature #1 — Category Bar Chart
export function CategoryBarChart({ variableExpenses, fixedExpenses }) {
    const catMap = {};
    [...variableExpenses, ...fixedExpenses].forEach(e => {
        catMap[e.category] = (catMap[e.category] || 0) + e.amount;
    });
    const data = Object.entries(catMap).map(([cat, value]) => ({ cat, value })).sort((a, b) => b.value - a.value);
    if (data.length === 0) return <p className="text-center text-xs text-zinc-600 font-mono py-4">No expense data for chart.</p>;
    return (
        <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis dataKey="cat" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.map((entry, i) => <Cell key={i} fill={CAT_COLORS[entry.cat] || '#6b7280'} />)}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}

// Feature #2 — Month-over-Month Comparison
export function MonthComparison({ current, previous }) {
    if (!previous || previous.income === 0) return null;
    const items = [
        { label: 'Income', cur: current.income, prev: previous.income },
        {
            label: 'Fixed', cur: current.fixedExpenses?.reduce((s, e) => s + e.amount, 0) || 0,
            prev: previous.fixedExpenses?.reduce((s, e) => s + e.amount, 0) || 0
        },
        {
            label: 'Variable', cur: current.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0,
            prev: previous.variableExpenses?.reduce((s, e) => s + e.amount, 0) || 0
        },
    ];
    return (
        <HUDCard title="Month-over-Month" className="p-5">
            <div className="space-y-3">
                {items.map(item => {
                    const delta = item.cur - item.prev;
                    const pct = item.prev > 0 ? Math.abs(Math.round(delta / item.prev * 100)) : 0;
                    const up = delta > 0;
                    return (
                        <div key={item.label} className="flex items-center justify-between group/item">
                            <span className="text-xs text-zinc-500 font-mono w-20 group-hover/item:text-zinc-300 transition-colors">{item.label}</span>
                            <div className="flex-1 mx-3 relative h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                <div className="h-full bg-blue-500/80 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-700" style={{ width: `${Math.min(100, item.prev > 0 ? item.cur / item.prev * 50 : 50)}%` }} />
                            </div>
                            <span className="text-xs font-mono text-white w-20 text-right">{fmt(item.cur)}</span>
                            <div className={cn("flex items-center gap-1 text-xs font-mono w-16 justify-end", up ? 'text-red-400' : delta < 0 ? 'text-green-400' : 'text-zinc-500')}>
                                {delta > 0 ? <TrendingUp size={11} /> : delta < 0 ? <TrendingDown size={11} /> : <Minus size={11} />}
                                {pct > 0 ? `${pct}%` : '—'}
                            </div>
                        </div>
                    );
                })}
            </div>
        </HUDCard>
    );
}

// Feature #5 — Spending Velocity
export function SpendingVelocity({ variableExpenses, income, totalFixed }) {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const spent = variableExpenses.reduce((s, e) => s + e.amount, 0);
    const dailyRate = dayOfMonth > 0 ? spent / dayOfMonth : 0;
    const projectedTotal = dailyRate * daysInMonth;
    const budget = Math.max(0, income - totalFixed);
    const willOvershoot = projectedTotal > budget && budget > 0;
    const overshootBy = projectedTotal - budget;
    return (
        <HUDCard className={cn("p-4", willOvershoot ? "border-red-500/30 bg-red-500/5 shadow-[inset_0_0_20px_rgba(239,68,68,0.05)]" : "")}>
            <div className="flex items-start gap-4">
                <div className={cn(
                    "flex-none h-10 w-10 rounded-full flex items-center justify-center border transition-all",
                    willOvershoot ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse" : "bg-green-500/10 border-green-500/40 text-green-400"
                )}>
                    {willOvershoot ? <AlertTriangle size={18} /> : <ShieldCheck size={18} />}
                </div>
                <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-1">Intelligence Forecast</p>
                    <p className="text-sm font-mono leading-relaxed">
                        Velocity: <span className="text-white font-bold">{fmt(dailyRate)}/day</span>
                    </p>
                    {willOvershoot
                        ? <p className="text-[11px] text-zinc-400 font-mono mt-1">
                            <span className="text-red-400 font-bold">CRITICAL:</span> overshoot likely by <span className="text-red-400 font-bold">{fmt(overshootBy)}</span>
                        </p>
                        : <p className="text-[11px] text-zinc-400 font-mono mt-1">
                            <span className="text-green-400">✓ OPTIMAL:</span> projected {fmt(projectedTotal)} vs {fmt(budget)}
                        </p>}
                </div>
            </div>
        </HUDCard>
    );
}

// Feature #7 — Top 5 Spending Days
// export function TopSpendingDays({ variableExpenses }) {
//     const byDay = {};
//     variableExpenses.forEach(e => {
//         const d = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
//         byDay[d] = (byDay[d] || 0) + e.amount;
//     });
//     const top5 = Object.entries(byDay).sort((a, b) => b[1] - a[1]).slice(0, 5);
//     if (top5.length === 0) return null;
//     const max = top5[0][1];
//     return (
//         <HUDCard title="Top 5 Spending Peaks" className="p-4">
//             <div className="space-y-3">
//                 {top5.map(([day, amt], i) => (
//                     <div key={day} className="flex items-center gap-3 group/peak">
//                         <span className="text-[10px] text-zinc-500 font-mono w-14 shrink-0 transition-colors group-hover/peak:text-zinc-400">#{i + 1} {day}</span>
//                         <div className="flex-1 h-2 bg-zinc-800/50 rounded-full overflow-hidden relative">
//                             <div className="h-full bg-yellow-500/80 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.2)] transition-all duration-700" style={{ width: `${(amt / max) * 100}%` }} />
//                         </div>
//                         <span className="text-xs font-mono text-yellow-400/80 w-16 text-right group-hover/peak:text-yellow-400 transition-colors">{fmt(amt)}</span>
//                     </div>
//                 ))}
//             </div>
//         </HUDCard>
//     );
// }

// Feature #7 — Top 5 Spending Days
export function TopSpendingDays({ variableExpenses }) {
    const byDay = {};
    variableExpenses.forEach(e => {
        const d = new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
        byDay[d] = (byDay[d] || 0) + e.amount;
    });
    const top5 = Object.entries(byDay).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (top5.length === 0) return null;
    const max = top5[0][1];
    return (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-zinc-400 mb-3">Top 5 Spending Days</p>
            <div className="space-y-2">
                {top5.map(([day, amt], i) => (
                    <div key={day} className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-500 font-mono w-14 shrink-0">#{i + 1} {day}</span>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(amt / max) * 100}%` }} />
                        </div>
                        <span className="text-xs font-mono text-yellow-300 w-16 text-right">{fmt(amt)}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}


// Feature #8 — Weekly Digest
export function WeeklyDigest({ variableExpenses, income, totalFixed }) {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today); startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    const thisWeek = variableExpenses.filter(e => new Date(e.date) >= startOfWeek);
    const weekSpent = thisWeek.reduce((s, e) => s + e.amount, 0);
    const biggest = thisWeek.sort((a, b) => b.amount - a.amount)[0];
    const budget = Math.max(0, income - totalFixed);
    const onTrack = (weekSpent / 7 * 30) <= budget;
    return (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <p className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-3">Weekly Digest</p>
            <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
                <div>
                    <p className="text-zinc-500">This Week</p>
                    <p className="text-white font-bold">{fmt(weekSpent)}</p>
                </div>
                <div>
                    <p className="text-zinc-500">Biggest</p>
                    <p className="text-yellow-300 font-bold truncate">{biggest ? biggest.name : '—'}</p>
                </div>
                <div>
                    <p className="text-zinc-500">Pace</p>
                    <p className={onTrack ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{onTrack ? '✓ On Track' : '⚠ Fast'}</p>
                </div>
            </div>
        </div>
    );
}

// Feature #6 — Category Budget Caps
export function CategoryCaps({ budgetId, caps, variableExpenses, fixedExpenses, onUpdate }) {
    const [editing, setEditing] = useState(false);
    const [capInputs, setCapInputs] = useState({});
    const ALL_CATS = ['FOOD', 'TRANSPORT', 'HEALTH', 'ENTERTAINMENT', 'SHOPPING', 'HOUSING', 'EMI', 'SUBSCRIPTION', 'UTILITIES'];
    const spentByCategory = {};
    [...variableExpenses, ...fixedExpenses].forEach(e => {
        spentByCategory[e.category] = (spentByCategory[e.category] || 0) + e.amount;
    });
    const capsMap = {};
    caps.forEach(c => { capsMap[c.category] = c.capAmount; });

    async function handleSaveCap(cat) {
        const val = parseFloat(capInputs[cat]);
        if (isNaN(val) || val <= 0) {
            await deleteCategoryBudgetCap(budgetId, cat);
        } else {
            await upsertCategoryBudgetCap(budgetId, cat, val);
        }
        onUpdate();
        setEditing(false);
    }

    const activeCaps = caps.filter(c => spentByCategory[c.category] !== undefined || capsMap[c.category]);

    const HeaderAction = (
        <button onClick={() => { setEditing(v => !v); setCapInputs({}); }} className="cursor-pointer text-[10px] text-zinc-500 hover:text-white font-mono uppercase tracking-tight py-1 px-2 rounded hover:bg-white/5 transition-all">
            {editing ? '[SAVE]' : '[EDIT CAPS]'}
        </button>
    );

    return (
        <HUDCard title="Systemic Budget Caps" headerAction={HeaderAction}>
            {editing ? (
                <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {ALL_CATS.map(cat => (
                        <div key={cat} className="space-y-1">
                            <span className="text-[9px] text-zinc-500 font-mono uppercase truncate block">{cat}</span>
                            <input type="number" placeholder={capsMap[cat] || '₹ cap'}
                                value={capInputs[cat] ?? (capsMap[cat] || '')}
                                onChange={e => setCapInputs(p => ({ ...p, [cat]: e.target.value }))}
                                onBlur={() => handleSaveCap(cat)}
                                className="w-full rounded border border-zinc-700/50 bg-zinc-950/50 px-2 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-yellow-500/50 transition-colors" />
                        </div>
                    ))}
                </div>
            ) : activeCaps.length === 0 ? (
                <div className="p-8 text-center bg-zinc-950/20">
                    <p className="text-xs text-zinc-600 font-mono mb-2 tracking-tight italic">No category restrictions detected in system.</p>
                    <button onClick={() => setEditing(true)} className="cursor-pointer text-[10px] text-yellow-500/80 font-mono hover:text-yellow-400 transition-colors uppercase tracking-widest border border-yellow-500/20 px-4 py-2 rounded">Enable Restrictions</button>
                </div>
            ) : (
                <div className="divide-y divide-zinc-800/30">
                    {activeCaps.map(cap => {
                        const spent = spentByCategory[cap.category] || 0;
                        const pct = cap.capAmount > 0 ? Math.min(100, Math.round(spent / cap.capAmount * 100)) : 0;
                        const over = spent > cap.capAmount;
                        return (
                            <div key={cap.category} className="px-5 py-3 group/cap hover:bg-white/2 transition-colors">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center">
                                        <CategoryDot color={CAT_COLORS[cap.category] || '#6b7280'} />
                                        <span className="text-xs font-mono text-zinc-400 group-hover/cap:text-zinc-200 transition-colors">{cap.category}</span>
                                    </div>
                                    <span className={cn("text-xs font-mono font-bold", over ? "text-red-400" : pct > 80 ? "text-yellow-400" : "text-zinc-500")}>
                                        {fmt(spent)} <span className="text-[10px] opacity-40 font-normal">/ {fmt(cap.capAmount)}</span>
                                    </span>
                                </div>
                                <div className="h-1 bg-zinc-800/50 rounded-full overflow-hidden relative">
                                    <div className={cn("h-full rounded-full transition-all duration-1000", over ? "bg-red-500" : pct > 80 ? "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]" : "bg-green-500")}
                                        style={{ width: `${pct}%` }} />
                                </div>
                                {over && (
                                    <p className="text-[9px] text-red-400/80 font-mono mt-1 flex items-center gap-1 uppercase tracking-tighter">
                                        <AlertTriangle size={9} /> SYSTEM ALERT: Sector Overshoot {fmt(spent - cap.capAmount)}
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </HUDCard>
    );
}

// Feature #11 — Emergency Fund Tracker
export function EmergencyFundTracker({ monthlyExpenses, totalLiquid }) {
    if (monthlyExpenses <= 0) return null;
    const months = totalLiquid / monthlyExpenses;
    const target = 6;
    const pct = Math.min(100, Math.round((months / target) * 100));
    const healthy = months >= target;
    const warning = months < 3;
    const color = healthy ? 'text-green-400' : months >= 3 ? 'text-yellow-400' : 'text-red-400';
    return (
        <HUDCard title="Survival Buffer" className="pt-2" >
            <div className="flex flex-col space-y-4 mt-4 px-5">   {/* controls vertical spacing */}

                <div className="flex items-center justify-between relative z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-zinc-500 tracking-tight">
                            LIQUIDITY RATIO
                        </span>
                        <span className={cn(
                            "text-2xl font-bold font-mono tracking-tighter leading-none pt-1",
                            color
                        )}>
                            {months.toFixed(1)}
                            <span className="text-xs opacity-50 ml-0.5">/month</span>
                        </span>
                    </div>

                    <div
                        className={cn(
                            "h-10 w-10 rounded-full border flex items-center justify-center transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]",
                            healthy
                                ? "bg-green-500/10 border-green-500/40 text-green-400"
                                : warning
                                    ? "bg-red-500/10 border-red-500/40 text-red-400 animate-pulse"
                                    : "bg-yellow-500/10 border-yellow-500/40 text-yellow-400"
                        )}
                    >
                        {healthy ? <ShieldCheck size={20} /> : <AlertTriangle size={20} />}
                    </div>
                </div>

                <div className="h-1.5 bg-zinc-800/50 rounded-full overflow-hidden relative">
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            healthy
                                ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                : months >= 3
                                    ? "bg-yellow-500"
                                    : "bg-red-500"
                        )}
                        style={{ width: `${pct}%` }}
                    />
                </div>

                <p className="text-[10px] font-mono text-zinc-500 italic leading-tight group-hover:text-zinc-400 transition-colors">
                    {healthy
                        ? ">> SYSTEM STATUS: SECURE. RESERVE PROTOCOL OPTIMAL."
                        : `>> TARGET: ${target} Months. Inflow required: ${fmt(
                            (target - months) * monthlyExpenses
                        )}`}
                </p>

            </div>
        </HUDCard>
    );
}

// Feature #14 — Monthly Treasury Report Card
export function TreasuryReportCard({ budget, month, year, isMonthComplete }) {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const income = budget.income || 0;
    const totalFixed = (budget.fixedExpenses || []).reduce((s, e) => s + e.amount, 0);
    const totalVar = (budget.variableExpenses || []).reduce((s, e) => s + e.amount, 0);
    const savings = Math.max(0, income - totalFixed - totalVar);
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;
    const goalMet = budget.savingsGoal > 0 && savings >= budget.savingsGoal;
    const grade = savingsRate >= 30 ? 'S' : savingsRate >= 20 ? 'A' : savingsRate >= 10 ? 'B' : savingsRate >= 5 ? 'C' : 'D';

    const config = {
        S: { color: 'text-yellow-400', border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.15)]', shine: true },
        A: { color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/10', glow: 'shadow-[0_0_20px_rgba(34,197,94,0.1)]', shine: true },
        B: { color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/8', glow: '', shine: false },
        C: { color: 'text-orange-400', border: 'border-orange-500/20', bg: 'bg-orange-500/5', glow: '', shine: false },
        D: { color: 'text-red-400', border: 'border-red-500/20', bg: 'bg-red-500/5', glow: '', shine: false },
    };

    const c = config[grade];

    return (
        <div className={cn(
            "group relative rounded-2xl border p-6 transition-all duration-500 overflow-hidden backdrop-blur-xl",
            c.border, c.bg, c.glow
        )}>
            <style>{`
                @keyframes rankShine {
                    from { transform: translateX(-150%) skewX(-25deg); }
                    to { transform: translateX(250%) skewX(-25deg); }
                }
                .rank-shine-overlay {
                    animation: rankShine 3s infinite;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
                }
            `}</style>

            {/* Holographic Shine for High Ranks */}
            {c.shine && <div className="absolute inset-0 pointer-events-none rank-shine-overlay" />}

            {/* Digital Scanline */}
            <div className="absolute top-0 left-0 w-full h-px bg-white/10" />

            {/* Corner Bracket Polish */}
            <div className="absolute top-0 left-0 w-4 h-4  border-t-2 border-l-2 border-white/20 rounded-tl-lg" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/20 rounded-br-lg" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] mb-1">Financial Performance Unit</p>
                        <p className="text-xl font-black font-mono tracking-tight text-white">{MONTHS[month - 1]} {year}</p>
                        <div className="mt-1 flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,1)] animate-pulse" />
                            <span className="text-[9px] font-mono text-green-500/80 uppercase tracking-widest">System Sync Active</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-zinc-500 font-mono tracking-widest mb-1 uppercase">Rank</p>
                        <div className="relative inline-block text-center">
                            <p className={cn("text-6xl font-black font-mono leading-none tracking-tighter filter drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]", c.color)}>
                                {grade}
                            </p>
                            {grade === 'S' && <div className="absolute -inset-1 border border-yellow-500/20 rounded-full animate-ping pointer-events-none" />}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Inflow', val: fmt(income), sub: 'Monthly Gross', color: 'text-blue-300' },
                        { label: 'Expenditure', val: fmt(totalFixed + totalVar), sub: totalVar > totalFixed ? 'Variable Heavy' : 'Fixed Heavy', color: 'text-red-300' },
                        { label: 'Retained', val: fmt(savings), sub: 'Liquid Storage', color: 'text-green-300' },
                        { label: 'Efficiency', val: `${savingsRate.toFixed(1)}%`, sub: 'Savings Ratio', color: c.color },
                    ].map(item => (
                        <div key={item.label} className="group/item relative rounded-xl border border-white/5 bg-black/40 p-4 transition-all hover:border-white/20 hover:bg-black/60">
                            <p className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1 group-hover/item:text-zinc-400 transition-colors font-mono">{item.label}</p>
                            <p className={cn("text-base font-bold font-mono tracking-tight", item.color)}>{item.val}</p>
                            <p className="text-[8px] text-zinc-700 font-mono italic group-hover/item:text-zinc-500 transition-colors">{item.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        {goalMet ? (
                            <div className="flex items-center gap-2">
                                <Trophy size={14} className="text-yellow-400" />
                                <span className="text-[11px] font-mono text-yellow-400 font-bold uppercase tracking-wide">Protocol: savings_goal_achieved</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Minus size={14} className="text-zinc-600" />
                                <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-wide">Protocol: goal_in_progress</span>
                            </div>
                        )}
                    </div>
                    {goalMet && isMonthComplete && (
                        <div className="px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-[10px] font-mono text-yellow-400 font-bold uppercase animate-bounce">
                            +500 XP AWARDED
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Feature #19 — Annual View
export function AnnualView({ year }) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const max = Math.max(...data.map(d => d.income), 1);
    useEffect(() => {
        getAnnualSummary(year).then(d => { setData(d); setLoading(false); });
    }, [year]);
    if (loading) return <div className="h-32 flex items-center justify-center text-xs text-zinc-600 font-mono animate-pulse">Loading annual data...</div>;
    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#52525b', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalExpense" name="Expense" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={28} opacity={0.7} />
                    <Bar dataKey="savings" name="Savings" fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-1">
                {data.map((d, i) => (
                    <div key={i} className={cn("rounded text-center py-2 text-[9px] font-mono", d.hasData ? "bg-zinc-800" : "bg-zinc-900 opacity-40")}>
                        <p className="text-zinc-500">{d.month}</p>
                        {d.hasData && <p className={d.savings > 0 ? "text-green-400" : "text-red-400"}>{d.savings > 0 ? '+' : ''}{Math.round(d.savings / 1000)}k</p>}
                    </div>
                ))}
            </div>
        </div>
    );
}
