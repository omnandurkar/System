'use client';

import { useState } from 'react';
import { toggleTask } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Check, Lock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export function TaskItem({ task }) {
    const [isPending, setIsPending] = useState(false);
    const [completed, setCompleted] = useState(task.completed);

    async function handleToggle() {
        setIsPending(true);
        const newState = !completed;
        setCompleted(newState);

        if (newState) {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#8b5cf6', '#4f46e5', '#ffffff'] // Premium Purple/Blue/White confetti
            });
            const audio = new Audio('/tick.mp3');
            audio.volume = 0.5;
            audio.play().catch(() => { });
        }

        const result = await toggleTask(task.id, newState);

        if (result && result.leveledUp) {
            window.dispatchEvent(new CustomEvent('system-levelup', { detail: { level: result.newLevel } }));
        }

        setIsPending(false);
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
                "glass-card flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-white/5",
                completed && "border-white/5 bg-black/20"
            )}
        >
            <div className="flex items-center gap-4">
                <button
                    onClick={task.isGym ? null : handleToggle}
                    disabled={isPending || task.isGym}
                    className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all",
                        completed
                            ? "border-green-500 bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                            : "border-white/20 hover:border-primary hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]",
                        (isPending || task.isGym) && "cursor-not-allowed opacity-50"
                    )}
                >
                    {completed ? <Check className="h-4 w-4" /> : task.isGym && <Lock className="h-3 w-3 text-white/50" />}
                </button>
                <div className="flex flex-col">
                    <span className={cn(
                        "font-medium tracking-wide transition-colors",
                        completed ? "text-muted-foreground line-through" : "text-white"
                    )}>
                        {task.title}
                    </span>
                    {task.isGym && !completed && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary animate-pulse">
                            Locked • Complete in Gym
                        </span>
                    )}
                    {!completed && !task.isGym && (
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                            Pending
                        </span>
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
        </motion.div>
    );
}
