'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, ArrowUpCircle } from 'lucide-react';

export function LevelUpModal() {
    const [level, setLevel] = useState(null);

    useEffect(() => {
        const handleLevelUp = (e) => {
            const newLevel = e.detail?.level;
            if (newLevel) {
                setLevel(newLevel);
                // Play Sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'); // Generic drum/impact
                audio.volume = 0.5;
                audio.play().catch(() => { });
            }
        };

        window.addEventListener('sys_level_up', handleLevelUp);
        return () => window.removeEventListener('sys_level_up', handleLevelUp);
    }, []);

    const handleAccept = () => {
        setLevel(null);
    };

    return (
        <AnimatePresence>
            {level && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md">
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0, y: -100 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 1.2, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                        className="relative flex flex-col items-center p-12 text-center"
                    >
                        {/* Background Flares */}
                        <div className="absolute inset-0 bg-blue-500/20 blur-[100px] animate-pulse rounded-full" />

                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2 }}
                            className="relative z-10 mb-6"
                        >
                            <ArrowUpCircle className="h-32 w-32 text-blue-500 drop-shadow-[0_0_30px_rgba(59,130,246,0.8)]" />
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="relative z-10 text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-blue-400 drop-shadow-[0_5px_5px_rgba(0,0,0,1)]"
                        >
                            LEVEL UP!
                        </motion.h1>

                        <div className="relative z-10 mt-4 space-y-2">
                            <p className="text-3xl font-mono font-bold text-white">
                                LEVEL <span className="text-blue-400">{level}</span>
                            </p>
                            <div className="flex flex-col gap-1 text-sm font-mono text-zinc-400">
                                <p className="text-green-400">+5 STAT POINTS</p>
                                <p className="text-green-400">HP FULLY RESTORED</p>
                                <p className="text-green-400">FATIGUE CLEARED</p>
                            </div>
                        </div>

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            onClick={handleAccept}
                            className="relative z-10 mt-10 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] transition-all transform hover:scale-105"
                        >
                            ACCEPT POWER
                        </motion.button>

                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
