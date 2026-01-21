'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getUserStats() {
    const session = await getSession();
    if (!session) return null;

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users WHERE id = $1', [session.userId]);
        return res.rows[0];
    } finally {
        client.release();
    }
}

export async function getTodayTasks() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        const today = new Date().toISOString().split('T')[0];
        let logRes = await client.query('SELECT * FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);

        if (logRes.rows.length === 0) {
            logRes = await client.query('INSERT INTO daily_logs (user_id, date) VALUES ($1, $2) RETURNING *', [session.userId, today]);
        }
        const logId = logRes.rows[0].id;

        const routinesRes = await client.query(`
      SELECT r.id as routine_id, r.name as routine_name, r.start_time, r.end_time, r.category,
             t.id as task_id, t.title, t.exp_value,
             tc.id as completion_id
      FROM routines r
      JOIN tasks t ON t.routine_id = r.id
      LEFT JOIN task_completions tc ON tc.task_id = t.id AND tc.daily_log_id = $1
      WHERE r.user_id = $2
      ORDER BY r.start_time, t.id
    `, [logId, session.userId]);

        const routines = {};
        routinesRes.rows.forEach(row => {
            if (!routines[row.routine_id]) {
                routines[row.routine_id] = {
                    id: row.routine_id,
                    name: row.routine_name,
                    time: `${row.start_time} - ${row.end_time}`,
                    category: row.category,
                    tasks: []
                };
            }
            const taskObj = {
                id: row.task_id,
                title: row.title,
                exp: row.exp_value,
                completed: !!row.completion_id,
                isGym: row.title.includes('Gym') || row.title.includes('Boxing'),
                subTasks: []
            };

            if (taskObj.isGym) {
                // Placeholder: We will load these client-side or we need to do it here. 
                // Doing it here is cleaner but expensive.
                // Let's just mark it isGym and let `TaskItem` handle the "View Mission" UI.
            }

            if (!routines[row.routine_id].tasks.find(t => t.id === row.task_id)) {
                routines[row.routine_id].tasks.push(taskObj);
            }
        });

        return Object.values(routines);
    } finally {
        client.release();
    }
}

export async function toggleTask(taskId, completed) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        const today = new Date().toISOString().split('T')[0];
        const logRes = await client.query('SELECT id FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);
        const logId = logRes.rows[0].id;

        let result = { success: true, leveledUp: false, newLevel: null };

        if (completed) {
            // 1. Add Completion
            await client.query('INSERT INTO task_completions (daily_log_id, task_id) VALUES ($1, $2)', [logId, taskId]);

            // 2. Add EXP and Check Level Up
            const taskRes = await client.query('SELECT exp_value FROM tasks WHERE id = $1', [taskId]);
            const expGained = taskRes.rows[0].exp_value;

            // Get current user stats
            const userRes = await client.query('SELECT level, exp FROM users WHERE id = $1', [session.userId]);
            const currentLevel = userRes.rows[0].level;
            const currentExp = userRes.rows[0].exp;

            const newExp = currentExp + expGained;
            const nextLevelThreshold = currentLevel * 1000;

            let finalLevel = currentLevel;

            if (newExp >= nextLevelThreshold) {
                finalLevel = currentLevel + 1;
                result.leveledUp = true;
                result.newLevel = finalLevel;
            }

            await client.query('UPDATE users SET exp = $1, level = $2 WHERE id = $3', [newExp, finalLevel, session.userId]);
            await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained + $1 WHERE id = $2', [expGained, logId]);

        } else {
            // Remove completion (Simplified: We don't de-level users for unticking, just remove EXP)
            await client.query('DELETE FROM task_completions WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);
            const taskRes = await client.query('SELECT exp_value FROM tasks WHERE id = $1', [taskId]);
            await client.query('UPDATE users SET exp = exp - $1 WHERE id = $2', [taskRes.rows[0].exp_value, session.userId]);
            await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained - $1 WHERE id = $2', [taskRes.rows[0].exp_value, logId]);
        }

        revalidatePath('/');
        return result;
    } catch (e) {
        console.error(e);
        return { success: false };
    } finally {
        client.release();
    }
}

export async function addXP(userId, amount) {
    const client = await pool.connect();
    try {
        const userRes = await client.query('SELECT level, exp FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return;

        const currentLevel = userRes.rows[0].level;
        const currentExp = userRes.rows[0].exp;

        const newExp = currentExp + amount;
        const nextLevelThreshold = currentLevel * 1000;

        let finalLevel = currentLevel;
        if (newExp >= nextLevelThreshold) {
            finalLevel = currentLevel + 1;
        }

        await client.query('UPDATE users SET exp = $1, level = $2 WHERE id = $3', [newExp, finalLevel, userId]);
        revalidatePath('/');
    } finally {
        client.release();
    }
}
