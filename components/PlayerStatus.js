'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Heart, Battery, Coffee } from 'lucide-react';
import { recoverFatigue } from '@/app/actions';
import { cn } from '@/lib/utils'; // Assuming you have this utility

export function PlayerStatus({ user }) {
    const [fatigue, setFatigue] = useState(user.fatigue || 0);
    const [isPending, startTransition] = useTransition();

    const hpPercentage = Math.min(100, Math.max(0, (user.hp / (user.max_hp || 100)) * 100));
    const fatiguePercentage = Math.min(100, Math.max(0, (fatigue / (user.max_fatigue || 100)) * 100));

    const handleTakeBreak = () => {
        // Optimistic Update
        const newFatigue = Math.max(0, fatigue - 10);
        setFatigue(newFatigue);

        startTransition(async () => {
            await recoverFatigue();
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* HP Bar */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-md">
                    <Heart className="h-5 w-5 text-red-500 fill-red-500/20" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span className="text-zinc-400">Health</span>
                        <span className="text-red-500">{user.hp} / {user.max_hp || 100}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-red-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${hpPercentage}%` }}
                            transition={{ type: "spring", stiffness: 100 }}
                        />
                    </div>
                </div>
            </div>

            {/* Fatigue Bar & Break Button */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-md">
                    <Battery className="h-5 w-5 text-orange-500" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold uppercase mb-1">
                        <span className="text-zinc-400">Fatigue</span>
                        <span className="text-orange-500">{fatigue}%</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full transition-colors",
                                fatigue > 90 ? "bg-red-500 animate-pulse" : "bg-orange-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{ width: `${fatiguePercentage}%` }}
                            transition={{ type: "spring", stiffness: 100 }}
                        />
                    </div>
                </div>

                {/* Take a Break Button */}
                <button
                    onClick={handleTakeBreak}
                    disabled={isPending || fatigue === 0}
                    className="ml-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] uppercase font-bold rounded flex flex-col items-center gap-0.5 transition-all active:scale-95"
                    title="Recover 10 Fatigue"
                >
                    <Coffee className="h-3 w-3" />
                    <span>Rest</span>
                </button>
            </div>
        </div>
    );
}
