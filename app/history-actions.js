'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function getHistoryData() {
    const session = await getSession();
    if (!session) return { dailyLogs: [], recoveryLogs: [], tasks: [], gymLogs: [] };

    const client = await pool.connect();
    try {
        // 1. Fetch ALL daily logs (for streak calculation)
        // We need date and total exp to determine "active days"
        const allDailyLogs = await client.query(`
            SELECT id, date, total_exp_gained 
            FROM daily_logs 
            WHERE user_id = $1 
            ORDER BY date DESC
        `, [session.userId]);

        // 2. Fetch Recovery Logs (Last 90 days for calendar)
        const recoveryLogs = await client.query(`
            SELECT * FROM recovery_logs 
            WHERE user_id = $1 
            ORDER BY log_date DESC LIMIT 90
        `, [session.userId]);

        // 3. Fetch Task Completions (Last 90 days)
        // Join with Tasks to get titles
        const taskCompletions = await client.query(`
            SELECT tc.id, tc.daily_log_id, dl.date, t.title, t.exp_value
            FROM task_completions tc
            JOIN daily_logs dl ON tc.daily_log_id = dl.id
            JOIN tasks t ON tc.task_id = t.id
            WHERE dl.user_id = $1
            AND dl.date > ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '90 days')
            ORDER BY dl.date DESC, t.id
        `, [session.userId]);

        // 4. Fetch Gym Logs (Last 90 days)
        const gymLogs = await client.query(`
            SELECT gl.id, gl.log_date, ge.exercise_name, ge.sets_reps, ge.category
            FROM gym_logs gl
            JOIN gym_exercises ge ON gl.exercise_id = ge.id
            WHERE gl.user_id = $1
            AND gl.completed = TRUE
            AND gl.log_date > ((CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date - INTERVAL '90 days')
            ORDER BY gl.log_date DESC
        `, [session.userId]);

        return {
            dailyLogs: allDailyLogs.rows, // Returns ALL specifically for streak calc
            recoveryLogs: recoveryLogs.rows,
            tasks: taskCompletions.rows,
            gymLogs: gymLogs.rows
        };
    } finally {
        client.release();
    }
}

export async function getSystemLogs() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        const usernameRes = await client.query('SELECT username FROM users WHERE id = $1', [session.userId]);
        const username = usernameRes.rows[0].username || 'ADMIN';

        const logsRes = await client.query(`
            SELECT * FROM (
                -- 1. Tasks
                SELECT 
                    tc.completed_at as timestamp,
                    'TASK' as type,
                    'Player [' || $2 || '] completed [' || t.title || ']. Reward: ' || t.exp_value || ' XP.' as message
                FROM task_completions tc
                JOIN tasks t ON tc.task_id = t.id
                JOIN daily_logs dl ON tc.daily_log_id = dl.id
                WHERE dl.user_id = $1 AND tc.completed_at IS NOT NULL

                UNION ALL

                -- 2. Dungeon Breaks
                SELECT 
                    created_at as timestamp,
                    'DUNGEON' as type,
                    'Player [' || $2 || '] encountered [' || description || ']. Status: ' || status || '.' as message
                FROM dungeon_breaks
                WHERE user_id = $1

                UNION ALL

                -- 3. Gym Logs
                SELECT
                    (log_date || ' 00:00:00')::timestamp as timestamp,
                    'GYM' as type,
                    'Player [' || $2 || '] performed [' || ge.exercise_name || '] - ' || ge.sets_reps as message
                FROM gym_logs gl
                JOIN gym_exercises ge ON gl.exercise_id = ge.id
                WHERE gl.user_id = $1 AND gl.completed = TRUE

                UNION ALL

                -- 4. Titles (If applicable)
                SELECT
                    unlocked_at as timestamp,
                    'ACHIEVEMENT' as type,
                    'Player [' || $2 || '] unlocked title [' || title_id || '].' as message
                FROM user_titles
                WHERE user_id = $1

            ) combined_logs
            ORDER BY timestamp DESC
            LIMIT 100
        `, [session.userId, username]);

        return logsRes.rows;
    } finally {
        client.release();
    }
}
