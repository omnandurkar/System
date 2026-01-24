'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Check } from 'lucide-react';
import { equipTitle } from '@/app/actions';
import { cn } from '@/lib/utils';

const TITLES = [
    { id: 'The Early Bird', name: 'The Early Bird', desc: 'Wake up before 6 AM (7 times)', buff: '+5% XP' },
    { id: 'Iron Body', name: 'Iron Body', desc: 'Complete 50 Gym/Workout tasks', buff: 'Flex Status (+Honor)' }, // Simplified buff description
    { id: 'Scholar', name: 'Scholar', desc: 'Complete 20 Reading/Study tasks', buff: '+5% Gold' },
];

export function TitleSelector({ userTitles, currentTitle }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const unlockedSet = new Set(userTitles.map(t => t.title_id));

    const handleEquip = async (titleId) => {
        setIsLoading(true);
        await equipTitle(titleId === currentTitle ? null : titleId); // Toggle off if same
        setIsLoading(false);
        // setIsOpen(false); // Opt: Keep open to see effect
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="text-xs font-mono text-zinc-500 hover:text-zinc-300 underline underline-offset-4"
            >
                [TITLES]
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Trophy className="h-5 w-5 text-yellow-500" />
                                    <span>Achievement Titles</span>
                                </h2>
                                <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white">✕</button>
                            </div>

                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                                {TITLES.map((title) => {
                                    const isUnlocked = unlockedSet.has(title.id);
                                    const isEquipped = currentTitle === title.id;

                                    return (
                                        <div
                                            key={title.id}
                                            className={cn(
                                                "relative p-4 rounded-lg border transition-all duration-200",
                                                isEquipped ? "bg-blue-900/20 border-blue-500/50" : "bg-black border-zinc-800",
                                                !isUnlocked && "opacity-50 grayscale"
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className={cn("font-bold", isUnlocked ? "text-white" : "text-zinc-500")}>
                                                        {title.name}
                                                    </h3>
                                                    <p className="text-xs text-zinc-400">{title.desc}</p>
                                                </div>
                                                {isEquipped && <Check className="h-5 w-5 text-blue-400" />}
                                                {!isUnlocked && <Lock className="h-4 w-4 text-zinc-600" />}
                                            </div>

                                            <div className="flex justify-between items-center mt-3">
                                                <span className="text-xs font-mono text-green-400">{title.buff}</span>
                                                {isUnlocked && (
                                                    <button
                                                        onClick={() => handleEquip(title.id)}
                                                        disabled={isLoading}
                                                        className={cn(
                                                            "text-xs px-3 py-1 rounded border transition-colors",
                                                            isEquipped
                                                                ? "border-blue-500 text-blue-400 hover:bg-blue-950"
                                                                : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                                                        )}
                                                    >
                                                        {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
