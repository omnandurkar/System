'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function LevelUpOverlay({ newLevel, onClose }) {
    // Mock stats for the level up animation
    const stats = [
        { label: 'STRENGTH', value: 10, increase: 1 },
        { label: 'AGILITY', value: 12, increase: 1 },
        { label: 'SENSE', value: 8, increase: 2 },
        { label: 'VITALITY', value: 15, increase: 1 },
        { label: 'INTELLIGENCE', value: 9, increase: 1 },
    ];

    useEffect(() => {
        // Trigger vibration if available
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100, 50, 100]);
        }

        // Confetti Burst
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 5,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#3b82f6', '#1d4ed8', '#ffffff'] // Blue/White theme
            });
            confetti({
                particleCount: 5,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#3b82f6', '#1d4ed8', '#ffffff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl"
                onClick={onClose}
            >
                {/* Blue Aura Background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-blue-500)_0%,transparent_70%)] opacity-20 pointer-events-none" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="relative w-full max-w-md p-8 text-center border-y-2 border-blue-500/50 bg-black/50"
                >
                    {/* System Message Header */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black px-4 py-1 text-xs font-mono text-blue-400 border border-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        SYSTEM ALERT
                    </div>

                    <motion.div
                        animate={{
                            textShadow: ["0 0 10px #3b82f6", "0 0 20px #3b82f6", "0 0 10px #3b82f6"]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="mb-6"
                    >
                        <h1 className="text-5xl font-black italic tracking-tighter text-white">
                            LEVEL UP!
                        </h1>
                    </motion.div>

                    <div className="mb-8 space-y-2">
                        <p className="text-sm font-mono text-blue-300">IDENTITY UPGRADED</p>
                        <div className="text-7xl font-black text-transparent bg-clip-text bg-linear-to-b from-white to-blue-400">
                            {newLevel}
                        </div>
                    </div>

                    {/* Stat Scroll Animation */}
                    <div className="space-y-1 text-left bg-zinc-900/50 p-4 rounded border border-blue-900/30">
                        {stats.map((stat, i) => (
                            <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + (i * 0.1) }}
                                className="flex justify-between items-center font-mono text-sm"
                            >
                                <span className="text-zinc-400">{stat.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-zinc-500">{stat.value}</span>
                                    <span className="text-blue-400">→</span>
                                    <span className="text-white font-bold">{stat.value + stat.increase}</span>
                                    <span className="text-xs text-green-400">(+{stat.increase})</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <p className="mt-8 animate-pulse text-xs font-mono text-blue-500/60">
                        [ TAP ANYWHERE TO ACCEPT ]
                    </p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
