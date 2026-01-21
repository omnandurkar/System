'use client';

import { useState, useEffect } from 'react';

export function CountdownTimer() {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);

            const diff = midnight - now;

            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            // Pad with zeros
            const h = hours < 10 ? `0${hours}` : hours;
            const m = minutes < 10 ? `0${minutes}` : minutes;
            const s = seconds < 10 ? `0${seconds}` : seconds;

            return `${h}:${m}:${s}`;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="mb-6 inline-block rounded border border-border bg-card px-4 py-2 shadow-sm">
            <div className="flex flex-col items-center">
                <span className="text-xs font-bold tracking-widest text-muted-foreground">TIME REMAINING</span>
                <span className="text-2xl font-black tabular-nums tracking-widest text-primary">
                    {timeLeft}
                </span>
            </div>
        </div>
    );
}
