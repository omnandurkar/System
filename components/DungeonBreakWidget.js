'use client';

import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { AlertTriangle, Check, XCircle } from 'lucide-react';
import { completeDungeonBreak, failDungeonBreak } from '@/app/actions';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export function DungeonBreakWidget({ dungeonBreak, onComplete }) {
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            const end = new Date(dungeonBreak.expires_at);
            const diff = differenceInSeconds(end, now);

            if (diff <= 0) {
                // Time's up!
                setTimeLeft(0);
                clearInterval(interval);
                handleFail(); // Auto-fail on timeout
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [dungeonBreak]);

    const handleSuccess = async () => {
        setLoading(true);
        try {
            const res = await completeDungeonBreak(dungeonBreak.id);
            if (res.success) {
                confetti({
                    particleCount: 150,
                    spread: 100,
                    colors: ['#ef4444', '#000000', '#fbbf24']
                });
                onComplete();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleFail = async () => {
        if (loading) return;
        setLoading(true);
        try {
            await failDungeonBreak(dungeonBreak.id);
            onComplete();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
            <div className="bg-zinc-950 border border-red-900/50 rounded-lg p-4 shadow-[0_0_30px_rgba(220,38,38,0.3)] max-w-sm">

                <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 blur-md opacity-50 animate-pulse" />
                        <AlertTriangle className="h-5 w-5 text-red-500 relative z-10" />
                    </div>
                    <div>
                        <h4 className="text-red-500 font-black uppercase text-xs tracking-widest">Dungeon Break Active</h4>
                        <p className="font-mono font-bold text-xl tabular-nums text-red-500">
                            {formatTime(timeLeft)}
                        </p>
                    </div>
                </div>

                <p className="text-sm text-zinc-300 italic mb-4 border-l-2 border-red-900/50 pl-2">
                    {dungeonBreak.description}
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={handleSuccess}
                        disabled={loading}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase py-2 px-3 rounded flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check className="h-3 w-3" /> Complete
                    </button>
                    <button
                        onClick={handleFail}
                        disabled={loading}
                        className="bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 text-xs font-bold uppercase py-2 px-3 rounded transition-colors"
                    >
                        <XCircle className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
