'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getHistoryData() {
    const session = await getSession();
    if (!session) return { dailyLogs: [], recoveryLogs: [], tasks: [], gymLogs: [] };

    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const allDailyLogs = await prisma.dailyLog.findMany({
            where: { userId: session.userId },
            orderBy: { date: 'desc' },
            select: { id: true, date: true, totalExpGained: true }
        });

        const recoveryLogs = await prisma.recoveryLog.findMany({
            where: { userId: session.userId },
            orderBy: { logDate: 'desc' },
            take: 90
        });

        const taskCompletions = await prisma.taskCompletion.findMany({
            where: {
                dailyLog: {
                    userId: session.userId,
                    date: { gt: ninetyDaysAgo }
                }
            },
            include: {
                dailyLog: { select: { date: true } },
                task: { select: { title: true, expValue: true } }
            },
            orderBy: [{ dailyLog: { date: 'desc' } }, { taskId: 'asc' }]
        });

        const gymLogs = await prisma.gymLog.findMany({
            where: {
                userId: session.userId,
                completed: true,
                logDate: { gt: ninetyDaysAgo }
            },
            include: {
                exercise: { select: { exerciseName: true, setsReps: true, category: true } }
            },
            orderBy: { logDate: 'desc' }
        });

        // Map Prisma output to match the expected format from raw SQL
        const formattedDailyLogs = allDailyLogs.map(dl => ({
            id: dl.id, date: dl.date, total_exp_gained: dl.totalExpGained
        }));

        const formattedRecoveryLogs = recoveryLogs.map(rl => ({
            ...rl, log_date: rl.logDate, sleep_hours: rl.sleepHours, recovery_score: rl.recoveryScore
        }));

        const formattedTasks = taskCompletions.map(tc => ({
            id: tc.id, daily_log_id: tc.dailyLogId, date: tc.dailyLog.date,
            title: tc.task.title, exp_value: tc.task.expValue
        }));

        const formattedGymLogs = gymLogs.map(gl => ({
            id: gl.id, log_date: gl.logDate,
            exercise_name: gl.exercise.exerciseName, sets_reps: gl.exercise.setsReps, category: gl.exercise.category
        }));

        return {
            dailyLogs: formattedDailyLogs,
            recoveryLogs: formattedRecoveryLogs,
            tasks: formattedTasks,
            gymLogs: formattedGymLogs
        };
    } catch (e) {
        console.error(e);
        return { dailyLogs: [], recoveryLogs: [], tasks: [], gymLogs: [] };
    }
}

export async function getSystemLogs() {
    const session = await getSession();
    if (!session) return [];

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.userId },
            select: { username: true }
        });
        const username = user?.username || 'ADMIN';

        // 1. Tasks
        const tasks = await prisma.taskCompletion.findMany({
            where: { dailyLog: { userId: session.userId }, completedAt: { not: null } },
            include: { task: true },
            orderBy: { completedAt: 'desc' },
            take: 100
        });

        const taskLogs = tasks.map(tc => ({
            timestamp: tc.completedAt,
            type: 'TASK',
            message: `Player [${username}] completed [${tc.task.title}]. Reward: ${tc.task.expValue} XP.`
        }));

        // 2. Dungeon Breaks
        const dungeons = await prisma.dungeonBreak.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        const dungeonLogs = dungeons.map(db => ({
            timestamp: db.createdAt,
            type: 'DUNGEON',
            message: `Player [${username}] encountered [${db.description}]. Status: ${db.status}.`
        }));

        // 3. Gym
        const gyms = await prisma.gymLog.findMany({
            where: { userId: session.userId, completed: true },
            include: { exercise: true },
            orderBy: { logDate: 'desc' },
            take: 100
        });

        const gymLogs = gyms.map(gl => {
            const date = new Date(gl.logDate);
            date.setHours(0, 0, 0, 0);
            return {
                timestamp: date,
                type: 'GYM',
                message: `Player [${username}] performed [${gl.exercise.exerciseName}] - ${gl.exercise.setsReps}`
            }
        });

        // 4. Titles
        const titles = await prisma.userTitle.findMany({
            where: { userId: session.userId },
            orderBy: { unlockedAt: 'desc' },
            take: 100
        });

        const titleLogs = titles.map(t => ({
            timestamp: t.unlockedAt,
            type: 'ACHIEVEMENT',
            message: `Player [${username}] unlocked title [${t.titleId}].`
        }));

        // Combine and sort
        const combined = [...taskLogs, ...dungeonLogs, ...gymLogs, ...titleLogs]
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 100);

        return combined;
    } catch (e) {
        console.error(e);
        return [];
    }
}
