'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Send } from 'lucide-react'; // Eye icon for "watching"
import { checkSystemWhisper, verifyWhisper } from '@/app/actions';
import { cn } from '@/lib/utils'; // Assuming utils exists

export function SystemWhisper() {
    const [whisper, setWhisper] = useState(null);
    const [input, setInput] = useState('');
    const [status, setStatus] = useState('IDLE'); // IDLE, VERIFYING, RESULT
    const [resultMsg, setResultMsg] = useState('');

    useEffect(() => {
        async function fetchWhisper() {
            const w = await checkSystemWhisper();
            if (w && w.status === 'ACTIVE') {
                setWhisper(w);
            }
        }
        fetchWhisper();
    }, []);

    const handleVerify = async () => {
        if (!input) return;
        setStatus('VERIFYING');

        try {
            const res = await verifyWhisper(whisper.id, input);
            setResultMsg(res.message);
            if (res.success) {
                setStatus('SUCCESS');
                // Trigger global level up event if needed? verifyWhisper handles XP.
                if (res.message.includes('Level Up')) { // If we updated action to return this info
                    window.dispatchEvent(new CustomEvent('sys_level_up', { detail: { level: 'Unknown' } })); // Simplified
                }
            } else {
                setStatus('FAILED');
            }

            setTimeout(() => {
                setWhisper(null); // Hide after interaction
            }, 5000);

        } catch (e) {
            setStatus('IDLE');
        }
    };

    if (!whisper) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-2xl mx-auto mb-8 p-1"
            >
                <div className="relative overflow-hidden rounded-lg bg-black border border-purple-500/30 p-6 shadow-[0_0_30px_rgba(168,85,247,0.15)]">
                    {/* Pulsing Background */}
                    <div className="absolute inset-0 bg-purple-900/5 animate-pulse" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Eye className="h-8 w-8 text-purple-500 animate-pulse" />
                                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-40 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-purple-400 mb-1">
                                    THE SYSTEM WHISPERS
                                </h3>
                                <p className="text-lg md:text-xl font-serif italic text-white/90 leading-tight">
                                    "{whisper.message}"
                                </p>
                            </div>
                        </div>

                        {status === 'IDLE' && (
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <input
                                    type={whisper.type === 'WAKE_EARLY' ? "time" : "number"}
                                    placeholder={whisper.type === 'WAKE_EARLY' ? "" : "Value"}
                                    className="bg-black/50 border border-purple-500/50 rounded px-3 py-2 text-white font-mono focus:outline-none focus:border-purple-400 w-full md:w-32"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    onClick={handleVerify}
                                    className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
                                >
                                    <Send className="h-4 w-4" />
                                </button>
                            </div>
                        )}

                        {status !== 'IDLE' && (
                            <div className="flex-1 text-right">
                                <span className={cn(
                                    "font-mono text-sm font-bold",
                                    status === 'SUCCESS' ? "text-green-400" :
                                        status === 'FAILED' ? "text-red-400" : "text-purple-400 animate-pulse"
                                )}>
                                    {status === 'VERIFYING' ? "VERIFYING..." : resultMsg}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
