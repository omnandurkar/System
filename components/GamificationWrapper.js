'use client';

import { useEffect, useState } from 'react';
import { LevelUpOverlay } from '@/components/LevelUpOverlay';
import { DailyCompletionOverlay } from '@/components/DailyCompletionOverlay';

export function GamificationWrapper({ totalTasks = 0, completedTasks = 0 }) {
    const [newLevel, setNewLevel] = useState(null);
    const [showDailyComplete, setShowDailyComplete] = useState(false);

    // Track previous completion to detect the moment of crossing 100%
    const [prevCompleted, setPrevCompleted] = useState(completedTasks);

    useEffect(() => {
        function handleLevelUp(e) {
            setNewLevel(e.detail.level);
        }

        window.addEventListener('system-levelup', handleLevelUp);
        return () => window.removeEventListener('system-levelup', handleLevelUp);
    }, []);

    // Check for Daily Completion (Transition from <100% to 100%)
    useEffect(() => {
        // Only trigger if we actually have tasks and just finished them
        if (totalTasks > 0 && completedTasks === totalTasks && prevCompleted < totalTasks) {
            setShowDailyComplete(true);
        }
        setPrevCompleted(completedTasks);
    }, [completedTasks, totalTasks]);

    return (
        <>
            {newLevel && <LevelUpOverlay newLevel={newLevel} onClose={() => setNewLevel(null)} />}
            {showDailyComplete && <DailyCompletionOverlay onClose={() => setShowDailyComplete(false)} />}
        </>
    );
}
