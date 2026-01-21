'use client';

import { motion } from 'framer-motion';
import { Flame, CalendarCheck, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';;

export function StreakStats({ dailyLogs }) {
    // 1. Calculate Streaks
    // We assume data is sorted DESC (newest first)
    // A "Streak" is consecutive days with > 0 EXP or just existing log?
    // Let's say > 0 EXP or just existing log (since creating account creates log). 
    // Ideally > 0 EXP implies activity. 

    // Filter useful logs
    const activeLogs = dailyLogs.filter(l => l.total_exp_gained > 0);

    // Sort just in case
    activeLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Convert to Set of date strings YYYY-MM-DD
    const activeDates = new Set(activeLogs.map(l => new Date(l.date).toISOString().split('T')[0]));

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    // We check backwards from Today (or Yesterday depending on time)
    // Actually, simple algorithm: Check today, if present, current++. Check yesterday, if present, current++.

    // Helper to format date
    const formatDate = (d) => d.toISOString().split('T')[0];

    // Check from Yesterday (Today might be incomplete)
    // But if Today has data, we include it.
    const today = new Date();
    const todayStr = formatDate(today);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);

    // Initial check: is today active?
    let checkDate = today;
    if (!activeDates.has(todayStr) && activeDates.has(yesterdayStr)) {
        // If today not done but yesterday done, streak is alive from yesterday
        checkDate = yesterday;
    } else if (!activeDates.has(todayStr) && !activeDates.has(yesterdayStr)) {
        // Streak broken
        currentStreak = 0;
    }

    // Now count backwards from checkDate
    if (activeDates.size > 0) {
        // Longest Streak Calculation (Iterate all sorted dates)
        // Since activeLogs is sorted DESC, we can iterate and check gaps
        let max = 0;
        let currentRun = 0;
        let prevDate = null;

        // Sort Ascending for simpler calculation
        const sortedAsc = [...activeLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

        if (sortedAsc.length > 0) {
            currentRun = 1;
            max = 1;
            prevDate = new Date(sortedAsc[0].date);

            for (let i = 1; i < sortedAsc.length; i++) {
                const thisDate = new Date(sortedAsc[i].date);
                const diffTime = Math.abs(thisDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    currentRun++;
                } else if (diffDays > 1) {
                    // Gap
                    if (currentRun > max) max = currentRun;
                    currentRun = 1;
                }
                // If diffDays === 0 (same day duplicate?), ignore
                if (diffDays >= 1) prevDate = thisDate;
            }
            if (currentRun > max) max = currentRun;
        }
        longestStreak = max;

        // Current Streak
        // Check if Today or Yesterday is in the set
        let isAlive = activeDates.has(todayStr) || activeDates.has(yesterdayStr);
        if (isAlive) {
            let run = 0;
            let d = new Date();

            // If today is missing, start from yesterday
            if (!activeDates.has(formatDate(d))) {
                d.setDate(d.getDate() - 1);
            }

            while (activeDates.has(formatDate(d))) {
                run++;
                d.setDate(d.getDate() - 1);
            }
            currentStreak = run;
        } else {
            currentStreak = 0;
        }
    }

    return (
        <div className="grid grid-cols-3 gap-4 mb-8">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-orange-500/10 group-hover:text-orange-500/20 transition-colors">
                    <Flame className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <div className="text-orange-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Flame className="w-3 h-3 fill-current" /> Current Streak
                    </div>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                        {currentStreak} <span className="text-sm font-normal text-zinc-500">DAYS</span>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-yellow-500/10 group-hover:text-yellow-500/20 transition-colors">
                    <Trophy className="w-24 h-24" />
                </div>
                <div className="relative z-10">
                    <div className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Trophy className="w-3 h-3 fill-current" /> Best Streak
                    </div>
                    <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                        {longestStreak} <span className="text-sm font-normal text-zinc-500">DAYS</span>
                    </div>
                </div>
            </motion.div>

            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-4 rounded-xl border border-white/10 bg-white/5">
                <div className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1">
                    <CalendarCheck className="w-3 h-3" /> Total Active Days
                </div>
                <div className="text-4xl font-black text-white tabular-nums tracking-tighter">
                    {activeDates.size}
                </div>
            </motion.div>
        </div>
    );
}
