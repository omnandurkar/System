'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';

export function LevelUpOverlay({ newLevel, onClose }) {
    useEffect(() => {
        // Big confetti burst
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ffffff', '#a1a1aa']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ffffff', '#a1a1aa']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());

        // Play sound if possible (browsers block auto-play sometimes, but worth a try on interaction)
        // const audio = new Audio('/levelup.mp3');
        // audio.play().catch(e => console.log('Audio blocked', e));

    }, []);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    className="text-center"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                        className="mx-auto mb-8 h-24 w-24 rounded-full border-4 border-dashed border-white"
                    />
                    <h1 className="text-6xl font-black tracking-tighter text-white">LEVEL UP</h1>
                    <p className="mt-4 text-2xl font-mono text-zinc-400">IDENTITY UPGRADED TO</p>
                    <div className="mt-6 text-8xl font-black text-white">{newLevel}</div>
                    <p className="mt-12 animate-pulse text-sm text-zinc-500">CLICK TO CONTINUE PROTCOL</p>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
