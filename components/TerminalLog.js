'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal } from 'lucide-react';

export function TerminalLog({ logs }) {
    const scrollRef = useRef(null);
    const [visibleLogs, setVisibleLogs] = useState([]);

    // Simple stagger effect on mount
    useEffect(() => {
        let timer;
        let index = 0;
        // Start from oldest (reverse of DESC) for "replay" feel? 
        // No, standard logs show newest top or bottom. 
        // User requested "Scrolling log... look back at Saga".
        // Let's just render them. 
        setVisibleLogs(logs);
    }, [logs]);

    return (
        <div className="w-full h-full min-h-[80vh] bg-black font-mono text-xs sm:text-sm p-4 overflow-hidden border border-zinc-800 rounded-lg relative shadow-[0_0_50px_rgba(0,0,0,0.8)_inset]">

            {/* Scanlines */}
            <div className="absolute inset-0 pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <div className="absolute inset-0 pointer-events-none z-20 bg-gradient-to-b from-transparent via-green-900/5 to-transparent bg-[length:100%_4px] animate-scanlines"></div>

            <div className="relative z-30 mb-4 border-b border-zinc-800 pb-2 flex items-center gap-2 text-green-500">
                <Terminal className="h-4 w-4" />
                <span className="font-bold tracking-widest">SYSTEM_LOGS // ROOT_ACCESS</span>
            </div>

            <div className="space-y-1 overflow-y-auto max-h-[70vh] custom-scrollbar text-green-400/80">
                {visibleLogs.map((log, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-4 hover:bg-green-900/10 p-1 rounded"
                    >
                        <span className="text-zinc-500 shrink-0">
                            [{new Date(log.timestamp).toLocaleString('sv-SE')}]
                        </span>
                        <span className="">
                            {log.message}
                        </span>
                    </motion.div>
                ))}
                {visibleLogs.length === 0 && (
                    <div className="text-zinc-600 italic">No system activity detected...</div>
                )}
            </div>
        </div>
    );
}
