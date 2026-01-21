'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { addXP } from '@/app/actions';
import { revalidatePath } from 'next/cache';

export async function logRecovery(data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const { sleep, soreness, stress } = data;

    // Algorithm:
    // Sleep: Aim for 8. (Sleep/8 * 50) max 50.
    // Soreness: Low is good. ((10-Soreness)/10 * 25)
    // Stress: Low is good. ((10-Stress)/10 * 25)

    const sleepScore = Math.min((sleep / 8) * 50, 50);
    const sorenessScore = ((10 - soreness) / 10) * 25;
    const stressScore = ((10 - stress) / 10) * 25;

    const totalScore = Math.round(sleepScore + sorenessScore + stressScore);

    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO recovery_logs (user_id, log_date, sleep_hours, soreness_level, stress_level, recovery_score)
            VALUES ($1, CURRENT_DATE, $2, $3, $4, $5)
            ON CONFLICT (user_id, log_date) 
            DO UPDATE SET sleep_hours = $2, soreness_level = $3, stress_level = $4, recovery_score = $5
        `, [session.userId, sleep, soreness, stress, totalScore]);

        // Reward XP if score is good
        if (totalScore >= 80) {
            await addXP(session.userId, 50); // Great recovery bonus
        } else if (totalScore >= 50) {
            await addXP(session.userId, 20); // Maintenance
        }

        revalidatePath('/recovery');
        return { success: true, score: totalScore };
    } finally {
        client.release();
    }
}

export async function getTodayRecovery() {
    const session = await getSession();
    if (!session) return null;

    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT * FROM recovery_logs WHERE user_id = $1 AND log_date = CURRENT_DATE
        `, [session.userId]);
        return res.rows[0] || null;
    } finally {
        client.release();
    }
}
