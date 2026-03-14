'use client';
import { useState, useEffect } from 'react';

const LINES = [
    { text: '> INITIALIZING FINANCIAL INTELLIGENCE ENGINE...', delay: 0 },
    { text: '> DECRYPTING ASSET DATABASE...', delay: 400 },
    { text: '> LOADING PORTFOLIO ANALYTICS...', delay: 800 },
    { text: '> CALIBRATING PURCHASE ADVISOR...', delay: 1200 },
    { text: '[SYSTEM]: CLASSIFIED ACCESS GRANTED.', delay: 1600, highlight: true },
];

// Feature #2 — Particle burst
function Particles() {
    const particles = Array.from({ length: 24 });
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {particles.map((_, i) => {
                const angle = (i / particles.length) * 360;
                const distance = 80 + Math.random() * 60;
                const size = 2 + Math.random() * 3;
                const duration = 600 + Math.random() * 400;
                return (
                    <div
                        key={i}
                        className="absolute left-1/2 top-1/2 rounded-full bg-yellow-400"
                        style={{
                            width: size, height: size,
                            transform: `translate(-50%, -50%)`,
                            animation: `particle-burst ${duration}ms ease-out forwards`,
                            '--angle': `${angle}deg`,
                            '--distance': `${distance}px`,
                            opacity: 0,
                        }}
                    />
                );
            })}
            <style>{`
                @keyframes particle-burst {
                    0% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(0); opacity: 1; }
                    100% { transform: translate(-50%, -50%) rotate(var(--angle)) translateX(var(--distance)); opacity: 0; }
                }
            `}</style>
        </div>
    );
}

// Feature #1 — Cinematic entry
export default function FinanceCinematic({ onComplete }) {
    const [visibleLines, setVisibleLines] = useState([]);
    const [charIndex, setCharIndex] = useState(0);
    const [currentLine, setCurrentLine] = useState(0);
    const [done, setDone] = useState(false);
    const [fadeOut, setFadeOut] = useState(false);
    const [showParticles, setShowParticles] = useState(true);

    useEffect(() => {
        // Hide particles after 700ms
        const t = setTimeout(() => setShowParticles(false), 700);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (currentLine >= LINES.length) {
            setTimeout(() => setFadeOut(true), 600);
            setTimeout(() => onComplete(), 1000);
            return;
        }
        const line = LINES[currentLine];
        const startDelay = setTimeout(() => {
            const txt = line.text;
            let ci = 0;
            const interval = setInterval(() => {
                ci++;
                setCharIndex(ci);
                if (ci >= txt.length) {
                    clearInterval(interval);
                    setTimeout(() => {
                        setVisibleLines(prev => [...prev, line]);
                        setCurrentLine(c => c + 1);
                        setCharIndex(0);
                    }, 100);
                }
            }, 18);
            return () => clearInterval(interval);
        }, currentLine === 0 ? 0 : 50);
        return () => clearTimeout(startDelay);
    }, [currentLine]);

    const currentText = currentLine < LINES.length ? LINES[currentLine].text.slice(0, charIndex) : '';

    return (
        <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950 transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
            {showParticles && <Particles />}
            <div className="w-full max-w-lg px-6 space-y-2">
                <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest mb-4">// SYSTEM FINANCIAL MODULE v2.0</p>
                {visibleLines.map((line, i) => (
                    <p key={i} className={`text-sm font-mono ${line.highlight ? 'text-yellow-400 font-bold' : 'text-green-400'}`}>
                        {line.text}
                    </p>
                ))}
                {currentLine < LINES.length && (
                    <p className="text-sm font-mono text-green-400">
                        {currentText}<span className="animate-pulse">█</span>
                    </p>
                )}
            </div>
        </div>
    );
}
