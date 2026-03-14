'use client';
/**
 * QuickExpenseLogger.js
 * A thumb-friendly, fast daily expense logging drawer.
 * Features:
 * - Number pad (like a calculator) — no keyboard needed
 * - Category icon chips — no dropdown
 * - Recent entries row — tap to instantly re-log
 * - Swipe-to-dismiss backdrop
 */

import { useState } from 'react';
import {
    UtensilsCrossed, Car, Heart, Tv, ShoppingBag, MoreHorizontal,
    Delete, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
    { id: 'FOOD', label: 'Food', icon: UtensilsCrossed, color: '#eab308', bg: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' },
    { id: 'TRANSPORT', label: 'Transport', icon: Car, color: '#06b6d4', bg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
    { id: 'HEALTH', label: 'Health', icon: Heart, color: '#ec4899', bg: 'bg-pink-500/15 border-pink-500/30 text-pink-400' },
    { id: 'ENTERTAINMENT', label: 'Entertainment', icon: Tv, color: '#f97316', bg: 'bg-orange-500/15 border-orange-500/30 text-orange-400' },
    { id: 'SHOPPING', label: 'Shopping', icon: ShoppingBag, color: '#8b5cf6', bg: 'bg-violet-500/15 border-violet-500/30 text-violet-400' },
    { id: 'OTHER', label: 'Other', icon: MoreHorizontal, color: '#6b7280', bg: 'bg-zinc-500/15 border-zinc-500/30 text-zinc-400' },
];

const NUMPAD = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', '⌫'],
];

function fmt(n) {
    if (!n || n === '0') return '₹0';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(parseInt(n) || 0);
}

export default function QuickExpenseLogger({ onClose, onSubmit, recentExpenses = [] }) {
    const [amount, setAmount] = useState('');
    const [selectedCat, setSelectedCat] = useState('FOOD');
    const [note, setNote] = useState('');
    const [submitted, setSubmitted] = useState(false);

    function handleNumpad(key) {
        if (key === '⌫') {
            setAmount(v => v.slice(0, -1));
        } else if (key === '00') {
            setAmount(v => (v === '' || v === '0') ? v : v + '00');
        } else {
            setAmount(v => {
                if (v === '0') return key;
                if (v.length >= 7) return v; // cap at ₹9,999,999
                return v + key;
            });
        }
    }

    async function handleSubmit() {
        if (!amount || parseInt(amount) <= 0) return;
        setSubmitted(true);
        const catObj = CATEGORIES.find(c => c.id === selectedCat);
        await onSubmit(note || catObj?.label || selectedCat, amount, selectedCat, '');
        // Brief success flash then close
        setTimeout(() => { onClose(); }, 600);
    }

    async function handleRepeat(exp) {
        setSubmitted(true);
        await onSubmit(exp.name, exp.amount.toString(), exp.category, '');
        setTimeout(() => { onClose(); }, 600);
    }

    const catObj = CATEGORIES.find(c => c.id === selectedCat);
    const displayAmount = amount ? fmt(amount) : '₹0';

    // De-duplicate recent entries for the repeat row (last 5 unique names)
    // Newest entries are already first from the server (descending)
    const recentUnique = [];
    const seen = new Set();
    for (const e of recentExpenses) {
        if (!seen.has(e.name) && recentUnique.length < 5) {
            seen.add(e.name);
            recentUnique.push(e);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Drawer */}
            <div
                className="relative w-full max-w-md rounded-t-3xl border-t border-l border-r border-zinc-700/50 bg-zinc-950/90 backdrop-blur-md pb-8 shadow-2xl animate-[slideUp_0.25s_ease-out] overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                <style>{`
                    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                    @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.3); } 100% { transform: scale(1); opacity: 1; } }
                    .check-pop { animation: checkPop 0.35s ease-out; }
                `}</style>

                {/* HUD Elements */}
                <div className="absolute top-4 left-4 w-2 h-2 border-t border-l border-white/20 rounded-tl-sm pointer-events-none" />
                <div className="absolute top-4 right-4 w-2 h-2 border-t border-r border-white/20 rounded-tr-sm pointer-events-none" />

                {/* Drag pill */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 rounded-full bg-zinc-800" />
                </div>

                {submitted ? (
                    /* Success state */
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <CheckCircle2 size={48} className="text-green-500 check-pop drop-shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                        <p className="text-sm font-mono text-green-400 uppercase tracking-widest">Entry Synchronized</p>
                    </div>
                ) : (
                    <>
                        {/* Quick Repeat Row */}
                        {recentUnique.length > 0 && (
                            <div className="px-4 pb-3">
                                <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] mb-2 px-1 italic">Recents</p>
                                <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1 touch-pan-x select-none px-1">
                                    {recentUnique.map((exp, i) => {
                                        const cat = CATEGORIES.find(c => c.id === exp.category);
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => handleRepeat(exp)}
                                                className={cn(
                                                    "cursor-pointer shrink-0 flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono transition-all hover:scale-105 active:scale-95",
                                                    cat?.bg || 'bg-zinc-800 border-zinc-700 text-zinc-400'
                                                )}
                                            >
                                                <div className="w-1 h-1 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
                                                <span className="truncate max-w-[80px]">{exp.name}</span>
                                                <span className="opacity-70">₹{exp.amount}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Amount Display */}
                        <div className="flex flex-col items-center py-5 px-6 border-y border-white/5 mb-3 bg-white/2">
                            <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em] mb-1 italic">Magnitude</p>
                            <p className={cn("text-5xl font-black font-mono transition-all tracking-tighter",
                                amount ? 'text-white drop-shadow-[0_0_1px_rgba(255,255,255,0.5)]' : 'text-zinc-800')}>
                                {displayAmount}
                            </p>
                            {/* Note input below amount */}
                            <input
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder={`DETAILS (${catObj?.label || 'OPTIONAL'})`}
                                className="mt-3 w-full text-center text-[10px] font-mono bg-transparent text-zinc-500 placeholder:text-zinc-800 focus:outline-none border-b border-zinc-900 pb-1 focus:border-zinc-700 uppercase tracking-widest transition-all"
                            />
                        </div>

                        {/* Category Chips - Grid for accessibility */}
                        <div className="grid grid-cols-3 gap-2 px-4 mb-4">
                            {CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCat(cat.id)}
                                    className={cn(
                                        "cursor-pointer flex flex-row items-center gap-2 rounded-xl border px-2 py-2 transition-all",
                                        selectedCat === cat.id
                                            ? cat.bg + ' scale-105 shadow-md border-white/20'
                                            : 'bg-zinc-900/50 border-white/5 text-zinc-500 hover:border-zinc-700 hover:bg-zinc-900'
                                    )}
                                >
                                    <cat.icon size={13} className="shrink-0" />
                                    <span className="text-[9px] font-bold font-mono uppercase tracking-tighter truncate">{cat.label}</span>
                                    {selectedCat === cat.id && <div className="w-1 h-1 rounded-full bg-current shadow-[0_0_5px_currentColor] shrink-0" />}
                                </button>
                            ))}
                        </div>

                        {/* Number Pad */}
                        <div className="px-6">
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {NUMPAD.flat().map((key, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleNumpad(key)}
                                        className={cn(
                                            "cursor-pointer h-14 rounded-2xl font-mono text-xl font-black transition-all active:scale-95",
                                            key === '⌫'
                                                ? 'bg-zinc-800/50 text-red-500/80 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400'
                                                : 'bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-white/5 hover:border-white/10'
                                        )}
                                    >
                                        {key === '⌫' ? <Delete size={20} className="mx-auto" /> : key}
                                    </button>
                                ))}
                            </div>

                            {/* LOG button */}
                            <button
                                onClick={handleSubmit}
                                disabled={!amount || parseInt(amount) <= 0}
                                style={{ background: amount && parseInt(amount) > 0 ? catObj?.color : undefined }}
                                className={cn(
                                    "cursor-pointer w-full py-4 rounded-2xl font-black font-mono text-sm tracking-[0.2em] transition-all active:scale-95 uppercase shadow-xl",
                                    amount && parseInt(amount) > 0
                                        ? 'text-zinc-950 hover:brightness-110 shadow-current/20'
                                        : 'bg-zinc-900 text-zinc-700 cursor-not-allowed border border-white/5'
                                )}
                            >
                                {amount && parseInt(amount) > 0
                                    ? `LOG ${displayAmount} → ${catObj?.label}`
                                    : 'AWAITING MAGNITUDE'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
