'use server';

import prisma from '@/lib/db';
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

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    const bedTimestamp = new Date(`${dateStr} ${bedTime}:00`);
    const wakeTimestamp = new Date(`${dateStr} ${wakeTime}:00`);

    const today = new Date(dateStr);

    try {
        await prisma.recoveryLog.upsert({
            where: {
                userId_logDate: {
                    userId: session.userId,
                    logDate: today
                }
            },
            update: {
                sleepHours: safeSleep,
                sorenessLevel: safeSoreness,
                stressLevel: safeStress,
                recoveryScore: totalScore,
                bedTime: bedTimestamp,
                wakeTime: wakeTimestamp,
                hadDream: hadDream,
                dreamLog: dreamLog
            },
            create: {
                userId: session.userId,
                logDate: today,
                sleepHours: safeSleep,
                sorenessLevel: safeSoreness,
                stressLevel: safeStress,
                recoveryScore: totalScore,
                bedTime: bedTimestamp,
                wakeTime: wakeTimestamp,
                hadDream: hadDream,
                dreamLog: dreamLog
            }
        });

        if (totalScore >= 80) {
            await addXP(50);
        } else if (totalScore >= 50) {
            await addXP(20);
        }

        revalidatePath('/recovery');
        return { success: true, score: totalScore };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function getTodayRecovery() {
    const session = await getSession();
    if (!session) return null;

    try {
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const today = new Date(todayStr);

        const res = await prisma.recoveryLog.findUnique({
            where: {
                userId_logDate: {
                    userId: session.userId,
                    logDate: today
                }
            }
        });
        return res;
    } catch (e) {
        console.error(e);
        return null;
    }
}
