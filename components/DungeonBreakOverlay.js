'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DungeonBreakOverlay({ dungeonBreak, onAccept }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (dungeonBreak) {
            setIsVisible(true);
            // Play sound effect here if possible (e.g., siren)
        }
    }, [dungeonBreak]);

    const handleAccept = () => {
        setIsVisible(false);
        onAccept();
    };

    if (!isVisible || !dungeonBreak) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
            >
                {/* Background Pulse */}
                <div className="absolute inset-0 animate-pulse bg-red-900/20 pointer-events-none" />

                {/* Glitch Overlay */}
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#ff0000_3px)] opacity-10 pointer-events-none mix-blend-overlay" />

                <motion.div
                    initial={{ scale: 0.8, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative w-full max-w-lg p-1 bg-gradient-to-br from-red-600 to-black rounded-xl shadow-[0_0_50px_rgba(220,38,38,0.5)] border border-red-500/50"
                >
                    <div className="bg-black/90 p-8 rounded-xl flex flex-col items-center text-center space-y-6">

                        {/* Icon */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-red-500 blur-2xl opacity-50 animate-pulse" />
                            <AlertTriangle className="h-20 w-20 text-red-600 relative z-10" />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <h2 className="text-4xl font-black text-red-600 tracking-tighter uppercase glitch-text">
                                DUNGEON BREAK
                            </h2>
                            <p className="text-red-400 font-mono tracking-widest text-sm uppercase">
                                EMERGENCY QUEST INITIATED
                            </p>
                        </div>

                        {/* Description */}
                        <div className="bg-red-950/30 border border-red-900/50 p-6 rounded-lg w-full">
                            <p className="text-xl font-bold text-white italic">
                                "{dungeonBreak.description}"
                            </p>
                        </div>

                        {/* Rewards / Penalty */}
                        <div className="flex w-full justify-between px-4">
                            <div className="text-left">
                                <p className="text-xs text-zinc-500 uppercase font-bold">Reward</p>
                                <p className="text-2xl font-black text-yellow-500">{dungeonBreak.xp_reward} XP</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-zinc-500 uppercase font-bold">Failure Penalty</p>
                                <p className="text-2xl font-black text-red-600">-{dungeonBreak.penalty_hp} HP</p>
                            </div>
                        </div>

                        <button
                            onClick={handleAccept}
                            className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest text-lg rounded-none clip-path-polygon transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-900/50"
                        >
                            ACCEPT MISSION
                        </button>

                        <p className="text-[10px] text-zinc-600 font-mono">
                            Time Limit: 30:00 • Failure is not an option
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
