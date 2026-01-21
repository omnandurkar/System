'use client';

import { useState, useEffect } from 'react';
import { DungeonBreakOverlay } from './DungeonBreakOverlay';
import { DungeonBreakWidget } from './DungeonBreakWidget';

export function DungeonBreakClientWrapper({ initialBreak }) {
    const [dungeonBreak, setDungeonBreak] = useState(initialBreak);
    const [accepted, setAccepted] = useState(false);

    useEffect(() => {
        setDungeonBreak(initialBreak);
    }, [initialBreak]);

    if (!dungeonBreak) return null;

    return (
        <>
            {!accepted && (
                <DungeonBreakOverlay
                    dungeonBreak={dungeonBreak}
                    onAccept={() => setAccepted(true)}
                />
            )}

            {accepted && (
                <DungeonBreakWidget
                    dungeonBreak={dungeonBreak}
                    onComplete={() => setDungeonBreak(null)}
                />
            )}
        </>
    );
}
