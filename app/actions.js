'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { BOSS_ROSTER } from '@/lib/game-constants';

export async function getUserStats() {
    const session = await getSession();
    if (!session) return null;

    try {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });

        const dungeonBreak = await prisma.dungeonBreak.findFirst({
            where: {
                userId: session.userId,
                status: 'ACTIVE',
                expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' }
        });

        const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const day = now.getDay();
        const isWeekend = day === 0 || day === 6;

        let bossRaid = { isActive: false };

        if (isWeekend) {
            const oneJan = new Date(now.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
            const weekNum = Math.ceil((now.getDay() + 1 + numberOfDays) / 7);
            const bossIndex = (weekNum - 1) % BOSS_ROSTER.length;
            bossRaid = { isActive: true, boss: BOSS_ROSTER[bossIndex] };
        }

        const penaltyRoutine = await prisma.routine.findFirst({
            where: { userId: session.userId, category: 'penalty' },
            select: { id: true }
        });
        let penaltyActive = !!penaltyRoutine;

        if (penaltyActive) {
            const tasksCheck = await prisma.task.findMany({
                where: { routineId: penaltyRoutine.id },
                include: {
                    taskCompletions: { orderBy: { completedAt: 'desc' }, take: 1 }
                }
            });
            const allDone = tasksCheck.every(t => {
                const target = t.targetValue || 1;
                const comp = t.taskCompletions[0];
                const progress = comp ? comp.progress : 0;
                return (comp && comp.completedAt) || (progress >= target);
            });
            if (allDone && tasksCheck.length > 0) penaltyActive = false;
        }

        return { ...user, dungeonBreak: dungeonBreak || null, bossRaid, penaltyActive };
    } catch (e) {
        console.error("Error getUserStats:", e);
        return null;
    }
}

export async function getTodayTasks() {
    const session = await getSession();
    if (!session) return [];

    try {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const todayDate = new Date(todayStr);

        let dailyLog = await prisma.dailyLog.findUnique({
            where: { userId_date: { userId: session.userId, date: todayDate } }
        });

        if (!dailyLog) {
            dailyLog = await prisma.dailyLog.create({
                data: { userId: session.userId, date: todayDate }
            });
            const u = await prisma.user.findUnique({ where: { id: session.userId }, select: { maxHp: true } });
            await prisma.user.update({
                where: { id: session.userId },
                data: { hp: u.maxHp, fatigue: 0 }
            });
        }
        const logId = dailyLog.id;

        // Penalty Check
        const jsDate = new Date();
        jsDate.setDate(jsDate.getDate() - 1);
        const yesterdayStr = jsDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const yesterdayDate = new Date(yesterdayStr);
        const userMeta = await prisma.user.findUnique({ where: { id: session.userId }, select: { createdAt: true } });

        if (new Date(yesterdayStr) > new Date(userMeta.createdAt)) {
            const yesterdayLog = await prisma.dailyLog.findUnique({
                where: { userId_date: { userId: session.userId, date: yesterdayDate } }
            });
            const failedYesterday = yesterdayLog ? (yesterdayLog.totalExpGained < 10) : true;

            if (failedYesterday) {
                const penaltyCheck = await prisma.routine.findFirst({ where: { userId: session.userId, category: 'penalty' } });
                if (!penaltyCheck) {
                    const r = await prisma.routine.create({
                        data: { userId: session.userId, name: '☠️ PENALTY ZONE', startTime: 'IMMEDIATE', endTime: 'DEATH', category: 'penalty' }
                    });
                    const PENALTY_ROSTER = [
                        { title: 'SURVIVAL: 50 Pushups', target: 50, unit: 'reps' },
                        { title: 'ESCAPE: Run 2km', target: 2, unit: 'km' },
                        { title: 'BOSS BATTLE: 100 Squats', target: 100, unit: 'reps' }
                    ];
                    const randomPenalty = PENALTY_ROSTER[Math.floor(Math.random() * PENALTY_ROSTER.length)];
                    await prisma.task.create({
                        data: { routineId: r.id, title: randomPenalty.title, expValue: 0, targetValue: randomPenalty.target, unit: randomPenalty.unit }
                    });
                }
            }
        }

        // Weekend Logic
        const todayNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayOfWeek = todayNow.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isWeekend) {
            const wkCheck = await prisma.routine.findFirst({ where: { userId: session.userId, category: 'weekend_chores' } });
            if (!wkCheck) {
                const r = await prisma.routine.create({
                    data: { userId: session.userId, name: 'WEEKEND OPS', startTime: '09:00', endTime: '12:00', category: 'weekend_chores' }
                });
                await prisma.task.createMany({
                    data: [
                        { routineId: r.id, title: 'Room Cleaning & Laundry', expValue: 50 },
                        { routineId: r.id, title: 'Grocery / Meal Prep', expValue: 30 },
                        { routineId: r.id, title: 'Social / Outing', expValue: 40 }
                    ]
                });
            }
            const brCheck = await prisma.routine.findFirst({ where: { userId: session.userId, category: 'boss_raid' } });
            if (!brCheck) {
                const r = await prisma.routine.create({
                    data: { userId: session.userId, name: '☠️ BOSS RAID CHALLENGE', startTime: 'ALL DAY', endTime: '23:59', category: 'boss_raid' }
                });
                await prisma.task.createMany({
                    data: [
                        { routineId: r.id, title: '100 Pushups', expValue: 150, targetValue: 100, unit: 'reps' },
                        { routineId: r.id, title: '5km Run / Walk', expValue: 200, targetValue: 5, unit: 'km' },
                        { routineId: r.id, title: '100 Squats', expValue: 150, targetValue: 100, unit: 'reps' },
                        { routineId: r.id, title: '200 Sit-ups', expValue: 180, targetValue: 200, unit: 'reps' }
                    ]
                });
            }
        }

        const routinesData = await prisma.routine.findMany({
            where: { userId: session.userId },
            include: {
                tasks: {
                    include: { taskCompletions: { where: { dailyLogId: logId } } },
                    orderBy: { id: 'asc' }
                }
            }
        });

        const routineOrder = { 'penalty': 0, 'morning': 1, 'work': 2, 'weekend_chores': 2, 'evening': 3, 'night': 4, 'boss_raid': 10 };
        const sortedRoutines = routinesData.filter(r => isWeekend && r.category === 'work' ? false : true)
            .sort((a, b) => (routineOrder[a.category] || 5) - (routineOrder[b.category] || 5));

        return sortedRoutines.map(r => {
            let filteredTasks = r.tasks;
            if (isWeekend) {
                filteredTasks = filteredTasks.filter(t => {
                    const titleUpper = t.title.toUpperCase();
                    return !(titleUpper.includes('GYM') || titleUpper.includes('BOXING'));
                });
            }
            return {
                id: r.id, name: r.name, time: `${r.startTime} - ${r.endTime}`, category: r.category,
                tasks: filteredTasks.map(t => {
                    const comp = t.taskCompletions[0];
                    return {
                        id: t.id, title: t.title, exp: t.expValue,
                        completed: !!(comp && comp.completedAt),
                        isGym: t.title.toLowerCase().includes('gym') || t.title.toLowerCase().includes('boxing'),
                        target: t.targetValue || 1, unit: t.unit, progress: comp ? comp.progress : 0
                    };
                })
            };
        });
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function _awardTaskCompletion(tx, userId, taskId, logId) {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    const expGained = task.expValue || 0;
    const user = await tx.user.findUnique({ where: { id: userId } });
    const { level, exp, gold, fatigue, maxFatigue } = user;

    const newExp = exp + expGained;
    const nextLevelThreshold = level * 1000;
    const goldGained = Math.floor(newExp / 100) - Math.floor(exp / 100);
    const newGold = gold + goldGained;

    let finalLevel = level;
    let leveledUp = false;
    if (newExp >= nextLevelThreshold) { finalLevel++; leveledUp = true; }

    if (leveledUp) {
        await tx.user.update({
            where: { id: userId },
            data: { level: finalLevel, exp: newExp, gold: newGold, fatigue: 0, hp: user.maxHp, statPoints: { increment: 5 } }
        });
    } else {
        await tx.user.update({
            where: { id: userId },
            data: {
                level: finalLevel, exp: newExp, gold: newGold,
                fatigue: Math.min(maxFatigue, fatigue + 10),
                hp: Math.max(0, user.hp - (fatigue >= 90 ? 5 : 0))
            }
        });
    }
    await tx.dailyLog.update({ where: { id: logId }, data: { totalExpGained: { increment: expGained } } });
    return { success: true, leveledUp, newLevel: finalLevel };
}

async function _revertTaskCompletion(tx, userId, taskId, logId) {
    const task = await tx.task.findUnique({ where: { id: taskId } });
    const expValue = task.expValue || 0;
    const user = await tx.user.findUnique({ where: { id: userId } });
    const newExp = user.exp - expValue;
    const goldLost = Math.floor(user.exp / 100) - Math.floor(newExp / 100);

    await tx.user.update({
        where: { id: userId },
        data: { exp: newExp, gold: Math.max(0, user.gold - goldLost), fatigue: Math.max(0, user.fatigue - 10) }
    });
    await tx.dailyLog.update({ where: { id: logId }, data: { totalExpGained: { decrement: expValue } } });
    return { success: true };
}

async function checkAchievements(tx, userId) {
    const newUnlocks = [];

    // 1. IRON BODY
    const gymCount = await tx.taskCompletion.count({
        where: {
            task: {
                OR: [
                    { title: { contains: 'Gym', mode: 'insensitive' } },
                    { title: { contains: 'Workout', mode: 'insensitive' } },
                    { title: { contains: 'Pushup', mode: 'insensitive' } },
                    { title: { contains: 'Squat', mode: 'insensitive' } }
                ]
            },
            completedAt: { not: null },
            dailyLog: { userId: userId }
        }
    });
    if (gymCount >= 50) {
        const t1 = await tx.userTitle.upsert({
            where: { userId_titleId: { userId, titleId: 'Iron Body' } },
            create: { userId, titleId: 'Iron Body' },
            update: {}
        });
        if (t1) newUnlocks.push('Iron Body');
    }

    // 2. SCHOLAR
    const studyCount = await tx.taskCompletion.count({
        where: {
            task: {
                OR: [
                    { title: { contains: 'Read', mode: 'insensitive' } },
                    { title: { contains: 'Study', mode: 'insensitive' } },
                    { title: { contains: 'Deep Work', mode: 'insensitive' } }
                ]
            },
            completedAt: { not: null },
            dailyLog: { userId: userId }
        }
    });
    if (studyCount >= 20) {
        const t2 = await tx.userTitle.upsert({
            where: { userId_titleId: { userId, titleId: 'Scholar' } },
            create: { userId, titleId: 'Scholar' },
            update: {}
        });
        if (t2) newUnlocks.push('Scholar');
    }

    // 3. EARLY BIRD ( completed time < 6 AM )
    // Ensure we count things validly via Prisma raw since we need timezone extraction
    const earlyCountResult = await tx.$queryRaw`
        SELECT COUNT(*) as count FROM task_completions tc
        JOIN daily_logs dl ON tc.daily_log_id = dl.id
        WHERE dl.user_id = ${userId}
        AND EXTRACT(HOUR FROM tc.completed_at AT TIME ZONE 'Asia/Kolkata') < 6
    `;
    const earlyCount = Number(earlyCountResult[0]?.count || 0);
    if (earlyCount >= 7) {
        const t3 = await tx.userTitle.upsert({
            where: { userId_titleId: { userId, titleId: 'The Early Bird' } },
            create: { userId, titleId: 'The Early Bird' },
            update: {}
        });
        if (t3) newUnlocks.push('The Early Bird');
    }

    return newUnlocks;
}

export async function toggleTask(taskId, completed) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            const todayDate = new Date(todayStr);
            let dailyLog = await tx.dailyLog.findUnique({ where: { userId_date: { userId: session.userId, date: todayDate } } });
            if (!dailyLog) dailyLog = await tx.dailyLog.create({ data: { userId: session.userId, date: todayDate } });
            const logId = dailyLog.id;

            let res = { success: true, leveledUp: false, newLevel: null };
            if (completed) {
                const existing = await tx.taskCompletion.findFirst({ where: { dailyLogId: logId, taskId: taskId } });
                if (!existing) {
                    await tx.taskCompletion.create({ data: { dailyLogId: logId, taskId: taskId, completedAt: new Date(), progress: 100 } });
                    res = await _awardTaskCompletion(tx, session.userId, taskId, logId);
                    await checkAchievements(tx, session.userId);
                }
            } else {
                const existing = await tx.taskCompletion.findFirst({ where: { dailyLogId: logId, taskId: taskId } });
                if (existing) {
                    await tx.taskCompletion.delete({ where: { id: existing.id } });
                    await _revertTaskCompletion(tx, session.userId, taskId, logId);
                }
            }
            return res;
        });
        revalidatePath('/');
        return result;
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function updateTaskProgress(taskId, progress) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const result = await prisma.$transaction(async (tx) => {
            const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
            const todayDate = new Date(todayStr);
            const dailyLog = await tx.dailyLog.findUnique({ where: { userId_date: { userId: session.userId, date: todayDate } } });
            const logId = dailyLog.id;

            const task = await tx.task.findUnique({ where: { id: taskId } });
            const target = task.targetValue || 1;
            let comp = await tx.taskCompletion.findFirst({ where: { dailyLogId: logId, taskId: taskId } });
            const wasCompleted = comp && comp.completedAt;

            if (comp) comp = await tx.taskCompletion.update({ where: { id: comp.id }, data: { progress } });
            else comp = await tx.taskCompletion.create({ data: { dailyLogId: logId, taskId, progress } });

            const isNowCompleted = progress >= target;
            let res = { success: true };

            if (isNowCompleted && !wasCompleted) {
                await tx.taskCompletion.update({ where: { id: comp.id }, data: { completedAt: new Date() } });
                res = await _awardTaskCompletion(tx, session.userId, taskId, logId);
            } else if (!isNowCompleted && wasCompleted) {
                await tx.taskCompletion.update({ where: { id: comp.id }, data: { completedAt: null } });
                await _revertTaskCompletion(tx, session.userId, taskId, logId);
            }
            return res;
        });
        revalidatePath('/');
        return result;
    } catch (e) {
        return { success: false };
    }
}

export async function allocateStat(stat) {
    const session = await getSession();
    if (!session) return { success: false };
    const validStats = ['strength', 'intelligence', 'vitality'];
    if (!validStats.includes(stat)) return { success: false };

    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: session.userId } });
            if (user.statPoints <= 0) throw new Error("No points");
            await tx.user.update({ where: { id: session.userId }, data: { [stat]: { increment: 1 }, statPoints: { decrement: 1 } } });
            if (stat === 'vitality') {
                const u = await tx.user.findUnique({ where: { id: session.userId } });
                if (u.vitality >= 20 && u.maxFatigue === 100) await tx.user.update({ where: { id: session.userId }, data: { maxFatigue: 150 } });
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

export async function addXP(amount) {
    const session = await getSession();
    if (!session) return;
    try {
        await prisma.$transaction(async (tx) => {
            // Logic mirrors awardTaskCompletion mostly but simplified
            const user = await tx.user.findUnique({ where: { id: session.userId } });
            // ... simplified
            await tx.user.update({ where: { id: session.userId }, data: { exp: { increment: amount } } });
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) { console.error(e); }
}

export async function purchaseItem(cost, itemId) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: session.userId } });
            if (user.gold < cost) throw new Error("Insufficient Gold");
            await tx.user.update({ where: { id: session.userId }, data: { gold: { decrement: cost } } });

            if (itemId) {
                await tx.userPurchase.upsert({
                    where: { userId_itemId: { userId: session.userId, itemId } },
                    create: { userId: session.userId, itemId },
                    update: {}
                });
            }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, message: e.message };
    }
}

export async function getUnlockedItems() {
    const session = await getSession();
    if (!session) return [];

    try {
        const purchases = await prisma.userPurchase.findMany({
            where: { userId: session.userId },
            select: { itemId: true }
        });
        return purchases.map(p => p.itemId);
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function equipTheme(themeId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        if (themeId) {
            const check = await prisma.userPurchase.findUnique({
                where: { userId_itemId: { userId: session.userId, itemId: themeId } }
            });
            if (!check) return { success: false, message: "Theme not owned" };
        }

        await prisma.user.update({
            where: { id: session.userId },
            data: { currentTheme: themeId || null }
        });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function checkForDungeonBreak() {
    const session = await getSession();
    if (!session) return null;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(todayStr); // Approx date match

    // We need to check created_at date part. Prisma Filter:
    const start = new Date(todayStr);
    const end = new Date(todayStr); end.setDate(end.getDate() + 1);

    try {
        const existing = await prisma.dungeonBreak.findFirst({
            where: {
                userId: session.userId,
                createdAt: { gte: start, lt: end }
            }
        });
        if (existing) return null;
        if (Math.random() > 0.2) return null;

        const POOL = [
            { desc: "SURVIVE: Do 50 Pushups in 30 Minutes", xp: 1000, penalty: 20 },
            { desc: "ESCAPE: Run 2km ASAP", xp: 1200, penalty: 25 },
            { desc: "MANA OVERLOAD: Meditate for 10 Minutes", xp: 800, penalty: 10 }
        ];
        const event = POOL[Math.floor(Math.random() * POOL.length)];
        const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

        const newBreak = await prisma.dungeonBreak.create({
            data: {
                userId: session.userId,
                description: event.desc,
                xpReward: event.xp,
                penaltyHp: event.penalty,
                expiresAt: expiresAt
            }
        });
        return newBreak;
    } catch (e) { return null; }
}

export async function completeDungeonBreak(breakId) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        const db = await prisma.dungeonBreak.findFirst({ where: { id: breakId, userId: session.userId, status: 'ACTIVE' } });
        if (!db) return { success: false };
        await addXP(db.xpReward);
        await prisma.dungeonBreak.update({ where: { id: breakId }, data: { status: 'COMPLETED' } });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function failDungeonBreak(breakId) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        const db = await prisma.dungeonBreak.findFirst({ where: { id: breakId, userId: session.userId, status: 'ACTIVE' } });
        if (!db) return { success: false };
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        await prisma.user.update({ where: { id: session.userId }, data: { hp: Math.max(0, user.hp - db.penaltyHp) } });
        await prisma.dungeonBreak.update({ where: { id: breakId }, data: { status: 'FAILED' } });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function recoverFatigue() {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        const user = await prisma.user.findUnique({ where: { id: session.userId } });
        await prisma.user.update({ where: { id: session.userId }, data: { fatigue: Math.max(0, user.fatigue - 10) } });
        revalidatePath('/');
        return { success: true };
    } catch (e) { return { success: false }; }
}

export async function getTitles() {
    const session = await getSession();
    if (!session) return [];
    return await prisma.userTitle.findMany({ where: { userId: session.userId } });
}

export async function equipTitle(titleId) {
    const session = await getSession();
    if (!session) return { success: false };
    // Check unlock
    if (titleId) {
        const hasTitle = await prisma.userTitle.findUnique({ where: { userId_titleId: { userId: session.userId, titleId } } });
        if (!hasTitle) return { success: false, message: 'Locked' };
    }
    await prisma.user.update({ where: { id: session.userId }, data: { currentTitle: titleId || null } });
    revalidatePath('/');
    return { success: true };
}

export async function awardMysteryBox() {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        return await prisma.$transaction(async (tx) => {
            const roll = Math.random();
            let reward = { type: 'gold', amount: 0, msg: '' };
            if (roll < 0.5) {
                reward.amount = Math.floor(Math.random() * 100) + 50;
                reward.msg = `${reward.amount} Gold`;
                await tx.user.update({ where: { id: session.userId }, data: { gold: { increment: reward.amount } } });
            } else if (roll < 0.8) {
                reward.type = 'xp';
                reward.amount = Math.floor(Math.random() * 300) + 200;
                reward.msg = `${reward.amount} XP`;
                await tx.user.update({ where: { id: session.userId }, data: { exp: { increment: reward.amount } } });
                // Check level up omitted for brevity in mystery box
            } else if (roll < 0.95) {
                reward.type = 'fatigue';
                reward.msg = "Fatigue Healed (-20)";
                const u = await tx.user.findUnique({ where: { id: session.userId } });
                await tx.user.update({ where: { id: session.userId }, data: { fatigue: Math.max(0, u.fatigue - 20) } });
            } else {
                reward.type = 'stat';
                reward.msg = "+1 Stat Point";
                await tx.user.update({ where: { id: session.userId }, data: { statPoints: { increment: 1 } } });
            }
            return { success: true, rewardType: reward.type, amount: reward.amount, message: reward.msg };
        });
    } catch (e) { return { success: false }; }
}

export async function checkSystemWhisper() {
    const session = await getSession();
    if (!session) return null;
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const today = new Date(todayStr); // Match prisma date

    // Check existing
    const existing = await prisma.systemWhisper.findUnique({ where: { userId_createdAt: { userId: session.userId, createdAt: today } } });
    if (existing) return existing;

    if (Math.random() > 0.7) {
        const types = [
            { type: 'WAKE_EARLY', msg: "The System requires you to wake before 05:00.", target: '05:00' },
            { type: 'SHADOW_WORK', msg: "Can you do 50 pushups in one set? Prove it.", target: '50' }
        ];
        const whisper = types[Math.floor(Math.random() * types.length)];
        return await prisma.systemWhisper.create({
            data: { userId: session.userId, type: whisper.type, message: whisper.msg, targetValue: whisper.target, createdAt: today }
        });
    }
    return null;
}

export async function dismissWhisper(id) {
    const session = await getSession();
    if (!session) return { success: false };
    await prisma.systemWhisper.update({ where: { id: parseInt(id) }, data: { status: 'SKIPPED' } });
    revalidatePath('/');
    return { success: true };
}

export async function verifyWhisper(id, input) {
    const session = await getSession();
    if (!session) return { success: false };
    const w = await prisma.systemWhisper.findUnique({ where: { id: parseInt(id) } });
    if (!w || w.status !== 'ACTIVE') return { success: false };

    let success = false;
    // ... verification logic ...
    // Simplified: correct input always true for now or match target comparison
    if (w.type === 'WAKE_EARLY' && input <= w.targetValue) success = true;
    if (w.type === 'SHADOW_WORK' && parseInt(input) >= parseInt(w.targetValue)) success = true;

    if (success) {
        await prisma.systemWhisper.update({ where: { id: parseInt(id) }, data: { status: 'COMPLETED' } });
        await prisma.user.update({ where: { id: session.userId }, data: { exp: { increment: 500 } } });
        revalidatePath('/');
        return { success: true, message: "System Acknowledged." };
    } else {
        await prisma.systemWhisper.update({ where: { id: parseInt(id) }, data: { status: 'FAILED' } });
        revalidatePath('/');
        return { success: false };
    }
}
