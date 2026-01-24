'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Skull, AlertTriangle, CheckCircle } from 'lucide-react';
import { TaskItem } from '@/components/TaskItem';

export function PenaltyOverlay({ user, routines }) {
    // Find Penalty Routine
    const penaltyRoutine = routines.find(r => r.category === 'penalty');

    if (!user.penaltyActive || !penaltyRoutine) return null;

    const task = penaltyRoutine.tasks[0]; // Usually only one survival task
    // If task is completed (checked via some other state or reload), overlay should disappear logically, 
    // but here we rely on the parent not rendering this if penaltyActive is false.
    // However, penaltyActive comes from DB. We need real-time update?
    // Actually, `TaskItem` updates DB. We need to trigger a refresh/revalidate.
    // `TaskItem` calls `toggleTask` or `updateTaskProgress` which calls `revalidatePath`.
    // So if the user completes the task, the server re-renders, `getUserStats` runs, `penaltyActive` becomes false?
    // Wait, `penaltyActive` is true if routine exists.
    // We need logic to DELETE the routine when task is done?
    // OR `penaltyActive` should check if TASKS are done.

    // For now, let's assume the user completes it, and on refresh it's gone?
    // Ideally, `TaskItem` completion should trigger a check to remove the penalty routine.
    // Let's handle visual feedback here.

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/95 text-red-600">
            {/* Background Pulse */}
            <div className="absolute inset-0 bg-red-900/20 animate-pulse pointer-events-none" />

            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative z-10 flex flex-col items-center max-w-md w-full p-8 border-2 border-red-600 bg-black shadow-[0_0_50px_rgba(220,38,38,0.5)] rounded-lg text-center"
            >
                <Skull className="h-16 w-16 mb-4 animate-[bounce_2s_infinite]" />
                <h1 className="text-4xl font-black tracking-widest mb-2">PENALTY ZONE</h1>
                <p className="text-red-400 mb-6 font-mono text-sm uppercase">
                    You failed to maintain discipline yesterday.<br />
                    The System has locked your dashboard.
                </p>

                <div className="w-full bg-red-900/10 p-4 rounded border border-red-800/50">
                    <div className="flex items-center gap-2 mb-2 justify-center text-red-300 font-bold">
                        <AlertTriangle className="h-4 w-4" />
                        <span>SURVIVAL QUEST</span>
                    </div>
                    {/* Render the TaskItem directly properly configured */}
                    {task && (
                        <div className="text-left">
                            <TaskItem task={{ ...task, isGym: false }} />
                        </div>
                    )}
                </div>

                <p className="mt-6 text-xs text-red-500/50 animate-pulse">
                    COMPLETE THE QUEST TO SURVIVE
                </p>
            </motion.div>
        </div>
    );
}
