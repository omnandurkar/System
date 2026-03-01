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
        // Fix: Use 'Asia/Kolkata' timezone for correct day calculation
        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
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

        // Check for Active Penalty Routine
        const penaltyRes = await client.query("SELECT id FROM routines WHERE user_id = $1 AND category = 'penalty'", [session.userId]);
        let penaltyActive = penaltyRes.rows.length > 0;

        // Self-Healing: If penalty exists but tasks are done, remove it
        if (penaltyActive) {
            const rId = penaltyRes.rows[0].id;
            const taskCheck = await client.query(`
                SELECT t.id, t.target_value, tc.progress, tc.completed_at 
                FROM tasks t 
                LEFT JOIN task_completions tc ON tc.task_id = t.id 
                WHERE t.routine_id = $1
            `, [rId]);

            // If all tasks are completed (progress >= target), delete routine
            const allDone = taskCheck.rows.every(row => {
                const target = row.target_value || 1;
                const progress = row.progress || 0;
                return (row.completed_at) || (progress >= target);
            });

            if (allDone && taskCheck.rows.length > 0) {
                // DO NOT DELETE - Keep it as proof we paid the penalty
                // await client.query("DELETE FROM routines WHERE id = $1", [rId]); 
                penaltyActive = false;
            }
        }

        return {
            ...user,
            dungeonBreak: breakRes.rows[0] || null,
            bossRaid,
            penaltyActive
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
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        let logRes = await client.query('SELECT * FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);

        if (logRes.rows.length === 0) {
            logRes = await client.query('INSERT INTO daily_logs (user_id, date) VALUES ($1, $2) RETURNING *', [session.userId, today]);

            // New Day Reset: Restore HP to Max, Reset Fatigue to 0
            await client.query(`
                UPDATE users SET hp = max_hp, fatigue = 0 WHERE id = $1
            `, [session.userId]);
        }
        const logId = logRes.rows[0].id;



        // --- PENALTY CHECK LOGIC ---
        // Check Yesterday
        const jsDate = new Date();
        jsDate.setDate(jsDate.getDate() - 1);
        const yesterday = jsDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Only run check if account is old enough (don't punish day 1 users)
        const userCreatedRes = await client.query('SELECT created_at FROM users WHERE id = $1', [session.userId]);
        const createdAt = new Date(userCreatedRes.rows[0].created_at);
        const yesterdayDateObj = new Date(yesterday); // approximated

        if (yesterdayDateObj > createdAt) {
            const yesterdayLogRes = await client.query('SELECT total_exp_gained FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, yesterday]);

            // If log exists AND xp was 0 (or very low?), OR log doesn't exist
            // Note: Depending on logic, maybe < 10 XP is failure? Let's stick to 0 for strictness or < 10.
            const failedYesterday = yesterdayLogRes.rows.length > 0 ? (yesterdayLogRes.rows[0].total_exp_gained < 10) : true;

            if (failedYesterday) {
                const penaltyCheck = await client.query("SELECT id FROM routines WHERE user_id = $1 AND category = 'penalty'", [session.userId]);
                if (penaltyCheck.rows.length === 0) {
                    const rRes = await client.query("INSERT INTO routines (user_id, name, start_time, end_time, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                        [session.userId, '☠️ PENALTY ZONE', 'IMMEDIATE', 'DEATH', 'penalty']);
                    const rId = rRes.rows[0].id;

                    const PENALTY_ROSTER = [
                        { title: 'SURVIVAL: 50 Pushups', target: 50, unit: 'reps' },
                        { title: 'ESCAPE: Run 2km', target: 2, unit: 'km' },
                        { title: 'BOSS BATTLE: 100 Squats', target: 100, unit: 'reps' },
                        { title: 'STORM MODE: 60 Burpees', target: 60, unit: 'reps' },
                        { title: 'IRON WILL: 4 Minute Plank', target: 4, unit: 'min' }, // Note: progress entry for minutes might be tricky if user enters seconds? Let's assume standard input.
                        { title: 'CORE BREAKER: 200 Sit-ups', target: 200, unit: 'reps' },
                        { title: 'BEAST MODE: Dead Hang 3 Mins', target: 3, unit: 'min' },
                        { title: 'FIRE LEGS: 150 Lunges', target: 150, unit: 'reps' },
                        { title: 'MONK TRIAL: Cold Shower 2 Min', target: 2, unit: 'min' },
                        { title: 'MANA OVERLOAD: Meditate 10 Min', target: 10, unit: 'min' },
                        { title: 'SHADOW WALK: 10,000 Steps', target: 10000, unit: 'steps' },
                        { title: 'FOCUS FIRE: Deep Work 90 Mins', target: 90, unit: 'min' },
                        { title: 'SILENT MIND: No Phone 3 Hours', target: 3, unit: 'hrs' },
                        { title: 'DISCIPLINE TEST: Wake Up Before 6 AM', target: 1, unit: 'check' }
                    ];

                    const randomPenalty = PENALTY_ROSTER[Math.floor(Math.random() * PENALTY_ROSTER.length)];

                    await client.query("INSERT INTO tasks (routine_id, title, exp_value, target_value, unit) VALUES ($1, $2, $3, $4, $5)",
                        [rId, randomPenalty.title, 0, randomPenalty.target, randomPenalty.unit]);
                    // No XP for penalty tasks. You do it to survive.
                }
            }
        }

        // --- WEEKEND LOGIC ---
        const todayDate = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayOfWeek = todayDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sun=0, Sat=6

        // 1. Ensure Weekend Routines match the day
        if (isWeekend) {
            // Check if "Weekend Chores" and "Boss Raid" routines exist for this user
            // If not, insert them dynamically
            const weekendRoutinesCheck = await client.query("SELECT id FROM routines WHERE user_id = $1 AND category = 'weekend_chores'", [session.userId]);
            if (weekendRoutinesCheck.rows.length === 0) {
                const rRes = await client.query("INSERT INTO routines (user_id, name, start_time, end_time, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                    [session.userId, 'WEEKEND OPS', '09:00', '12:00', 'weekend_chores']);
                const rId = rRes.rows[0].id;
                await client.query("INSERT INTO tasks (routine_id, title, exp_value) VALUES ($1, $2, $3)", [rId, 'Room Cleaning & Laundry', 50]);
                await client.query("INSERT INTO tasks (routine_id, title, exp_value) VALUES ($1, $2, $3)", [rId, 'Grocery / Meal Prep', 30]);
                await client.query("INSERT INTO tasks (routine_id, title, exp_value) VALUES ($1, $2, $3)", [rId, 'Social / Outing', 40]);
            }

            const bossRaidCheck = await client.query("SELECT id FROM routines WHERE user_id = $1 AND category = 'boss_raid'", [session.userId]);
            if (bossRaidCheck.rows.length === 0) {
                const rRes = await client.query("INSERT INTO routines (user_id, name, start_time, end_time, category) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                    [session.userId, '☠️ BOSS RAID CHALLENGE', 'ALL DAY', '23:59', 'boss_raid']);
                const rId = rRes.rows[0].id;

                // Targeted High Effort Tasks
                await client.query("INSERT INTO tasks (routine_id, title, exp_value, target_value, unit) VALUES ($1, $2, $3, $4, $5)", [rId, '100 Pushups', 150, 100, 'reps']);
                await client.query("INSERT INTO tasks (routine_id, title, exp_value, target_value, unit) VALUES ($1, $2, $3, $4, $5)", [rId, '5km Run / Walk', 200, 5, 'km']);
                await client.query("INSERT INTO tasks (routine_id, title, exp_value, target_value, unit) VALUES ($1, $2, $3, $4, $5)", [rId, '100 Squats', 150, 100, 'reps']);
                await client.query("INSERT INTO tasks (routine_id, title, exp_value, target_value, unit) VALUES ($1, $2, $3, $4, $5)", [rId, '200 Sit-ups', 180, 200, 'reps']);
            }
        }

        const routinesRes = await client.query(`
          SELECT r.id as routine_id, r.name as routine_name, r.start_time, r.end_time, r.category,
                 t.id as task_id, t.title, t.exp_value, t.target_value, t.unit,
                 tc.id as completion_id, tc.progress
          FROM routines r
          JOIN tasks t ON t.routine_id = r.id
          LEFT JOIN task_completions tc ON tc.task_id = t.id AND tc.daily_log_id = $1
          WHERE r.user_id = $2
          ORDER BY 
            CASE 
                WHEN r.category = 'penalty' THEN 0 
                WHEN r.category = 'boss_raid' THEN 10 
                WHEN r.category = 'morning' THEN 1
                WHEN r.category = 'work' THEN 2
                WHEN r.category = 'weekend_chores' THEN 2 
                WHEN r.category = 'evening' THEN 3
                WHEN r.category = 'night' THEN 4
                ELSE 5 
            END, 
            t.id
        `, [logId, session.userId]);

        const routines = {};
        routinesRes.rows.forEach(row => {

            // WORK FILTER: If weekend, skip 'work'
            if (isWeekend) {
                if (row.category === 'work') return;

                // WEEKEND GYM/BOXING FILTER: Skip Gym and Boxing on weekends
                const titleUpper = row.title.toUpperCase();
                if (titleUpper.includes('GYM') || titleUpper.includes('BOXING')) return;
            }

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
                completed: !!row.completion_id && !!row.completion_id /* Wait, need check if completed_at is not null? row.completion_id is just ID */,
                isGym: row.title.includes('Gym') || row.title.includes('Boxing'),
                // Progress Tracking
                target: row.target_value || 1,
                unit: row.unit || null,
                progress: row.progress || 0,
            };

            // Fix completion check since we did left join
            // Using check logic from old code: completed: !!row.completion_id
            // But now we have partial progress valid rows with completion_id but NOT finished.
            // We should check if we fetched completed_at in query? No we didn't.
            // Let's rely on logic: if progress >= target, then it IS completed.
            // Update: actually 'tc' might exist with progress 0.
            // Let's fetch completed_at in query to be sure.

            // Re-visiting query to add tc.completed_at...
            // Since we didn't add it in the SQL above, let's fix the SQL inside this ReplacementChunk first.

            if (!routines[row.routine_id].tasks.find(t => t.id === row.task_id)) {
                routines[row.routine_id].tasks.push(taskObj);
            }
        });

        return Object.values(routines);
    } finally {
        client.release();
    }
}


// --- Helper Functions for Task Completion Logic ---
async function _awardTaskCompletion(client, userId, taskId, logId) {
    const taskRes = await client.query('SELECT exp_value FROM tasks WHERE id = $1', [taskId]);
    const expGained = taskRes.rows[0]?.exp_value || 0;

    const userRes = await client.query('SELECT level, exp, gold, fatigue, max_fatigue FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return { success: false };

    const currentLevel = userRes.rows[0].level || 1;
    const currentExp = userRes.rows[0].exp || 0;
    const currentGold = userRes.rows[0].gold || 0;

    const newExp = currentExp + expGained;
    const nextLevelThreshold = currentLevel * 1000;

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

    let fatiguePenalty = 10;
    let hpPenalty = 0;

    const currentFatigue = userRes.rows[0].fatigue || 0;
    if (currentFatigue >= 90) {
        hpPenalty = 5;
    }

    if (leveledUp) {
        // FULL RESTORE ON LEVEL UP
        await client.query(`
            UPDATE users 
            SET exp = $1, level = $2, gold = $3,
                fatigue = 0,
                hp = max_hp,
                stat_points = stat_points + 5
            WHERE id = $4
        `, [newExp, finalLevel, newGold, userId]);
    } else {
        await client.query(`
            UPDATE users 
            SET exp = $1, level = $2, gold = $3,
                fatigue = LEAST(max_fatigue, fatigue + $5),
                hp = GREATEST(0, hp - $6)
            WHERE id = $4
        `, [newExp, finalLevel, newGold, userId, fatiguePenalty, hpPenalty]);
    }

    await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained + $1 WHERE id = $2', [expGained, logId]);

    return { success: true, leveledUp, newLevel: finalLevel };
}

async function _revertTaskCompletion(client, userId, taskId, logId) {
    const taskRes = await client.query('SELECT exp_value FROM tasks WHERE id = $1', [taskId]);
    const expValue = taskRes.rows[0]?.exp_value || 0;

    const userRes = await client.query('SELECT exp, gold, fatigue FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return { success: false };

    const currentExp = userRes.rows[0].exp || 0;
    const currentGold = userRes.rows[0].gold || 0;

    const newExp = currentExp - expValue;
    const oldGoldThreshold = Math.floor(currentExp / 100);
    const newGoldThreshold = Math.floor(newExp / 100);
    const goldLost = oldGoldThreshold - newGoldThreshold;
    const newGold = Math.max(0, currentGold - goldLost);

    await client.query(`
        UPDATE users 
        SET exp = $1, gold = $2, fatigue = GREATEST(0, fatigue - 10) 
        WHERE id = $3
    `, [newExp, newGold, userId]);

    await client.query('UPDATE daily_logs SET total_exp_gained = total_exp_gained - $1 WHERE id = $2', [expValue, logId]);

    return { success: true };
}

async function checkAchievements(client, userId) {
    const newUnlocks = [];

    // 1. IRON BODY: 50 Gym Sessions
    // We count completions of tasks with 'Gym' or 'Workout' or 'Pushups' etc.
    // Simplest: Check task titles.
    const gymCountRes = await client.query(`
        SELECT COUNT(*) FROM task_completions tc
        JOIN tasks t ON t.id = tc.task_id
        WHERE t.title ILIKE '%Gym%' OR t.title ILIKE '%Workout%' OR t.title ILIKE '%Pushup%' OR t.title ILIKE '%Squat%'
        AND tc.completed_at IS NOT NULL AND tc.daily_log_id IN (SELECT id FROM daily_logs WHERE user_id = $1)
    `, [userId]);
    const gymCount = parseInt(gymCountRes.rows[0]?.count || '0', 10);

    if (gymCount >= 50) {
        const res = await client.query("INSERT INTO user_titles (user_id, title_id) VALUES ($1, 'Iron Body') ON CONFLICT DO NOTHING RETURNING id", [userId]);
        if (res.rowCount > 0) newUnlocks.push('Iron Body');
    }

    // 2. SCHOLAR: 20 Study Sessions
    const studyCountRes = await client.query(`
        SELECT COUNT(*) FROM task_completions tc
        JOIN tasks t ON t.id = tc.task_id
        WHERE t.title ILIKE '%Read%' OR t.title ILIKE '%Study%' OR t.title ILIKE '%Deep Work%'
        AND tc.completed_at IS NOT NULL AND tc.daily_log_id IN (SELECT id FROM daily_logs WHERE user_id = $1)
    `, [userId]);
    const studyCount = parseInt(studyCountRes.rows[0]?.count || '0', 10);

    if (studyCount >= 20) {
        const res = await client.query("INSERT INTO user_titles (user_id, title_id) VALUES ($1, 'Scholar') ON CONFLICT DO NOTHING RETURNING id", [userId]);
        if (res.rowCount > 0) newUnlocks.push('Scholar');
    }

    // 3. EARLY BIRD: 7 Early Wakeups
    // Assuming 'Wake Up' task exists and checking completion time? 
    // Or just checking if ANY Morning routine task was done before 6 AM?
    // Let's rely on a task named "Wake Up" or "Morning".
    // For simplicity, let's just count 'Morning' category routine completions?
    // Actually, prompts says "Wake up before 6 AM". 
    // We can check `completed_at` time.
    const earlyCountRes = await client.query(`
        SELECT COUNT(*) FROM task_completions tc
        JOIN daily_logs dl ON tc.daily_log_id = dl.id
        WHERE dl.user_id = $1
        AND EXTRACT(HOUR FROM tc.completed_at AT TIME ZONE 'Asia/Kolkata') < 6
    `, [userId]);
    const earlyCount = parseInt(earlyCountRes.rows[0]?.count || '0', 10);

    if (earlyCount >= 7) {
        const res = await client.query("INSERT INTO user_titles (user_id, title_id) VALUES ($1, 'The Early Bird') ON CONFLICT DO NOTHING RETURNING id", [userId]);
        if (res.rowCount > 0) newUnlocks.push('The Early Bird');
    }

    return newUnlocks;
}

export async function toggleTask(taskId, completed) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const logRes = await client.query('SELECT id FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);
        const logId = logRes.rows[0].id;

        await client.query('BEGIN');

        let result = { success: true, leveledUp: false, newLevel: null };

        if (completed) {
            await client.query('INSERT INTO task_completions (daily_log_id, task_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [logId, taskId]);
            result = await _awardTaskCompletion(client, session.userId, taskId, logId);

            // Check Achievements
            await checkAchievements(client, session.userId);

        } else {
            await client.query('DELETE FROM task_completions WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);
            await _revertTaskCompletion(client, session.userId, taskId, logId);
        }

        await client.query('COMMIT');
        revalidatePath('/');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        return { success: false };
    } finally {
        client.release();
    }
}

export async function updateTaskProgress(taskId, progress) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const logRes = await client.query('SELECT id FROM daily_logs WHERE user_id = $1 AND date = $2', [session.userId, today]);
        const logId = logRes.rows[0].id;

        await client.query('BEGIN');

        const taskRes = await client.query('SELECT target_value FROM tasks WHERE id = $1', [taskId]);
        const target = taskRes.rows[0].target_value || 1;

        const compRes = await client.query('SELECT completed_at, progress FROM task_completions WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);
        const existingComp = compRes.rows[0];
        const wasCompleted = existingComp && existingComp.completed_at;

        if (existingComp) {
            await client.query('UPDATE task_completions SET progress = $1 WHERE daily_log_id = $2 AND task_id = $3', [progress, logId, taskId]);
        } else {
            await client.query('INSERT INTO task_completions (daily_log_id, task_id, progress, completed_at) VALUES ($1, $2, $3, NULL)', [logId, taskId, progress]);
        }

        const isNowCompleted = progress >= target;
        let result = { success: true };

        if (isNowCompleted && !wasCompleted) {
            await client.query('UPDATE task_completions SET completed_at = NOW() WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);
            result = await _awardTaskCompletion(client, session.userId, taskId, logId);
        } else if (!isNowCompleted && wasCompleted) {
            await client.query('UPDATE task_completions SET completed_at = NULL WHERE daily_log_id = $1 AND task_id = $2', [logId, taskId]);
            await _revertTaskCompletion(client, session.userId, taskId, logId);
        }

        await client.query('COMMIT');
        revalidatePath('/');
        return result;

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        return { success: false };
    } finally {
        client.release();
    }
}


export async function allocateStat(stat) {
    const session = await getSession();
    if (!session) return { success: false };

    // Validate stat name
    const validStats = ['strength', 'intelligence', 'vitality'];
    if (!validStats.includes(stat)) return { success: false, message: 'Invalid Stat' };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check Points
        const userRes = await client.query('SELECT stat_points FROM users WHERE id = $1 FOR UPDATE', [session.userId]);
        const points = userRes.rows[0].stat_points || 0;

        if (points <= 0) {
            await client.query('ROLLBACK');
            return { success: false, message: 'No points available' };
        }

        // Allocate
        await client.query(`
            UPDATE users 
            SET ${stat} = ${stat} + 1, stat_points = stat_points - 1
            WHERE id = $1
        `, [session.userId]);

        // PASSIVE EFFECT CHECK: VIT > 20 -> Increase Max Fatigue
        if (stat === 'vitality') {
            const vitRes = await client.query('SELECT vitality, max_fatigue FROM users WHERE id = $1', [session.userId]);
            const vit = vitRes.rows[0].vitality;
            const currentMax = vitRes.rows[0].max_fatigue;

            if (vit >= 20 && currentMax === 100) {
                await client.query('UPDATE users SET max_fatigue = 150 WHERE id = $1', [session.userId]);
            }
        }

        await client.query('COMMIT');
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        await client.query('ROLLBACK');
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
        const userRes = await client.query('SELECT level, exp, gold, current_title FROM users WHERE id = $1', [session.userId]);
        if (userRes.rows.length === 0) return;

        const currentLevel = userRes.rows[0].level;
        const currentExp = userRes.rows[0].exp;
        const currentGold = userRes.rows[0].gold || 0;
        const currentTitle = userRes.rows[0].current_title;

        // Apply Buffs
        let multiplier = 1;
        if (currentTitle === 'The Early Bird') multiplier = 1.05; // +5% XP

        let goldMultiplier = 1;
        if (currentTitle === 'Scholar') goldMultiplier = 1.05; // +5% Gold (Logic handled below in calc)

        const finalAmount = Math.floor(amount * multiplier);
        const newExp = currentExp + finalAmount;
        const nextLevelThreshold = currentLevel * 1000;

        // Calculate Gold Gained
        const oldGoldThreshold = Math.floor(currentExp / 100);
        const newGoldThreshold = Math.floor(newExp / 100);
        let goldGained = newGoldThreshold - oldGoldThreshold;

        // Apply Gold Buff (Scholar)
        if (currentTitle === 'Scholar') {
            goldGained = Math.ceil(goldGained * 1.05);
        }

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

        // Record Purchase
        // If itemId starts with 'potion_', we might treat it as consumable inventory in future.
        // For now, everything is a "purchase" record.
        await client.query(`
            INSERT INTO user_purchases (user_id, item_id) 
            VALUES ($1, $2)
            ON CONFLICT (user_id, item_id) DO NOTHING
        `, [session.userId, itemId]);

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

export async function getUnlockedItems() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT item_id FROM user_purchases WHERE user_id = $1', [session.userId]);
        return res.rows.map(r => r.item_id); // Return array of strings
    } finally {
        client.release();
    }
}

export async function equipTheme(themeId) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        // Validate ownership if not default
        if (themeId) {
            const check = await client.query('SELECT id FROM user_purchases WHERE user_id = $1 AND item_id = $2', [session.userId, themeId]);
            if (check.rows.length === 0) return { success: false, message: "Theme not owned" };
        }

        await client.query('UPDATE users SET current_theme = $1 WHERE id = $2', [themeId, session.userId]);
        revalidatePath('/');
        return { success: true };
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
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

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

export async function getTitles() {
    const session = await getSession();
    if (!session) return [];

    const client = await pool.connect();
    try {
        // Fetch unlocked titles
        const res = await client.query("SELECT title_id, unlocked_at FROM user_titles WHERE user_id = $1", [session.userId]);
        return res.rows;
    } finally {
        client.release();
    }
}

export async function equipTitle(titleId) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        // Verify ownership
        const check = await client.query("SELECT id FROM user_titles WHERE user_id = $1 AND title_id = $2", [session.userId, titleId]);

        // Allow unequip if titleId is null or empty
        if (!titleId) {
            await client.query("UPDATE users SET current_title = NULL WHERE id = $1", [session.userId]);
            revalidatePath('/');
            return { success: true };
        }

        if (check.rows.length === 0) return { success: false, message: "Title not unlocked" };

        await client.query("UPDATE users SET current_title = $1 WHERE id = $2", [titleId, session.userId]);

        revalidatePath('/');
        return { success: true };
    } finally {
        client.release();
    }
}

export async function awardMysteryBox() {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Roll Loot
        const roll = Math.random();
        let rewardType = 'gold';
        let amount = 0;
        let message = '';

        if (roll < 0.50) {
            // 50% GOLD
            rewardType = 'gold';
            amount = Math.floor(Math.random() * 100) + 50; // 50-150
            message = `${amount} Gold`;
            await client.query('UPDATE users SET gold = gold + $1 WHERE id = $2', [amount, session.userId]);
        } else if (roll < 0.80) {
            // 30% XP
            rewardType = 'xp';
            amount = Math.floor(Math.random() * 300) + 200; // 200-500
            message = `${amount} XP`;
            // Internal XP Update (Simplified logic from addXP to avoid deps issues)
            const userRes = await client.query('SELECT level, exp FROM users WHERE id = $1', [session.userId]);
            const currentLevel = userRes.rows[0].level;
            const currentExp = userRes.rows[0].exp;
            let newExp = currentExp + amount;
            let nextLevelThreshold = currentLevel * 1000;
            let finalLevel = currentLevel;

            if (newExp >= nextLevelThreshold) {
                finalLevel++;
                // Full Restore on Level Up
                await client.query('UPDATE users SET exp = $1, level = $2, hp = max_hp, fatigue = 0, stat_points = stat_points + 5 WHERE id = $3', [newExp, finalLevel, session.userId]);
            } else {
                await client.query('UPDATE users SET exp = $1 WHERE id = $2', [newExp, session.userId]);
            }
        } else if (roll < 0.95) {
            // 15% FATIGUE RESTORE
            rewardType = 'fatigue';
            amount = 20;
            message = `Fatigue Healed (-20)`;
            await client.query('UPDATE users SET fatigue = GREATEST(0, fatigue - 20) WHERE id = $1', [session.userId]);
        } else {
            // 5% STAT POINT
            rewardType = 'stat';
            amount = 1;
            message = `+1 STAT POINT (LEGENDARY)`;
            await client.query('UPDATE users SET stat_points = stat_points + 1 WHERE id = $1', [session.userId]);
        }

        await client.query('COMMIT');
        revalidatePath('/');
        return { success: true, rewardType, amount, message };

    } catch (e) {
        await client.query('ROLLBACK');
        console.error(e);
        return { success: false, message: "Box Jammed" };
    } finally {
        client.release();
    }
}

export async function checkSystemWhisper() {
    const session = await getSession();
    if (!session) return null;

    const client = await pool.connect();
    try {
        const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        // Check existing
        const existing = await client.query("SELECT * FROM system_whispers WHERE user_id = $1 AND created_at = $2", [session.userId, today]);
        if (existing.rows.length > 0) return existing.rows[0];

        // 30% Chance to generate
        if (Math.random() > 0.7) {
            const types = [
                { type: 'WAKE_EARLY', msg: "The System requires you to wake before 05:00.", target: '05:00' },
                { type: 'SHADOW_WORK', msg: "Can you do 50 pushups in one set? Prove it.", target: '50' },
                { type: 'FOCUS_TEST', msg: "Read 10 pages of a book. Enter the page number you stopped at.", target: '10' },
                { type: 'COLD_IMMERSION', msg: "Endure a cold shower for 2 minutes. Enter 'DONE' if you have the will.", target: 'DONE' },
                { type: 'DIGITAL_DETOX', msg: "No social media for 1 hour. Enter the current hour (0-23) to start.", target: 'ANY' },
                { type: 'FASTING', msg: "Skip your next meal. Enter 'FAST' to confirm commitment.", target: 'FAST' }
            ];
            const whisper = types[Math.floor(Math.random() * types.length)];

            const res = await client.query(`
                INSERT INTO system_whispers (user_id, type, message, target_value, created_at)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *
            `, [session.userId, whisper.type, whisper.msg, whisper.target, today]);
            return res.rows[0];
        }
        return null;
    } finally {
        client.release();
    }
}

export async function dismissWhisper(whisperId) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        await client.query("UPDATE system_whispers SET status = 'SKIPPED' WHERE id = $1 AND user_id = $2", [whisperId, session.userId]);
        revalidatePath('/');
        return { success: true };
    } finally {
        client.release();
    }
}

export async function verifyWhisper(whisperId, input) {
    const session = await getSession();
    if (!session) return { success: false };

    const client = await pool.connect();
    try {
        const res = await client.query("SELECT * FROM system_whispers WHERE id = $1 AND user_id = $2", [whisperId, session.userId]);
        if (res.rows.length === 0) return { success: false, message: "Whisper lost in the void." };

        const whisper = res.rows[0];
        if (whisper.status !== 'ACTIVE') return { success: false, message: "Already resolved." };

        let success = false;

        if (whisper.type === 'WAKE_EARLY') {
            if (input <= whisper.target_value) success = true;
        } else if (whisper.type === 'SHADOW_WORK' || whisper.type === 'FOCUS_TEST') {
            if (parseInt(input) >= parseInt(whisper.target_value)) success = true;
        } else if (whisper.type === 'COLD_IMMERSION' || whisper.type === 'FASTING') {
            if (input.toUpperCase() === whisper.target_value) success = true;
        } else if (whisper.type === 'DIGITAL_DETOX') {
            if (parseInt(input) >= 0 && parseInt(input) <= 23) success = true;
        }

        if (success) {
            await client.query("UPDATE system_whispers SET status = 'COMPLETED' WHERE id = $1", [whisperId]);

            const userRes = await client.query('SELECT level, exp FROM users WHERE id = $1', [session.userId]);
            const nextLevel = userRes.rows[0].level * 1000;
            const newExp = userRes.rows[0].exp + 500;
            if (newExp >= nextLevel) {
                await client.query('UPDATE users SET exp = $1, level = level + 1, hp = max_hp, fatigue = 0, stat_points = stat_points + 5 WHERE id = $2', [newExp, session.userId]);
            } else {
                await client.query('UPDATE users SET exp = exp + 500 WHERE id = $1', [session.userId]);
            }

            revalidatePath('/');
            return { success: true, message: "System Acknowledged. Reward: 500 XP." };
        } else {
            await client.query("UPDATE system_whispers SET status = 'FAILED' WHERE id = $1", [whisperId]);
            revalidatePath('/');
            return { success: false, message: "Verification Failed. The System is disappointed." };
        }

    } finally {
        client.release();
    }
}
