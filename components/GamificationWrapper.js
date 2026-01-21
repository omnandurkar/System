'use client';

import { useEffect, useState } from 'react';
import { LevelUpOverlay } from '@/components/LevelUpOverlay';

export function GamificationWrapper() {
    const [newLevel, setNewLevel] = useState(null);

    useEffect(() => {
        function handleLevelUp(e) {
            setNewLevel(e.detail.level);
        }

        window.addEventListener('system-levelup', handleLevelUp);
        return () => window.removeEventListener('system-levelup', handleLevelUp);
    }, []);

    if (!newLevel) return null;

    return <LevelUpOverlay newLevel={newLevel} onClose={() => setNewLevel(null)} />;
}
