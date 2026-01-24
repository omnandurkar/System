'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { toggleTask } from '@/app/actions'; // Reuse existing logic

export async function getTodaysWorkout() {
    const session = await getSession();
    if (!session) return { type: 'REST', dayName: 'Login Required' };

    const client = await pool.connect();
    try {
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

        // Logic: Mon=1 ... Fri=5. Sat=6(Rest), Sun=7(Cardio/Rest)
        let dayNum = 0;
        let dayType = 'REST';

        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            dayNum = dayOfWeek;
            dayType = 'LIFT';
        } else if (dayOfWeek === 6) {
            dayType = 'REST';
        } else if (dayOfWeek === 0) {
            dayType = 'CARDIO';
        }

        if (dayType === 'LIFT') {
            // Fetch exercises AND completion status for today
            const res = await client.query(`
                SELECT ge.*, 
                       COALESCE(gl.completed, FALSE) as "isCompleted"
                FROM gym_exercises ge
                LEFT JOIN gym_logs gl ON gl.exercise_id = ge.id 
                                      AND gl.user_id = $1 
                                      AND gl.log_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
                WHERE ge.day_number = $2
                ORDER BY ge.id ASC
            `, [session.userId, dayNum]);

            const dayRes = await client.query('SELECT * FROM gym_days WHERE day_number = $1', [dayNum]);
            const dayInfo = dayRes.rows[0];

            return {
                type: 'LIFT',
                exercises: res.rows,
                dayName: dayInfo ? `${dayInfo.name} (${dayInfo.description})` : 'Workout'
            };
        } else if (dayType === 'REST') {
            return { type: 'REST', dayName: 'Active Recovery' };
        } else {
            return { type: 'CARDIO', dayName: 'Cardio + Stretching' };
        }

    } finally {
        client.release();
    }
}

export async function toggleGymExercise(exerciseId, completed) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Get Exercise Info (Category & Day)
        const exRes = await client.query('SELECT day_number, category FROM gym_exercises WHERE id = $1', [exerciseId]);
        const exercise = exRes.rows[0];
        const category = exercise.category || 'WEIGHTS'; // Default to weights

        // 2. Upsert Log
        await client.query(`
            INSERT INTO gym_logs (user_id, exercise_id, log_date, completed)
            VALUES ($1, $2, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date, $3)
            ON CONFLICT (user_id, exercise_id, log_date)
            DO UPDATE SET completed = $3
        `, [session.userId, exerciseId, completed]);

        // 3. Check Auto-Completion for Dashboard Task
        // We only check exercises of the SAME CATEGORY for today's day number.

        // Find today's day number logic again
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayOfWeek = today.getDay();
        let dayNum = (dayOfWeek >= 1 && dayOfWeek <= 5) ? dayOfWeek : 0;

        // If the exercise being toggled belongs to Day 0 (Boxing/Cardio) or the current lifting day, we check.
        // Actually, just check based on the exercise's day number to be safe? 
        // No, we must ensure we are checking "Today's Agenda". 
        // If user is doing a random exercise from another day, it shouldn't auto-complete today's task.
        // But for Boxing, it might be assigned to Day 0 or 99. 
        // Let's assume for now we check based on the exercise's day_number matching today OR it's a "Boxing" category which might be daily.

        // SIMPLIFICATION: If category is BOXING, we check all BOXING exercises for the current day (or global if we treat them so).
        // Let's stick to: Check if all exercises OF THIS CATEGORY *assigned to this day* are done.

        const targetDayNum = exercise.day_number;

        // Check pending in this category/day
        const pendingRes = await client.query(`
            SELECT count(*) as pending
            FROM gym_exercises ge
            LEFT JOIN gym_logs gl ON gl.exercise_id = ge.id 
                                  AND gl.user_id = $1 
                                  AND gl.log_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
            WHERE ge.day_number = $2
            AND (ge.category = $3 OR (ge.category IS NULL AND $3 = 'WEIGHTS'))
            AND (gl.completed IS NULL OR gl.completed = FALSE)
        `, [session.userId, targetDayNum, category]);

        const isAllDone = parseInt(pendingRes.rows[0].pending) === 0;

        // 4. Find the Correct Dashboard Task
        let searchTerm = category === 'BOXING' ? 'Boxing' : 'Gym';
        if (category === 'WEIGHTS') searchTerm = 'Gym'; // or Weights

        const taskRes = await client.query(`
            SELECT t.id 
            FROM tasks t
            JOIN routines r ON t.routine_id = r.id
            WHERE r.user_id = $1
            AND t.title ILIKE $2
            ORDER BY t.id DESC LIMIT 1
         `, [session.userId, `%${searchTerm}%`]);

        if (taskRes.rows.length > 0) {
            const taskId = taskRes.rows[0].id;

            if (isAllDone) {
                await toggleTask(taskId, true);
            } else if (!completed) {
                // Uncheck -> Uncomplete Task
                await toggleTask(taskId, false);
            }
        }

        await client.query('COMMIT');
        revalidatePath('/gym');
        revalidatePath('/');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        throw e;
    } finally {
        client.release();
    }
}

export async function createExercise(data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized'); // Add Admin check in real app

    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO gym_exercises (exercise_name, sets_reps, day_number, category)
            VALUES ($1, $2, $3, $4)
        `, [data.name, data.sets_reps, data.day_number, data.category || 'WEIGHTS']);
        revalidatePath('/gym');
        revalidatePath('/admin');
    } finally {
        client.release();
    }
}

export async function updateExercise(id, data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE gym_exercises 
            SET exercise_name = $1, sets_reps = $2, day_number = $3, category = $4
            WHERE id = $5
        `, [data.name, data.sets_reps, data.day_number, data.category, id]);
        revalidatePath('/gym');
        revalidatePath('/admin');
    } finally {
        client.release();
    }
}

export async function deleteExercise(id) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const client = await pool.connect();
    try {
        await client.query('DELETE FROM gym_exercises WHERE id = $1', [id]);
        revalidatePath('/gym');
        revalidatePath('/admin');
    } finally {
        client.release();
    }
}

export async function getAllExercises() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM gym_exercises ORDER BY day_number, id');
        return res.rows;
    } finally {
        client.release();
    }
}

// --- Day Management ---

export async function getAllDays() {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM gym_days ORDER BY day_number');
        return res.rows;
    } finally {
        client.release();
    }
}

export async function updateDayInfo(dayNum, name, description) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE gym_days
            SET name = $2, description = $3
            WHERE day_number = $1
        `, [dayNum, name, description]);
        revalidatePath('/gym');
        revalidatePath('/admin');
    } finally {
        client.release();
    }
}
