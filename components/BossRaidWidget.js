'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Swords, Skull, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

import { getRank } from '@/lib/rank';

export function BossRaidWidget({ bossRaid, totalTasks, completedTasks, userLevel }) {
    if (!bossRaid || !bossRaid.isActive) return null;

    const rankInfo = getRank(userLevel || 1);
    const { boss } = bossRaid;
    const progress = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
    const healthPercentage = Math.max(0, 100 - (progress * 100));
    const isDefeated = healthPercentage <= 0;

    const [shatter, setShatter] = useState(false);

    useEffect(() => {
        if (isDefeated) {
            setShatter(true);
            const duration = 3 * 1000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

            const randomInRange = (min, max) => Math.random() * (max - min) + min;

            const interval = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);
                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);
        }
    }, [isDefeated]);

    return (
        <div className="relative w-full mb-8 group">
            <AnimatePresence>
                {isDefeated && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn(
                            "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-xl border",
                            rankInfo.border,
                            rankInfo.bg.replace('/10', '/20')
                        )}
                    >
                        <motion.div
                            animate={{ rotate: [0, -5, 5, -5, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                        >
                            <Trophy className={cn("w-20 h-20 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]", rankInfo.color)} />
                        </motion.div>
                        <h2 className={cn(
                            "mt-4 text-4xl font-black text-transparent bg-clip-text bg-linear-to-b tracking-tighter uppercase drop-shadow-sm",
                            rankInfo.color === 'text-yellow-400' ? "from-yellow-300 to-yellow-600" :
                                rankInfo.color === 'text-red-500' ? "from-red-400 to-red-700" :
                                    rankInfo.color === 'text-purple-400' ? "from-purple-300 to-purple-600" :
                                        "from-white to-zinc-400"
                        )}>
                            DUNGEON CLEARED
                        </h2>
                        <p className={cn("font-mono text-sm tracking-widest mt-1 uppercase", rankInfo.color)}>
                            RANK {rankInfo.rank} REWARD CLAIMED
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Boss Card */}
            <div
                className={cn(
                    "relative overflow-hidden rounded-xl border-2 bg-zinc-950 p-6 transition-all duration-500",
                    isDefeated ? "opacity-20 blur-sm grayscale" : "opacity-100"
                )}
                style={{
                    borderColor: boss.theme.primary,
                    boxShadow: `0 0 20px ${boss.theme.shadow}`
                }}
            >
                {/* Background Glow */}
                <div
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{ background: `linear-gradient(to bottom right, ${boss.theme.secondary}, black)` }}
                />

                <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center">

                    {/* Boss Icon/Avatar */}
                    <div className="relative">
                        <div
                            className="w-24 h-24 rounded-full border-4 flex items-center justify-center bg-zinc-900 shadow-xl"
                            style={{ borderColor: boss.theme.primary }}
                        >
                            <Skull className="w-12 h-12" style={{ color: boss.theme.primary }} />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-black/80 backdrop-blur px-2 py-0.5 rounded border border-zinc-700">
                            <span className="text-xs font-bold text-zinc-400">LVL</span>
                            <span className="text-lg font-black ml-1 text-white">{boss.level}</span>
                        </div>
                    </div>

                    {/* Boss Info & HP */}
                    <div className="flex-1 w-full space-y-4">
                        <div className="text-center md:text-left">
                            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-red-900/30 text-red-500 border border-red-900/50">
                                    Boss Raid
                                </span>
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-zinc-800 text-zinc-400 border border-zinc-700">
                                    Weekly Challenge
                                </span>
                            </div>
                            <h3 className="text-2xl font-black italic uppercase tracking-tighter" style={{ color: boss.theme.accent }}>
                                {boss.name}
                            </h3>
                            <p className="text-sm text-zinc-500 font-mono uppercase tracking-widest">
                                {boss.title}
                            </p>
                        </div>

                        {/* HP Bar */}
                        <div className="space-y-1">
                            <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-zinc-400">
                                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Boss HP</span>
                                <span className="font-mono">{Math.round(healthPercentage)}%</span>
                            </div>
                            <div className="h-6 w-full bg-zinc-900/50 rounded-full overflow-hidden border border-zinc-800 relative">
                                {/* HP Fill */}
                                <motion.div
                                    className="h-full relative"
                                    initial={{ width: '100%' }}
                                    animate={{ width: `${healthPercentage}%` }}
                                    transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                                    style={{ backgroundColor: boss.theme.primary }}
                                >
                                    <div className="absolute inset-0 bg-linear-to-b from-white/20 to-transparent" />
                                    {/* Pulse effect */}
                                    <div className="absolute inset-0 animate-pulse bg-white/10" />
                                </motion.div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                    <Swords className="w-32 h-32" style={{ color: boss.theme.secondary }} />
                </div>
            </div>
        </div>
    );
}
