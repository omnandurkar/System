'use client';
import { useState, useEffect } from 'react';
import { Brain, Trash2, Clock, CheckCircle, AlertTriangle, History, TrendingDown } from 'lucide-react';
import { analyzePurchase, logPurchaseDecision, getPurchaseAdvisorLogs } from '@/app/finance-actions';
import { cn } from '@/lib/utils';

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

// Feature #19 — Smart Recommendation Tags
function VerdictTag({ canBuyNow, monthsNeeded, shortfall }) {
    if (canBuyNow) return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">✓ SAFE TO BUY</span>;
    if (!monthsNeeded) return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/30">⚠ DO NOT BUY NOW</span>;
    if (monthsNeeded <= 2) return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">⏳ STRETCH PURCHASE</span>;
    return <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">🕐 WAIT ADVISED</span>;
}

// Feature #18 — Best Month Calendar mini-view
function BestMonthCalendar({ affordableDate }) {
    if (!affordableDate) return null;
    const target = new Date(affordableDate);
    const months = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        months.push({ label: d.toLocaleString('en-IN', { month: 'short' }), year: d.getFullYear(), isTarget: d.getMonth() === target.getMonth() && d.getFullYear() === target.getFullYear() });
    }
    return (
        <div>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mb-2">Best Month to Buy</p>
            <div className="flex gap-1">
                {months.map((m, i) => (
                    <div key={i} className={cn("flex-1 rounded py-1 text-center text-[10px] font-mono border transition-all",
                        m.isTarget ? "bg-green-500/20 border-green-500/50 text-green-300 font-bold scale-105" : "border-zinc-700 text-zinc-600")}>
                        {m.label}
                        {m.isTarget && <div className="text-[8px] text-green-400">★</div>}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function PurchaseAdvisor({ monthlySavings }) {
    // Feature #16 — Comparison mode: two items
    const [compareMode, setCompareMode] = useState(false);
    const [items, setItems] = useState([{ name: '', price: '' }, { name: '', price: '' }]);
    const [singleName, setSingleName] = useState('');
    const [singlePrice, setSinglePrice] = useState('');
    const [result, setResult] = useState(null);
    const [result2, setResult2] = useState(null);
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => { getPurchaseAdvisorLogs().then(setLogs); }, []);

    async function handleAnalyze() {
        if (!singleName || !singlePrice) return;
        setLoading(true); setResult(null);
        const res = await analyzePurchase(singleName, singlePrice, monthlySavings);
        setResult(res);
        setLoading(false);
    }

    async function handleCompare() {
        if (!items[0].name || !items[0].price || !items[1].name || !items[1].price) return;
        setLoading(true); setResult(null); setResult2(null);
        const [r1, r2] = await Promise.all([
            analyzePurchase(items[0].name, items[0].price, monthlySavings),
            analyzePurchase(items[1].name, items[1].price, monthlySavings)
        ]);
        setResult(r1); setResult2(r2);
        setLoading(false);
    }

    async function handleLogDecision(verdict, decision) {
        const name = compareMode ? `${items[0].name} vs ${items[1].name}` : singleName;
        const price = compareMode ? parseFloat(items[0].price) : parseFloat(singlePrice);
        await logPurchaseDecision(name, price, verdict, decision);
        setLogs(await getPurchaseAdvisorLogs());
    }

    // Feature #17 — Opportunity cost: 10% annual return on invested amount over 5 years
    function calcOpportunityCost(price) {
        const years = 5, rate = 0.10;
        const futureValue = price * Math.pow(1 + rate, years);
        return futureValue - price;
    }

    const inp = "rounded border border-zinc-700 bg-zinc-800/80 px-3 py-2 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500 w-full";

    function ResultCard({ res }) {
        if (!res) return null;
        const opportunityCost = calcOpportunityCost(res.targetPrice);
        return (
            <div className="space-y-4">
                {/* Verdict Banner with #19 tag */}
                <div className={cn("rounded-xl border p-4 relative overflow-hidden",
                    res.canBuyNow ? "border-green-500/30 bg-green-500/5" : "border-yellow-500/20 bg-yellow-500/5")}>
                    <div className={`absolute top-0 left-0 h-0.5 w-full ${res.canBuyNow ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div className="flex items-center justify-between mb-2">
                        <p className="font-bold font-mono text-sm">{res.itemName} — {fmt(res.targetPrice)}</p>
                        <VerdictTag canBuyNow={res.canBuyNow} monthsNeeded={res.monthsNeeded} shortfall={res.shortfall} />
                    </div>
                    {res.canBuyNow
                        ? <p className="text-xs font-mono text-green-300">✅ Liquid available: <span className="font-bold">{fmt(res.totalLiquid)}</span> → After purchase: <span className="text-green-400">{fmt(res.totalLiquid - res.targetPrice)}</span></p>
                        : <p className="text-xs font-mono text-yellow-200">Short by <span className="text-red-400 font-bold">{fmt(res.shortfall)}</span>.{res.monthsNeeded ? <> Save <span className="text-white font-bold">{fmt(res.monthlySavings)}/mo</span> → <span className="text-yellow-300 font-bold">{res.monthsNeeded} months away</span></> : ' Set savings to see timeline.'}</p>}
                </div>

                {/* Feature #17 — Opportunity Cost */}
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 flex items-start gap-3">
                    <TrendingDown size={14} className="text-orange-400 mt-0.5 shrink-0" />
                    <div>
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Opportunity Cost</p>
                        <p className="text-xs font-mono text-orange-200 mt-0.5">
                            If you invested {fmt(res.targetPrice)} at 10%/yr instead, in 5 years you'd have{' '}
                            <span className="text-orange-400 font-bold">{fmt(res.targetPrice + opportunityCost)}</span>
                            {' '}(gain: <span className="text-orange-300">{fmt(opportunityCost)}</span>)
                        </p>
                    </div>
                </div>

                {/* Feature #18 — Calendar */}
                {!res.canBuyNow && res.affordableDate && (
                    <BestMonthCalendar affordableDate={res.affordableDate} />
                )}

                {/* 3 Options */}
                <div className="grid gap-3 sm:grid-cols-3 text-xs font-mono">
                    <div className={cn("rounded-lg border p-3", res.canBuyNow ? "border-green-500/30 bg-green-500/5" : "border-zinc-700 opacity-50")}>
                        <p className="text-zinc-500 uppercase text-[10px] mb-1">Option A — Buy Now</p>
                        <p>Liquid: <span className="text-white">{fmt(res.totalLiquid)}</span></p>
                        <p>After: <span className={res.canBuyNow ? "text-green-400" : "text-red-400"}>{fmt(res.totalLiquid - res.targetPrice)}</span></p>
                    </div>
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                        <p className="text-zinc-500 uppercase text-[10px] mb-1">Option B — Save</p>
                        {res.monthsNeeded ? <>
                            <p>Wait: <span className="text-white font-bold">{res.monthsNeeded}mo</span></p>
                            <p>Rate: {fmt(res.monthlySavings)}/mo</p>
                        </> : <p className="text-orange-400">Set savings rate</p>}
                    </div>
                    <div className={cn("rounded-lg border p-3", res.canLiquidate ? "border-orange-500/20 bg-orange-500/5" : "border-red-500/20 opacity-60")}>
                        <p className="text-zinc-500 uppercase text-[10px] mb-1">Option C — Liquidate</p>
                        {res.canLiquidate
                            ? res.liquidationPlan.map((a, i) => <p key={i} className="text-orange-300 truncate">{a.name}: -{fmt(a.sellAmount)}</p>)
                            : <p className="text-red-400">Insufficient assets</p>}
                    </div>
                </div>

                {/* Decision Buttons — Feature #20 log */}
                <div className="flex gap-2">
                    {['BUY_NOW', 'WAIT', 'SKIP'].map(d => (
                        <button key={d} onClick={() => handleLogDecision(res.canBuyNow ? 'CAN_BUY' : 'WAIT', d)}
                            className="cursor-pointer text-[10px] font-mono border border-zinc-700 text-zinc-400 px-3 py-1 rounded hover:bg-zinc-800 transition-colors">
                            LOG: {d.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Mode toggle */}
            <div className="flex items-center gap-2">
                <button onClick={() => { setCompareMode(false); setResult(null); setResult2(null); }}
                    className={cn("cursor-pointer text-xs font-mono px-3 py-1.5 rounded border transition-colors", !compareMode ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/5" : "border-zinc-700 text-zinc-500 hover:text-white")}>
                    Single Item
                </button>
                {/* Feature #16 */}
                <button onClick={() => { setCompareMode(true); setResult(null); setResult2(null); }}
                    className={cn("cursor-pointer text-xs font-mono px-3 py-1.5 rounded border transition-colors", compareMode ? "border-yellow-500/40 text-yellow-400 bg-yellow-500/5" : "border-zinc-700 text-zinc-500 hover:text-white")}>
                    Compare 2 Items
                </button>
                <button onClick={() => setShowLogs(v => !v)}
                    className="cursor-pointer ml-auto text-xs font-mono text-zinc-500 hover:text-white border border-zinc-700 px-3 py-1.5 rounded flex items-center gap-1">
                    <History size={11} /> History
                </button>
            </div>

            {/* Input area */}
            {!compareMode ? (
                <div className="rounded-xl border border-yellow-500/20 bg-zinc-900/60 p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <input value={singleName} onChange={e => setSingleName(e.target.value)} placeholder="Item name (e.g. MacBook Pro)" className={inp} />
                        <input type="number" value={singlePrice} onChange={e => setSinglePrice(e.target.value)} placeholder="Price ₹" className={cn(inp, "sm:w-36")} />
                        <button onClick={handleAnalyze} disabled={loading} className="cursor-pointer px-5 py-2 text-sm font-bold font-mono bg-yellow-500 text-zinc-900 rounded hover:bg-yellow-400 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                            <Brain size={15} /> {loading ? '...' : 'ANALYZE'}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="rounded-xl border border-yellow-500/20 bg-zinc-900/60 p-4 space-y-3">
                    {items.map((item, i) => (
                        <div key={i} className="flex gap-2">
                            <span className="text-xs font-mono text-zinc-500 w-4 mt-2">{i + 1}.</span>
                            <input value={item.name} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))} placeholder="Item name" className={inp} />
                            <input type="number" value={item.price} onChange={e => setItems(prev => prev.map((it, idx) => idx === i ? { ...it, price: e.target.value } : it))} placeholder="₹" className={cn(inp, "w-28")} />
                        </div>
                    ))}
                    <button onClick={handleCompare} disabled={loading} className="cursor-pointer w-full py-2 text-sm font-bold font-mono bg-yellow-500 text-zinc-900 rounded hover:bg-yellow-400 disabled:opacity-50 flex items-center justify-center gap-2">
                        <Brain size={15} /> {loading ? 'ANALYZING...' : 'COMPARE'}
                    </button>
                </div>
            )}

            {/* Results */}
            {compareMode && result && result2 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4"><ResultCard res={result} /></div>
                    <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4"><ResultCard res={result2} /></div>
                </div>
            ) : result ? <ResultCard res={result} /> : null}

            {/* Feature #20 — Purchase History Log */}
            {showLogs && (
                <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 overflow-hidden">
                    <p className="text-xs text-zinc-400 font-mono uppercase tracking-widest px-4 py-3 border-b border-zinc-700/50">Decision History</p>
                    {logs.length === 0 ? <p className="px-4 py-6 text-center text-xs text-zinc-600 font-mono">No decisions logged yet.</p> : (
                        <div className="divide-y divide-zinc-800 max-h-56 overflow-y-auto">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center gap-3 px-4 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-mono text-white truncate">{log.itemName}</p>
                                        <p className="text-[10px] text-zinc-500 font-mono">{new Date(log.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                    </div>
                                    <span className={cn("text-[10px] font-mono px-2 py-0.5 rounded border",
                                        log.verdict === 'CAN_BUY' ? "text-green-400 border-green-500/30 bg-green-500/10"
                                            : "text-yellow-400 border-yellow-500/30 bg-yellow-500/10")}>
                                        {log.verdict}
                                    </span>
                                    {log.decision && <span className="text-[10px] font-mono text-zinc-500">{log.decision}</span>}
                                    <span className="text-xs font-mono text-white">{fmt(log.price)}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
