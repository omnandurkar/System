'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function AuraEffects({ streak, bestStreak }) {
    const [showLossFlame, setShowLossFlame] = useState(false);

    // Effect for 3-Day Streak (Blue Aura on Cards)
    useEffect(() => {
        if (streak >= 3) {
            document.body.classList.add('streak-active-3');
        } else {
            document.body.classList.remove('streak-active-3');
        }
    }, [streak]);

    // Loss Logic: Best Streak was high (30+) but current is 0
    useEffect(() => {
        if (streak === 0 && bestStreak >= 30) {
            setShowLossFlame(true);
            const timer = setTimeout(() => setShowLossFlame(false), 4000); // Burn for 4s then extinguish
            return () => clearTimeout(timer);
        }
    }, [streak, bestStreak]);

    // 30-Day Shadow Monarch Mode
    const isShadowMonarch = streak >= 30;

    return (
        <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden">
            <AnimatePresence>
                {(isShadowMonarch || showLossFlame) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isShadowMonarch ? 1 : [0, 1, 1, 0] }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                        className="absolute inset-0 flame-bg"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
