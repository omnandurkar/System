'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getAllRoutinesAndTasks() {
    const session = await getSession();
    if (!session) return [];

    try {
        const routines = await prisma.routine.findMany({
            where: { userId: session.userId },
            include: {
                tasks: {
                    orderBy: { id: 'asc' }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        const DAY_MAP = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        const data = routines.map(r => {
            const tasksList = r.tasks.map(t => {
                let days = [];
                if (t.daysMask && t.daysMask.length === 7) {
                    days = t.daysMask.split('').map((char, index) => {
                        return char === '1' ? DAY_MAP[index] : null;
                    }).filter(Boolean);
                } else {
                    days = DAY_MAP;
                }

                return {
                    id: t.id,
                    title: t.title,
                    exp: t.expValue,
                    repeatDays: days
                };
            });

            return {
                id: r.id,
                name: r.name,
                time: `${r.startTime} - ${r.endTime}`,
                tasks: tasksList
            };
        });

        return data;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function updateTask(taskId, title, exp) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const taskCheck = await prisma.task.findFirst({
            where: {
                id: taskId,
                routine: {
                    userId: session.userId
                }
            }
        });

        if (!taskCheck) {
            return { success: false, error: 'Unauthorized' };
        }

        await prisma.task.update({
            where: { id: taskId },
            data: { title, expValue: exp }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}
