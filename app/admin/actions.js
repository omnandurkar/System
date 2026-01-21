'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAllRoutinesAndTasks() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT r.id as routine_id, r.name as routine_name, r.start_time, r.end_time,
             t.id as task_id, t.title, t.exp_value
      FROM routines r
      LEFT JOIN tasks t ON t.routine_id = r.id
      WHERE r.user_id = $1
      ORDER BY r.start_time, t.id
    `, [session.userId]);

        // Grouping
        const data = {};
        res.rows.forEach(row => {
            if (!data[row.routine_id]) {
                data[row.routine_id] = {
                    id: row.routine_id,
                    name: row.routine_name,
                    time: `${row.start_time} - ${row.end_time}`,
                    tasks: []
                };
            }
            if (row.task_id) {
                data[row.routine_id].tasks.push({
                    id: row.task_id,
                    title: row.title,
                    exp: row.exp_value
                });
            }
        });
        return Object.values(data);
    } finally {
        client.release();
    }
}

export async function updateTask(taskId, title, exp) {
    const session = await getSession();
    if (!session) return { success: false };

    // TODO: Add verification that task belongs to user (implicitly handled by UI flow, but good for security)

    const client = await pool.connect();
    try {
        // Verify ownership
        const taskCheck = await client.query(`
        SELECT t.id 
        FROM tasks t
        JOIN routines r ON t.routine_id = r.id
        WHERE t.id = $1 AND r.user_id = $2
    `, [taskId, session.userId]);

        if (taskCheck.rows.length === 0) {
            return { success: false, error: 'Unauthorized' };
        }

        await client.query('UPDATE tasks SET title = $1, exp_value = $2 WHERE id = $3', [title, exp, taskId]);
        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    } finally {
        client.release();
    }
}
