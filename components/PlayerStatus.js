'use client';

import { useState, useTransition } from 'react';
import { motion } from 'framer-motion';
import { Heart, Battery, Coffee } from 'lucide-react';
import { recoverFatigue, allocateStat } from '@/app/actions';
import { cn } from '@/lib/utils';
import { BicepsFlexed, Brain, ShieldPlus } from 'lucide-react';

export function PlayerStatus({ user }) {
    const [fatigue, setFatigue] = useState(user.fatigue || 0);
    const [isPending, startTransition] = useTransition();

    const hpPercentage = Math.min(100, Math.max(0, (user.hp / (user.max_hp || 100)) * 100));
    const fatiguePercentage = Math.min(100, Math.max(0, (fatigue / (user.max_fatigue || 100)) * 100));

    // Stats
    const str = user.strength || 1;
    const int = user.intelligence || 1;
    const vit = user.vitality || 1;
    const points = user.stat_points || 0;

    const handleTakeBreak = () => {
        // Optimistic Update
        const newFatigue = Math.max(0, fatigue - 10);
        setFatigue(newFatigue);

        startTransition(async () => {
            await recoverFatigue();
        });
    };

    const handleAllocate = (stat) => {
        startTransition(async () => {
            await allocateStat(stat);
        });
    };

    return (
        <div className="space-y-4 w-full">
            {/* Vitals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2">
                <StatCard
                    label="STR"
                    value={str}
                    icon={<div className="font-black text-red-500">S</div>}
                    color="border-red-500/20 bg-red-500/5 text-red-400"
                    points={points}
                    onAdd={() => handleAllocate('strength')}
                    passive="Rage Mode"
                    passiveActive={str >= 20}
                />
                <StatCard
                    label="INT"
                    value={int}
                    icon={<Brain className="h-4 w-4" />}
                    color="border-blue-500/20 bg-blue-500/5 text-blue-400"
                    points={points}
                    onAdd={() => handleAllocate('intelligence')}
                    passive="Prediction"
                    passiveActive={int >= 20}
                />
                <StatCard
                    label="VIT"
                    value={vit}
                    icon={<ShieldPlus className="h-4 w-4" />}
                    color="border-green-500/20 bg-green-500/5 text-green-400"
                    points={points}
                    onAdd={() => handleAllocate('vitality')}
                    passive="Iron Heart"
                    passiveActive={vit >= 20}
                />
            </div>

            {points > 0 && (
                <div className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-xs font-bold animate-pulse">
                        ⚠️ {points} UNSPENT POINTS
                    </span>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, icon, color, points, onAdd, passive, passiveActive }) {
    return (
        <div className={cn("relative flex flex-col items-center justify-center p-3 rounded-lg border transition-all", color)}>
            <div className="flex items-center gap-2 mb-1 opacity-80">
                {icon}
                <span className="text-xs font-bold tracking-widest">{label}</span>
            </div>
            <div className="text-2xl font-black text-white leading-none">
                {value}
            </div>

            {/* Allocation Button */}
            {points > 0 && (
                <button
                    onClick={onAdd}
                    className="mt-2 w-full py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded uppercase transition-colors"
                >
                    +1
                </button>
            )}

            {/* Passive Indicator */}
            {passiveActive && (
                <div className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_5px_white]" title={`Passive Active: ${passive}`} />
            )}
        </div>
    );
}
