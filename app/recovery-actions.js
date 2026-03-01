'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { addXP } from '@/app/actions';
import { revalidatePath } from 'next/cache';

export async function logRecovery(data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    const { bedTime, wakeTime, sleepDuration, soreness, stress, hadDream, dreamLog } = data;

    // Safe Parsing
    const safeSleep = parseFloat(sleepDuration) || 0;
    const safeSoreness = parseFloat(soreness) || 0;
    const safeStress = parseFloat(stress) || 0;

    // Algorithm Update: Use the calculated duration instead of manual input
    const sleepScore = Math.min((safeSleep / 8) * 50, 50);
    const sorenessScore = ((10 - safeSoreness) / 10) * 25;
    const stressScore = ((10 - safeStress) / 10) * 25;

    const totalScore = Math.round(sleepScore + sorenessScore + stressScore);

    // Create Timestamps for today
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA');
    const bedTimestamp = `${dateStr} ${bedTime}:00`;
    // Wake timestamp: if wake time < bed time, assume next day? 
    // For simplicity in logging "Last Night's Sleep", we usually log it as "Today's Recovery".
    // If Bed is 22:00 and Wake is 06:00, that's fine.
    // However, saving just the time string or a constructed timestamp is mostly for reference.
    const wakeTimestamp = `${dateStr} ${wakeTime}:00`;

    const client = await pool.connect();
    try {
        await client.query(`
            INSERT INTO recovery_logs (
                user_id, log_date, sleep_hours, soreness_level, stress_level, recovery_score,
                bed_time, wake_time, had_dream, dream_log
            )
            VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (user_id, log_date) 
            DO UPDATE SET 
                sleep_hours = $2, soreness_level = $3, stress_level = $4, recovery_score = $5,
                bed_time = $6, wake_time = $7, had_dream = $8, dream_log = $9
        `, [
            session.userId, safeSleep, safeSoreness, safeStress, totalScore,
            bedTimestamp, wakeTimestamp, hadDream, dreamLog
        ]);

        // Reward XP if score is good
        if (totalScore >= 80) {
            await addXP(50); // Great recovery bonus (FIX: removed userID arg as addXP gets session)
        } else if (totalScore >= 50) {
            await addXP(20); // Maintenance
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
