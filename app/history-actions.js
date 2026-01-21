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
            AND dl.date > (CURRENT_DATE - INTERVAL '90 days')
            ORDER BY dl.date DESC, t.id
        `, [session.userId]);

        // 4. Fetch Gym Logs (Last 90 days)
        const gymLogs = await client.query(`
            SELECT gl.id, gl.log_date, ge.exercise_name, ge.sets_reps, ge.category
            FROM gym_logs gl
            JOIN gym_exercises ge ON gl.exercise_id = ge.id
            WHERE gl.user_id = $1
            AND gl.completed = TRUE
            AND gl.log_date > (CURRENT_DATE - INTERVAL '90 days')
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
