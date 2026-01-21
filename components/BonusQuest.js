'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { addXP } from '@/app/actions';
import confetti from 'canvas-confetti';
import { cn } from '@/lib/utils';

const QUEST_POOL = [
    { title: "Emergency Strength: 20 Pushups", desc: "Drop down and give me 20. Right now.", xp: 100 },
    { title: "Hydration Check", desc: "Drink 500ml of water immediately.", xp: 50 },
    { title: "Posture Correction", desc: "Sit up straight. Hold it for 5 minutes.", xp: 50 },
    { title: "Mental Reset", desc: "Close your eyes and take 10 deep breaths.", xp: 75 },
    { title: "Mobility: Touching Toes", desc: "Stand up and touch your toes. Hold for 30s.", xp: 50 },
    { title: "Vision Check", desc: "Look at something 20 feet away for 20 seconds.", xp: 25 },
    { title: "Plank Challenge", desc: "Hold a plank for 60 seconds.", xp: 120 },
    { title: "Shadow Boxing", desc: "Perform shadow boxing for 1 minute.", xp: 80 },
    { title: "Gratitude Log", desc: "Think of 3 things you are grateful for.", xp: 40 },
    { title: "Cold Splash", desc: "Splash cold water on your face.", xp: 60 }
];

export function BonusQuest() {
    const [quest, setQuest] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Check Local Storage for today's quest status
        const today = new Date().toISOString().split('T')[0];
        const stored = localStorage.getItem('system_daily_bonus');

        let data = stored ? JSON.parse(stored) : null;

        // If no data for today, generate new data
        if (!data || data.date !== today) {
            // Roll the dice: 30% Chance
            const triggered = Math.random() > 0.7;

            if (triggered) {
                const newQuest = QUEST_POOL[Math.floor(Math.random() * QUEST_POOL.length)];
                data = {
                    date: today,
                    quest: newQuest,
                    completed: false
                };
            } else {
                // No quest today
                data = {
                    date: today,
                    quest: null,
                    completed: false
                };
            }
            localStorage.setItem('system_daily_bonus', JSON.stringify(data));
        }

        // Restore state if quest exists
        if (data.quest) {
            setQuest(data.quest);
            setCompleted(data.completed);
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, []);

    const handleToggle = async () => {
        if (!quest || loading) return;
        setLoading(true);

        const newCompleted = !completed;
        setCompleted(newCompleted); // Optimistic Update

        // Update Local Storage immediately
        const today = new Date().toISOString().split('T')[0];
        const data = {
            date: today,
            quest: quest,
            completed: newCompleted
        };
        localStorage.setItem('system_daily_bonus', JSON.stringify(data));

        try {
            if (newCompleted) {
                // Complete: Add XP & Confetti
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#60a5fa', '#3b82f6', '#ffffff']
                });

                const result = await addXP(quest.xp);
                if (result && result.leveledUp) {
                    window.dispatchEvent(new CustomEvent('system-levelup', { detail: { level: result.newLevel } }));
                }
            } else {
                // Uncomplete: Remove XP
                await addXP(-quest.xp);
            }
        } catch (error) {
            console.error("Failed to update XP", error);
            // Revert on error
            setCompleted(!newCompleted);
        } finally {
            setLoading(false);
            if (newCompleted) {
                setTimeout(() => setIsVisible(false), 5000); // 5 sec delay to hide if completed
            }
        }
    };

    if (!isVisible || !quest) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0, transition: { duration: 0.5 } }}
                className="mb-8 overflow-hidden px-1"
            >
                <div className={cn(
                    "relative overflow-hidden rounded-xl border-2 p-6 transition-all duration-500",
                    completed
                        ? "border-green-500 bg-green-500/10 shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                        : "border-blue-500 bg-zinc-950/80 shadow-[0_0_30px_rgba(59,130,246,0.25)] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                )}>
                    {/* Glowing pulse effect (Background) */}
                    {!completed && (
                        <div className="absolute inset-0 animate-pulse bg-blue-500/5 pointer-events-none mix-blend-overlay" />
                    )}

                    {/* Scanline Effect */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 pointer-events-none opacity-20 bg-size-[100%_2px,3px_100%]" />

                    <div className="flex items-center justify-between gap-6 relative z-10">
                        <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 text-blue-400 mb-2">
                                <Zap className="h-4 w-4 animate-bounce text-yellow-400" />
                                <span className={cn(
                                    "text-xs font-black uppercase tracking-[0.2em] drop-shadow-md transition-colors",
                                    completed ? "text-green-400" : "text-blue-300 animate-pulse"
                                )}>
                                    {completed ? "QUEST COMPLETE" : "SYSTEM EVENT DETECTED"}
                                </span>
                            </div>
                            <h3 className={cn(
                                "font-black text-xl md:text-2xl tracking-tight uppercase italic transition-all duration-300",
                                completed ? "text-green-400 line-through decoration-4 decoration-green-500/50 opacity-50" : "text-white drop-shadow-md"
                            )}>
                                {quest.title}
                            </h3>
                            <p className="text-sm md:text-base text-blue-200/70 font-mono border-l-2 border-blue-500/30 pl-3">
                                {quest.desc}
                            </p>
                        </div>

                        <button
                            onClick={handleToggle}
                            disabled={loading}
                            className={cn(
                                "flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 active:scale-95 group relative overflow-hidden",
                                completed
                                    ? "border-green-500 bg-green-500/20 text-green-400 hover:bg-green-500 hover:text-black shadow-[0_0_20px_rgba(34,197,94,0.6)]"
                                    : "border-blue-400 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white hover:shadow-[0_0_20px_rgba(59,130,246,0.6)]"
                            )}
                        >
                            {completed ?
                                <Check className="h-8 w-8" /> :
                                <div className="flex flex-col items-center z-10">
                                    <span className="text-[10px] font-bold opacity-80">RWD</span>
                                    <span className="text-sm font-black">{quest.xp}</span>
                                    <span className="text-[9px] font-bold opacity-80">XP</span>
                                </div>
                            }
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
