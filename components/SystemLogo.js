'use client';

import { cn } from '@/lib/utils';

export function SystemLogo({ className, size = 32, glow = true }) {
    return (
        <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
            {/* Pulsing Hexaglobal Aura */}
            {glow && (
                <div className="absolute inset-0 bg-blue-500/20 blur-md rounded-full animate-pulse pointer-events-none" />
            )}

            <svg
                viewBox="0 0 100 100"
                className="relative z-10 w-full h-full drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Outer Hexagon Frame */}
                <path
                    d="M50 5 L90 25 V75 L50 95 L10 75 V25 L50 5Z"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-blue-500/40"
                    strokeLinejoin="round"
                />

                {/* Inner Hexagon Frame */}
                <path
                    d="M50 12 L84 29 V71 L50 88 L16 71 V29 L50 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-white/20"
                    strokeLinejoin="round"
                />

                {/* Stylized 'S' Badge */}
                <path
                    d="M65 35 H45 C40 35 35 38 35 43 C35 48 40 50 45 50 H55 C60 50 65 52 65 57 C65 62 60 65 55 65 H35"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-blue-400"
                />

                {/* Tactical Accent Dots */}
                <circle cx="50" cy="15" r="2" fill="currentColor" className="text-blue-500" />
                <circle cx="50" cy="85" r="2" fill="currentColor" className="text-blue-500" />
            </svg>

            {/* Scanline Animation Overlay */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-linear-to-b from-blue-400/0 via-blue-400/30 to-blue-400/0 animate-[scan_3s_linear_infinite]" />
            </div>

            <style jsx>{`
                @keyframes scan {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(200%); }
                }
            `}</style>
        </div>

    );
}

export function SystemTitle({ className }) {
    return (
        <div className={cn("flex flex-col", className)}>
            <div className="flex items-center gap-2">
            </div>
            <h1 className="text-lg font-black tracking-[0.4em] font-mono leading-none bg-linear-to-r from-white via-blue-100 to-zinc-500 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                SYSTEM
            </h1>
        </div>
    );
}
