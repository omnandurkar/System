'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function DailyCompletionOverlay({ onClose }) {
    const [step, setStep] = useState('gate-closing'); // gate-closing, sealed
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Step 1: Gate closes immediately (animation duration)
        const timer1 = setTimeout(() => setStep('sealed'), 1500);

        // Auto close after 6 seconds
        const timer2 = setTimeout(onClose, 6000);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onClose]);

    if (!mounted) return null;

    // Use Portal to render outside of the Dashboard stacking context
    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                // Aggressive Z-Index and Fixed Positioning
                className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-black/80 backdrop-blur-md"
                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                onClick={onClose}
            >
                <div className="relative w-full h-full flex items-center justify-center">

                    {/* The Gate (Two halves closing) */}
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '0%' }}
                        transition={{ type: "spring", bounce: 0, duration: 1.5 }}
                        className="absolute left-0 top-0 w-1/2 h-full bg-zinc-950 border-r-2 border-blue-500/50 flex items-center justify-end"
                    >
                        <div className="h-full w-24 bg-linear-to-r from-transparent to-blue-900/20" />
                    </motion.div>

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: '0%' }}
                        transition={{ type: "spring", bounce: 0, duration: 1.5 }}
                        className="absolute right-0 top-0 w-1/2 h-full bg-zinc-950 border-l-2 border-blue-500/50 flex items-center justify-start"
                    >
                        <div className="h-full w-24 bg-linear-to-l from-transparent to-blue-900/20" />
                    </motion.div>

                    {/* Impact Flash */}
                    {step === 'sealed' && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 bg-blue-500 mix-blend-overlay z-[100]"
                        />
                    )}

                    {/* Center Content Container - Absolutely Centered */}
                    {step === 'sealed' && (
                        <div className="relative z-[10000] flex flex-col items-center justify-center w-full px-4">
                            <motion.div
                                initial={{ scale: 2, opacity: 0, filter: 'blur(10px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className="text-center"
                            >
                                <div className="border-[3px] border-blue-500 bg-black/90 px-6 py-8 md:px-16 md:py-12 shadow-[0_0_100px_rgba(59,130,246,0.5)] backdrop-blur-xl rounded-sm">
                                    <h1 className="text-4xl md:text-8xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.8)] text-center whitespace-nowrap">
                                        DUNGEON
                                        <br className="md:hidden" />
                                        <span className="text-blue-500 md:ml-4">CLEARED</span>
                                    </h1>
                                </div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="mt-12 flex flex-col items-center gap-4"
                                >
                                    <div className="h-px w-64 bg-linear-to-r from-transparent via-blue-500 to-transparent" />
                                    <p className="text-blue-200 font-mono tracking-[0.3em] text-sm md:text-xl uppercase animate-pulse">
                                        All Daily Objectives Complete
                                    </p>
                                    <div className="h-px w-64 bg-linear-to-r from-transparent via-blue-500 to-transparent" />
                                </motion.div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}
