'use server';

import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { BOSS_ROSTER } from '@/lib/game-constants';

export async function getUserStats() {
    const session = await getSession();
    if (!session) return null;

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users WHERE id = $1', [session.userId]);
        const user = res.rows[0];

        // Fetch ACTIVE dungeon break if exists
        const breakRes = await client.query(`
            SELECT * FROM dungeon_breaks 
            WHERE user_id = $1 AND status = 'ACTIVE' AND expires_at > NOW()
            ORDER BY created_at DESC LIMIT 1
        `, [session.userId]);

        // Boss Raid Logic
        const now = new Date();
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
        // const isWeekend = true; // Force test

        let bossRaid = { isActive: false };

        if (isWeekend) {
            // Calculate week number to rotate bosses
            // Simple approach: Weeks since epoch / full weeks
            const oneJan = new Date(now.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);

            // Use weekNum to select boss (cycle through roster)
            const bossIndex = (weekNum - 1) % BOSS_ROSTER.length;
            bossRaid = {
                isActive: true,
                boss: BOSS_ROSTER[bossIndex]
            };
        }

        return {
            ...user,
            dungeonBreak: breakRes.rows[0] || null,
            bossRaid
        };
    } finally {
        client.release();
    }
}

export async function getTodayTasks() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        // Fix: Use local date string (YYYY-MM-DD) to respect server timezone (IST) instead of UTC
        const today = new Date().toLocaleDateString('en-CA');
        let logRes = await client.query('SELECT * FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);

        if (logRes.rows.length === 0) {
            logRes = await client.query('INSERT INTO daily_logs (user_id, date) VALUES ($1, $2) RETURNING *', [session.userId, today]);

            // New Day Reset: Restore HP to Max, Reset Fatigue to 0
            await client.query(`
                UPDATE users SET hp = max_hp, fatigue = 0 WHERE id = $1
            `, [session.userId]);
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
            const userRes = await client.query('SELECT level, exp, gold FROM users WHERE id = $1', [session.userId]);
            const currentLevel = userRes.rows[0].level;
            const currentExp = userRes.rows[0].exp;
            // Handle null gold for safety
            const currentGold = userRes.rows[0].gold || 0;

            const newExp = currentExp + expGained;
            const nextLevelThreshold = currentLevel * 1000;

            // Calculate Gold Gained (1 Gold per 100 XP threshold crossed)
            const oldGoldThreshold = Math.floor(currentExp / 100);
            const newGoldThreshold = Math.floor(newExp / 100);
            const goldGained = newGoldThreshold - oldGoldThreshold;
            const newGold = currentGold + goldGained;

            let finalLevel = currentLevel;

            if (newExp >= nextLevelThreshold) {
                finalLevel = currentLevel + 1;
                result.leveledUp = true;
                result.newLevel = finalLevel;
            }


            let fatiguePenalty = 10;
            let hpPenalty = 0;

            // Check Overwork (Fatigue > 90)
            const stats = await client.query('SELECT fatigue, max_fatigue FROM users WHERE id = $1', [session.userId]);
            const currentFatigue = stats.rows[0].fatigue || 0;

            if (currentFatigue >= 90) {
                hpPenalty = 5;
            }

            // Update User Stats (XP, Gold, Level, Fatigue, HP)
            await client.query(`
                UPDATE users 
                SET exp = $1, level = $2, gold = $3,
                    fatigue = LEAST(max_fatigue, fatigue + $5),
                    hp = GREATEST(0, hp - $6)
                WHERE id = $4
            `, [newExp, finalLevel, newGold, session.userId, fatiguePenalty, hpPenalty]);

            await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained + $1 WHERE id = $2', [expGained, logId]);

        } else {
            // Remove completion
            await client.query('DELETE FROM task_completions WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);

            const taskRes = await client.query('SELECT exp_value FROM tasks WHERE id = $1', [taskId]);
            const expValue = taskRes.rows[0].exp_value;

            const userRes = await client.query('SELECT exp, gold, fatigue FROM users WHERE id = $1', [session.userId]);
            const currentExp = userRes.rows[0].exp;
            const currentGold = userRes.rows[0].gold || 0;
            const currentFatigue = userRes.rows[0].fatigue || 0;

            const newExp = currentExp - expValue;

            // Reverse Gold Calculation
            const oldGoldThreshold = Math.floor(currentExp / 100);
            const newGoldThreshold = Math.floor(newExp / 100);
            const goldLost = oldGoldThreshold - newGoldThreshold;
            const newGold = Math.max(0, currentGold - goldLost);

            // Revert Fatigue (Decrease by 10)
            // Note: We don't revert HP penalty because "the damage is done" (optional, but safer to avoid abuse)
            await client.query(`
                UPDATE users 
                SET exp = $1, gold = $2, fatigue = GREATEST(0, fatigue - 10) 
                WHERE id = $3
            `, [newExp, newGold, session.userId]);

            await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained - $1 WHERE id = $2', [expValue, logId]);
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

export async function addXP(amount) {
    const session = await getSession();
    if (!session) return;

    const client = await pool.connect();
    try {
        const userRes = await client.query('SELECT level, exp, gold FROM users WHERE id = $1', [session.userId]);
        if (userRes.rows.length === 0) return;

        const currentLevel = userRes.rows[0].level;
        const currentExp = userRes.rows[0].exp;
        const currentGold = userRes.rows[0].gold || 0;

        const newExp = currentExp + amount;
        const nextLevelThreshold = currentLevel * 1000;

        // Calculate Gold Gained
        const oldGoldThreshold = Math.floor(currentExp / 100);
        const newGoldThreshold = Math.floor(newExp / 100);
        const goldGained = newGoldThreshold - oldGoldThreshold;
        const newGold = currentGold + goldGained;

        let finalLevel = currentLevel;
        let leveledUp = false;

        if (newExp >= nextLevelThreshold) {
            finalLevel = currentLevel + 1;
            leveledUp = true;
        }

        await client.query('UPDATE users SET exp = $1, level = $2, gold = $3 WHERE id = $4', [newExp, finalLevel, newGold, session.userId]);

        revalidatePath('/');
        return { success: true, leveledUp, newLevel: finalLevel };
    } finally {
        client.release();
    }
}



export async function purchaseItem(cost, itemId) {
    const session = await getSession();
    if (!session) return { success: false, message: "Unauthorized" };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check Balance
        const res = await client.query('SELECT gold FROM users WHERE id = $1 FOR UPDATE', [session.userId]);
        if (res.rows.length === 0) throw new Error("User not found");

        const currentGold = res.rows[0].gold || 0;

        if (currentGold < cost) {
            await client.query('ROLLBACK');
            return { success: false, message: "Insufficient Gold" };
        }

        // Deduct Gold
        const newGold = currentGold - cost;
        await client.query('UPDATE users SET gold = $1 WHERE id = $2', [newGold, session.userId]);

        await client.query('COMMIT');
        revalidatePath('/');
        return { success: true, newGold };
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        return { success: false, message: "Transaction Failed" };
    } finally {
        client.release();
    }
}

export async function checkForDungeonBreak() {
    const session = await getSession();
    if (!session) return null;

    const client = await pool.connect();
    try {
        // Fix: Use local date string (YYYY-MM-DD)
        const today = new Date().toLocaleDateString('en-CA');

        // 1. Check if we already had a break recently (Global Cooldown: 1 per day max)
        const existingRes = await client.query(`
            SELECT id FROM dungeon_breaks 
            WHERE user_id = $1 
            AND created_at::date = $2
        `, [session.userId, today]);

        if (existingRes.rows.length > 0) return null; // Already had one today

        // 2. Random Chance (20%)
        const roll = Math.random();
        if (roll > 0.2) return null;

        // 3. Generate Break
        const POOL = [
            { desc: "SURVIVE: Do 50 Pushups in 30 Minutes", xp: 1000, penalty: 20 },
            { desc: "ESCAPE: Run 2km ASAP", xp: 1200, penalty: 25 },
            { desc: "MANA OVERLOAD: Meditate for 10 Minutes", xp: 800, penalty: 10 },
            { desc: "BOSS BATTLE: 100 Squats - No Rest", xp: 1500, penalty: 30 },
            { desc: "IRON WILL: Hold Plank for 4 Minutes", xp: 900, penalty: 15 },
            { desc: "STORM MODE: 60 Burpees Under 20 Minutes", xp: 1300, penalty: 25 },
            { desc: "SHADOW WALK: Walk 10,000 Steps Today", xp: 1000, penalty: 15 },
            { desc: "FOCUS FIRE: Deep Work for 90 Minutes (No Distractions)", xp: 1400, penalty: 30 },
            { desc: "CORE BREAKER: 200 Sit-ups in a Day", xp: 1100, penalty: 20 },
            { desc: "SILENT MIND: No Phone for 3 Hours", xp: 900, penalty: 15 },
            { desc: "BEAST MODE: Dead Hang for 3 Minutes Total", xp: 1000, penalty: 20 },
            { desc: "DISCIPLINE TEST: Wake Up Before 6 AM", xp: 800, penalty: 10 },
            { desc: "FIRE LEGS: 150 Lunges in a Day", xp: 1200, penalty: 20 },
            { desc: "MONK TRIAL: Cold Shower for 2 Minutes", xp: 700, penalty: 10 }
        ];
        const event = POOL[Math.floor(Math.random() * POOL.length)];
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 mins from now

        const insertRes = await client.query(`
            INSERT INTO dungeon_breaks (user_id, description, xp_reward, penalty_hp, expires_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [session.userId, event.desc, event.xp, event.penalty, expiresAt]);

        return insertRes.rows[0];
    } finally {
        client.release();
    }
}

export async function completeDungeonBreak(breakId) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        // Verify active break
        const breakRes = await client.query(`
            SELECT * FROM dungeon_breaks WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
        `, [breakId, session.userId]);

        if (breakRes.rows.length === 0) return { success: false, message: "Invalid or expired break" };
        const dungeonBreak = breakRes.rows[0];

        // Award Rewards
        await addXP(dungeonBreak.xp_reward); // Reuse existing logic (handles Gold too!)

        // Mark Completed
        await client.query(`UPDATE dungeon_breaks SET status = 'COMPLETED' WHERE id = $1`, [breakId]);

        revalidatePath('/');
        return { success: true };
    } finally {
        client.release();
    }
}

export async function failDungeonBreak(breakId) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        const breakRes = await client.query(`
            SELECT * FROM dungeon_breaks WHERE id = $1 AND user_id = $2 AND status = 'ACTIVE'
        `, [breakId, session.userId]);

        if (breakRes.rows.length === 0) return { success: false };
        const dungeonBreak = breakRes.rows[0];

        // Apply Penalty (HP Loss)
        await client.query(`
            UPDATE users SET hp = GREATEST(0, hp - $1) WHERE id = $2
        `, [dungeonBreak.penalty_hp, session.userId]);

        // Mark Failed
        await client.query(`UPDATE dungeon_breaks SET status = 'FAILED' WHERE id = $1`, [breakId]);

        revalidatePath('/');
        return { success: true };
    } finally {
        client.release();
    }
}

export async function recoverFatigue() {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        await client.query(`
            UPDATE users SET fatigue = GREATEST(0, fatigue - 10) WHERE id = $1
        `, [session.userId]);

        revalidatePath('/');
        return { success: true };
    } finally {
        client.release();
    }
}
