'use client';

import { getRank } from '@/lib/rank';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function RankBadge({ level }) {
    const rankInfo = getRank(level);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
            whileHover={{ scale: 1.05 }}
            className={cn(
                "group relative flex items-center p-4 gap-4 overflow-hidden rounded-md border px-6 py-2 transition-all duration-500",
                "bg-black/40 backdrop-blur-md", // Glassmorphism base
                rankInfo.border,
                rankInfo.glow, // Outer glow
                "hover:bg-black/60 cursor-default"
            )}
        >
            {/* Glossy Reflection (Top) */}
            <div className="absolute inset-x-0 top-0 h-[1px] bg-[linear-gradient(to-r,transparent,white/20,transparent)] opacity-50" />

            {/* Rank Icon Container (Diamond) */}
            <div className="relative flex items-center justify-center">
                {/* Rotating Background Ring */}
                <div className={cn(
                    "absolute h-12 w-12 opacity-30 animate-[spin_10s_linear_infinite]",
                    rankInfo.color // Uses text color for border
                )} />

                {/* The Letter Badge */}
                <div className={cn(
                    "relative z-10 flex h-10 w-10 p-2 items-center justify-center rounded-lg border bg-black shadow-[0_0_20px_currentColor]",
                    rankInfo.border,
                    rankInfo.color,
                    "border-2 transform rotate-45 group-hover:rotate-0 transition-transform duration-500" // Interactive rotation
                )}>
                    {/* Counter-rotate text so it's upright */}
                    <span className="transform -rotate-45 group-hover:rotate-0 transition-transform duration-500 font-black text-2xl">
                        {rankInfo.rank}
                    </span>
                </div>
            </div>

            {/* Text Information */}
            <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                    <span className={cn(
                        "h-1.5 w-1.5 rounded-full animate-pulse",
                        rankInfo.bg.replace('/10', '') // Hack to get solid color from bg class (e.g. bg-red-600/10 -> bg-red-600) roughly, or better use text color class
                            .replace('text-', 'bg-') // Swapping text class for bg class is safer if structured right. 
                        // Actually, let's just use the 'bg-current' with text color context
                        , "bg-current", rankInfo.color
                    )} />
                    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-mono font-bold leading-none">
                        Hunter Rank
                    </span>
                </div>

                <span className={cn(
                    "text-xl font-black tracking-tighter uppercase leading-none mt-1 drop-shadow-md",
                    "text-transparent bg-clip-text bg-linear-to-r from-white via-white to-zinc-500", // Metallic gradient text
                )}>
                    {rankInfo.title.replace('Hunter', '')} {/* Just "E-RANK" looks cleaner */}
                    <span className={cn("text-sm ml-1", rankInfo.color)}>Class</span>
                </span>
            </div>

            {/* Background Gradient Splash */}
            <div className={cn(
                "absolute -right-4 top-1/2 -translate-y-1/2 h-24 w-24 rounded-full blur-2xl opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity duration-500",
                rankInfo.bg.replace('/10', '/30') // Boost opacity for the splash
            )} />
        </motion.div>
    );
}
