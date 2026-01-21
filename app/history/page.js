'use client';

import { useEffect, useState } from 'react';
import { getHistoryData } from '@/app/history-actions';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format } from 'date-fns';
import { Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import { StreakStats } from '@/components/StreakStats';
import { HistoryCalendar } from '@/components/HistoryCalendar';

export default function HistoryPage() {
    const [data, setData] = useState({ dailyLogs: [], recoveryLogs: [], tasks: [], gymLogs: [] });
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const res = await getHistoryData();
            setData(res);

            // Merge Data by Date for Charts
            const merged = {};

            // Process Daily Logs (EXP)
            res.dailyLogs.forEach(log => {
                const date = new Date(log.date).toISOString().split('T')[0];
                if (!merged[date]) merged[date] = { date };
                merged[date].exp = log.total_exp_gained || 0;
            });

            // Process Recovery Logs (Sleep, Score)
            res.recoveryLogs.forEach(log => {
                const date = new Date(log.log_date).toISOString().split('T')[0];
                if (!merged[date]) merged[date] = { date };
                merged[date].sleep = parseFloat(log.sleep_hours) || 0;
                merged[date].recovery = log.recovery_score || 0;
            });

            // Sort and convert to array for Chart
            const cData = Object.values(merged)
                .sort((a, b) => new Date(a.date) - new Date(b.date))
                .slice(-30) // Keep charts to last 30 days
                .map(d => ({
                    ...d,
                    displayDate: format(new Date(d.date), 'MMM dd')
                }));

            setChartData(cData);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return (
        <div className="flex h-screen w-full items-center justify-center">
            <div className="animate-pulse text-xl font-mono text-zinc-500">LOADING ARCHIVES...</div>
        </div>
    );

    return (
        <div className="mx-auto max-w-6xl space-y-8 p-4 pb-20">
            {/* Header */}
            <div className="space-y-2 border-b border-zinc-800 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white font-mono uppercase flex items-center gap-3">
                    <Archive className="h-8 w-8 text-indigo-500" />
                    System Archives
                </h1>
                <p className="text-zinc-500">Full operational history and performance analysis.</p>
            </div>

            {/* 1. Streak Stats */}
            <StreakStats dailyLogs={data.dailyLogs} />

            {/* 2. Calendar View */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold font-mono text-white">Monthly Log</h2>
                <HistoryCalendar
                    dailyLogs={data.dailyLogs}
                    tasks={data.tasks}
                    gymLogs={data.gymLogs}
                    recoveryLogs={data.recoveryLogs}
                />
            </div>

            {/* 3. Analytics Charts */}
            <div className="space-y-4 pt-8">
                <h2 className="text-xl font-bold font-mono text-white">Biometric Analysis</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Sleep Analysis */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 rounded-xl border border-white/5">
                        <h3 className="mb-4 font-bold text-lg flex items-center gap-2">
                            <span className="text-indigo-400">Sleep Cycles (Last 30 Days)</span>
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                    <XAxis dataKey="displayDate" stroke="#555" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#555" fontSize={12} tickLine={false} domain={[0, 12]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="sleep" stroke="#818cf8" strokeWidth={2} dot={{ r: 3, fill: '#818cf8' }} name="Hours" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Recovery Score */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 rounded-xl border border-white/5">
                        <h3 className="mb-4 font-bold text-lg flex items-center gap-2">
                            <span className="text-emerald-400">Recovery Score</span>
                        </h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                    <XAxis dataKey="displayDate" stroke="#555" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#555" fontSize={12} tickLine={false} domain={[0, 100]} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Bar dataKey="recovery" fill="#34d399" radius={[4, 4, 0, 0]} name="Score" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
