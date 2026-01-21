'use client';

import { useState } from 'react';
import { toggleGymExercise } from '@/app/gym-action';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function GymChecklist({ exercises, type }) {
    // Optimistic state
    const [localExercises, setLocalExercises] = useState(exercises);

    async function handleToggle(id, currentStatus) {
        // Optimistic update
        setLocalExercises(prev => prev.map(e =>
            e.id === id ? { ...e, isCompleted: !currentStatus } : e
        ));

        try {
            await toggleGymExercise(id, !currentStatus);
        } catch (error) {
            console.error(error);
            // Revert on error
            setLocalExercises(prev => prev.map(e =>
                e.id === id ? { ...e, isCompleted: currentStatus } : e
            ));
        }
    }

    return (
        <div className="space-y-4">
            <AnimatePresence>
                {localExercises.map((ex, index) => (
                    <motion.div
                        key={ex.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleToggle(ex.id, ex.isCompleted)}
                        className={cn(
                            "glass-card group flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-all hover:bg-white/5 active:scale-[0.98] touch-manipulation",
                            ex.isCompleted && "bg-green-500/10 border-green-500/30"
                        )}
                    >
                        <div className="flex items-center gap-4">
                            <div className={cn(
                                "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-all",
                                ex.isCompleted
                                    ? "bg-green-500 border-green-500 text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]"
                                    : "border-white/20 group-hover:border-primary group-hover:shadow-[0_0_10px_rgba(139,92,246,0.3)]"
                            )}>
                                {ex.isCompleted && <Check className="h-4 w-4" />}
                            </div>
                            <div className="flex flex-col">
                                <span className={cn(
                                    "font-medium transition-colors",
                                    ex.isCompleted ? "text-muted-foreground line-through" : "text-white group-hover:text-primary"
                                )}>
                                    {ex.exercise_name}
                                </span>
                                <span className="text-xs text-white/50 font-mono">
                                    {ex.sets_reps}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

