'use client';

import { useState } from 'react';
import { toggleTask, updateTaskProgress } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export function TaskItem({ task }) {
    const [isPending, setIsPending] = useState(false);
    const [completed, setCompleted] = useState(task.completed);

    // Progress State
    const [progress, setProgress] = useState(task.progress || 0);
    const target = task.target || 1;
    const isProgressTask = target > 1;

    async function handleToggle() {
        if (isProgressTask) return; // Prevent toggle on progress tasks

        setIsPending(true);
        const newState = !completed;
        setCompleted(newState);

        if (newState) {
            triggerConfetti();
        }

        const result = await toggleTask(task.id, newState);
        handleLevelUp(result);
        setIsPending(false);
    }

    async function handleProgressUpdate(newVal) {
        if (newVal < 0) newVal = 0;
        if (newVal > target) newVal = target;

        setProgress(newVal);
        setIsPending(true);

        // Check if completing
        if (newVal >= target && !completed) {
            setCompleted(true);
            triggerConfetti();
        } else if (newVal < target && completed) {
            setCompleted(false);
        }

        const result = await updateTaskProgress(task.id, newVal);
        handleLevelUp(result);
        setIsPending(false);
    }

    function triggerConfetti() {
        confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#8b5cf6', '#4f46e5', '#ffffff']
        });
        const audio = new Audio('/tick.mp3');
        audio.volume = 0.5;
        audio.play().catch(() => { });
    }

    function handleLevelUp(result) {
        if (result && result.leveledUp) {
            window.dispatchEvent(new CustomEvent('sys_level_up', { detail: { level: result.newLevel } }));
        }
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "glass-card relative overflow-hidden rounded-xl border p-4 transition-all hover:bg-white/5",
                completed && "border-white/5 bg-black/20"
            )}
        >
            {/* Progress Bar Background */}
            {isProgressTask && !completed && (
                <div
                    className="absolute bottom-0 left-0 h-1 bg-indigo-500/20 w-full"
                >
                    <motion.div
                        className="h-full bg-indigo-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${(progress / target) * 100}%` }}
                    />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {/* Checkbox / Icon */}
                    <button
                        onClick={isProgressTask ? null : (task.isGym ? null : handleToggle)}
                        disabled={isPending || task.isGym || isProgressTask}
                        className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                            completed
                                ? "border-green-500 bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                : "border-white/20 hover:border-primary hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]",
                            (isPending || task.isGym || isProgressTask) && "cursor-default opacity-80"
                        )}
                    >
                        {completed ? <Check className="h-4 w-4" /> : task.isGym && <Lock className="h-3 w-3 text-white/50" />}
                        {isProgressTask && !completed && <span className="text-[8px] font-mono text-white/50">{Math.round((progress / target) * 100)}%</span>}
                    </button>

                    <div className="flex flex-col">
                        <span className={cn(
                            "font-medium tracking-wide transition-colors",
                            completed ? "text-muted-foreground line-through" : "text-white"
                        )}>
                            {task.title}
                        </span>

                        {/* Status Badges */}
                        {task.isGym && !completed && (
                            <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
                                Locked • Complete in Gym
                            </span>
                        )}
                        {!completed && !task.isGym && !isProgressTask && (
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                                Pending
                            </span>
                        )}

                        {/* Progress Controls */}
                        {isProgressTask && !completed && (
                            <div className="mt-2 flex items-center gap-3">
                                <div className="flex items-center gap-1 rounded-md bg-zinc-800 p-0.5 border border-zinc-700">
                                    <button
                                        className="px-2 py-0.5 text-xs hover:bg-zinc-700 rounded text-zinc-400"
                                        onClick={() => handleProgressUpdate(progress - (target > 50 ? 5 : 1))}
                                        disabled={isPending}
                                    >-</button>
                                    <span className="min-w-[40px] text-center font-mono text-xs font-bold text-white">
                                        {progress} <span className="text-zinc-500">/ {target}</span>
                                    </span>
                                    <button
                                        className="px-2 py-0.5 text-xs hover:bg-zinc-700 rounded text-zinc-400"
                                        onClick={() => handleProgressUpdate(progress + (target > 50 ? 5 : 1))}
                                        disabled={isPending}
                                    >+</button>
                                </div>
                                <span className="text-[10px] uppercase tracking-widest text-zinc-500">
                                    {task.unit || 'UNITS'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <span className={cn(
                        "text-xs font-bold font-mono block transition-colors",
                        completed ? "text-muted-foreground" : "text-primary"
                    )}>
                        +{task.exp} EXP
                    </span>
                    <span className="text-[10px] text-white/30 uppercase">Reward</span>
                </div>
            </div>
        </motion.div>
    );
}
