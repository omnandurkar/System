'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, addMonths, subMonths, isSameMonth, isSameDay } from 'date-fns';
import { DayDetailDialog } from '@/components/DayDetailDialog';

export function HistoryCalendar({ dailyLogs, tasks, gymLogs, recoveryLogs }) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // Helpers
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    // Generate Calendar Grid
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    // Force start on Sunday
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

    // Prepare Data Map
    const dataMap = {};

    // 1. EXP from Daily Logs
    dailyLogs.forEach(l => {
        const d = format(new Date(l.date), 'yyyy-MM-dd');
        if (!dataMap[d]) dataMap[d] = { exp: 0, tasks: [], gym: [], recovery: null };
        dataMap[d].exp = l.total_exp_gained || 0;
    });

    // 2. Tasks
    tasks.forEach(t => {
        // Warning: tasks prop usually is task_completions based on logic, checking 't.date' existence
        if (t.date || t.completed_at) {
            const d = format(new Date(t.date || t.completed_at), 'yyyy-MM-dd');
            if (!dataMap[d]) dataMap[d] = { exp: 0, tasks: [], gym: [], recovery: null };
            dataMap[d].tasks.push(t);
        }
    });

    // 3. Gym
    gymLogs.forEach(g => {
        const d = format(new Date(g.log_date), 'yyyy-MM-dd');
        if (!dataMap[d]) dataMap[d] = { exp: 0, tasks: [], gym: [], recovery: null };
        dataMap[d].gym.push(g);
    });

    // 4. Recovery
    recoveryLogs.forEach(r => {
        const d = format(new Date(r.log_date), 'yyyy-MM-dd');
        if (!dataMap[d]) dataMap[d] = { exp: 0, tasks: [], gym: [], recovery: null };
        dataMap[d].recovery = r;
    });

    const handleDayClick = (date) => {
        const d = format(date, 'yyyy-MM-dd');
        setSelectedDate(d);
        if (dataMap[d]) {
            setIsDialogOpen(true);
        }
    };

    return (
        <>
            {/* Main Container - max-w-4xl for a comfortable size, centered */}
            <div className="w-full max-w-4xl mx-auto border border-zinc-800 rounded-xl overflow-hidden bg-black shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
                    <h3 className="font-bold text-lg text-white tracking-widest font-mono uppercase">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h3>

                    <div className="flex gap-1">
                        <button
                            onClick={prevMonth}
                            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Grid Header */}
                <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-950/50">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                        <div key={day} className="py-3 text-center text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Grid Body */}
                {/* Fixed Aspects: grid-cols-7 is strict. border-l and border-t ensure consistent internal borders */}
                <div className="grid grid-cols-7 bg-zinc-950 border-l border-t border-zinc-800">
                    {calendarDays.map((day, idx) => {
                        const dateKey = format(day, 'yyyy-MM-dd');
                        const dayData = dataMap[dateKey];
                        const hasData = !!dayData;
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={idx}
                                onClick={() => dayData && handleDayClick(day)}
                                className={cn(
                                    // Base Layout: Aspect Ratio Square ensures boxy shape. Relative positioning.
                                    "aspect-square relative border-r border-b border-zinc-800 transition-all",
                                    // Flex alignment for content
                                    "flex flex-col items-start justify-start p-2",
                                    // Colors and Interactions
                                    !isCurrentMonth && "bg-black/80 text-zinc-800",
                                    isCurrentMonth && "bg-zinc-950 text-zinc-400",
                                    hasData && isCurrentMonth && "hover:bg-zinc-900 cursor-pointer group",
                                    isToday && "bg-indigo-950/20 z-10 ring-1 ring-inset ring-indigo-500/30"
                                )}
                            >
                                {/* Date Number - Always top left */}
                                <span className={cn(
                                    "text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full transition-colors mb-auto",
                                    isToday && "bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20",
                                    hasData && !isToday && "text-zinc-300 group-hover:text-white"
                                )}>
                                    {format(day, 'd')}
                                </span>

                                {/* Indicators Container - Bottom of the cell */}
                                {hasData && (
                                    <div className="flex gap-1.5 self-center mt-2 pb-1">
                                        {/* EXP Dot */}
                                        {dayData.exp > 0 && (
                                            <div title={`EXP: +${dayData.exp}`} className="h-1.5 w-1.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(234,179,8,0.6)]" />
                                        )}

                                        {/* Gym Dot */}
                                        {dayData.gym.length > 0 && (
                                            <div title="Gym Workout" className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                                        )}

                                        {/* Recovery Dot */}
                                        {dayData.recovery && (
                                            <div
                                                title={`Recovery Score: ${dayData.recovery.recovery_score}%`}
                                                className={cn(
                                                    "h-1.5 w-1.5 rounded-full shadow-md",
                                                    dayData.recovery.recovery_score >= 80 ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" : "bg-orange-500"
                                                )}
                                            />
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <DayDetailDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                date={selectedDate}
                data={selectedDate ? dataMap[selectedDate] : null}
            />
        </>
    );
}
