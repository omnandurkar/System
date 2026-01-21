'use client';

import { Modal } from '@/components/ui/modal';
import { Shield, Dumbbell, Moon, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DayDetailDialog({ isOpen, onClose, date, data }) {
    if (!data) return null;

    const { tasks, gym, recovery, exp } = data;
    const formattedDate = date ? format(new Date(date), 'EEEE, MMMM do, yyyy') : '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={formattedDate}>
            <div className="text-zinc-500 font-mono tracking-widest text-xs uppercase mb-6 -mt-2">
                Daily Log Analysis
            </div>

            <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">EXP Gained</span>
                        <span className="text-2xl font-black text-yellow-400">+{exp}</span>
                    </div>
                    <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest block">Tasks Done</span>
                        <span className="text-2xl font-black text-white">{tasks.length}</span>
                    </div>
                </div>

                {/* Tasks */}
                {tasks.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-indigo-400">
                            <Shield className="h-4 w-4" /> Completed Protocols
                        </h4>
                        <div className="space-y-1">
                            {tasks.map((t, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm p-2 bg-white/5 rounded border border-white/5">
                                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                                    <span>{t.title}</span>
                                    <span className="ml-auto text-xs font-mono text-zinc-500">+{t.exp_value} XP</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Gym */}
                {gym.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-red-400">
                            <Dumbbell className="h-4 w-4" /> Training Log
                        </h4>
                        <div className="space-y-1">
                            {gym.map((g, i) => (
                                <div key={i} className="flex items-center justify-between text-sm p-2 bg-white/5 rounded border border-white/5">
                                    <span className="font-medium">{g.exercise_name}</span>
                                    <span className="text-xs font-mono text-zinc-400">{g.sets_reps}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recovery */}
                {recovery && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-400">
                            <Moon className="h-4 w-4" /> Recovery Data
                        </h4>
                        <div className="bg-white/5 rounded-lg border border-white/5 p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Sleep Duration</span>
                                <span className="font-mono text-white">{recovery.sleep_hours} hrs</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-zinc-400">Recovery Score</span>
                                <span className={cn(
                                    "font-bold font-mono",
                                    recovery.recovery_score >= 80 ? "text-green-400" : "text-yellow-400"
                                )}>{recovery.recovery_score}%</span>
                            </div>
                            {recovery.had_dream && (
                                <div className="pt-2 border-t border-white/10 mt-2">
                                    <span className="text-[10px] text-fuchsia-400 uppercase tracking-widest block mb-1">Dream Journal</span>
                                    <p className="text-xs text-zinc-300 italic">"{recovery.dream_log}"</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {tasks.length === 0 && gym.length === 0 && !recovery && (
                    <div className="text-center py-8 text-zinc-500 font-mono text-xs">
                        NO DATA RECORDED FOR THIS DAY
                    </div>
                )}
            </div>
        </Modal>
    );
}
