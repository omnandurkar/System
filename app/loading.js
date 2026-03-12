'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
    const [progress, setProgress] = useState(0);
    const [statusText, setStatusText] = useState("INITIALIZING");

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) return 100;

                // Random text updates for gamified feel
                if (p > 20 && p < 40) setStatusText("LOADING ASSETS");
                if (p > 40 && p < 70) setStatusText("CALCULATING STATS");
                if (p > 70 && p < 90) setStatusText("RENDERING HUD");
                if (p >= 90) setStatusText("SYSTEM READY");

                return p + Math.floor(Math.random() * 15) + 5; // Fast bursty loading
            });
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex min-h-[75vh] w-full flex-col  items-center justify-center space-y-8 font-mono">
            {/* The Gamified "System" Ring */}
            <div className="relative flex h-32 w-32 mt-64 items-center justify-center">

                {/* Background Track */}
                <svg className="absolute inset-0 h-full w-full rotate-[-90deg]">
                    <circle
                        cx="64" cy="64" r="60"
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4"
                    />
                    {/* Dynamic Progress Arc */}
                    <motion.circle
                        cx="64" cy="64" r="60"
                        fill="none"
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="4"
                        strokeDasharray="377"
                        animate={{ strokeDashoffset: 377 - (377 * progress) / 100 }}
                        transition={{ ease: "easeOut", duration: 0.2 }}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                    />
                </svg>

                {/* Inner Hex Core */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute h-20 w-20"
                >
                    <svg viewBox="0 0 100 100" className="h-full w-full opacity-30">
                        <polygon points="50 5, 95 25, 95 75, 50 95, 5 75, 5 25" fill="none" stroke="white" strokeWidth="2" strokeDasharray="10 5" />
                    </svg>
                </motion.div>

                {/* Dynamic Value */}
                <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-xl font-bold tracking-tighter text-white">
                        {progress}%
                    </span>
                </div>
            </div>

            {/* Reading out the text */}
            <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center gap-3 border border-white/20 bg-black/40 px-4 py-1.5 rounded-sm backdrop-blur-sm">
                    <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        className="h-2 w-2 bg-white"
                    />
                    <span className="text-xs font-bold tracking-[0.3em] text-zinc-300">
                        {statusText}
                    </span>
                </div>

                {/* Glitchy Data Stream aesthetic */}
                <motion.div
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: [0.3, 0.8, 0.4, 0.9, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="text-[9px] text-zinc-600 tracking-[0.5em] w-32 overflow-hidden whitespace-nowrap"
                >
                    {progress.toString(16).toUpperCase()}8A9F... 0x{(progress * 1337).toString(16).toUpperCase().padStart(4, '0')}
                </motion.div>
            </div>
        </div>
    );
}
