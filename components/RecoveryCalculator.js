'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Battery, Activity, Brain } from 'lucide-react';
import { logRecovery } from '@/app/recovery-actions';
import { Button } from '@/components/ui/modal';

export function RecoveryCalculator({ initialLog }) {
    const [sleep, setSleep] = useState(initialLog?.sleep_hours || 7);
    const [soreness, setSoreness] = useState(initialLog?.soreness_level || 3);
    const [stress, setStress] = useState(initialLog?.stress_level || 3);
    const [score, setScore] = useState(initialLog?.recovery_score || null);
    const [loading, setLoading] = useState(false);

    async function handleScan() {
        setLoading(true);
        const res = await logRecovery({ sleep, soreness, stress });
        setScore(res.score);
        setLoading(false);
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6 rounded-xl border border-zinc-800 bg-black/40 p-6 backdrop-blur">
                <div className="flex items-center gap-3">
                    <Activity className="h-5 w-5 text-green-500" />
                    <h2 className="text-lg font-bold text-white tracking-wide">BIOMETRIC SCAN</h2>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Sleep Duration</span>
                            <span className="font-mono text-zinc-100">{sleep} h</span>
                        </div>
                        <input
                            type="range" min="0" max="12" step="0.5"
                            value={sleep} onChange={e => setSleep(parseFloat(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Muscle Soreness</span>
                            <span className="font-mono text-zinc-100">{soreness} / 10</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={soreness} onChange={e => setSoreness(parseInt(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-zinc-400">Mental Stress</span>
                            <span className="font-mono text-zinc-100">{stress} / 10</span>
                        </div>
                        <input
                            type="range" min="0" max="10" step="1"
                            value={stress} onChange={e => setStress(parseInt(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-white"
                        />
                    </div>

                    <Button
                        onClick={handleScan}
                        disabled={loading}
                        className="w-full bg-white text-black hover:bg-zinc-200"
                    >
                        {loading ? 'ANALYZING...' : 'RUN VISUALIZATION'}
                    </Button>
                </div>
            </div>

            <div className="flex flex-col justify-center rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 text-center">
                {score !== null ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-2"
                    >
                        <h3 className="text-sm font-mono text-zinc-500 uppercase">Recovery Readiness</h3>
                        <div className="text-6xl font-black text-white">{score}%</div>
                        <p className={score > 80 ? "text-green-500" : score > 50 ? "text-yellow-500" : "text-red-500"}>
                            {score > 80 ? "OPTIMAL STATE" : score > 50 ? "MAINTENANCE REQUIRED" : "CRITICAL FATIGUE"}
                        </p>
                    </motion.div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-zinc-500">
                        <Brain className="h-12 w-12 opacity-20" />
                        <p className="font-mono text-xs">NO DATA AVAILABLE</p>
                    </div>
                )}
            </div>
        </div>
    );
}
