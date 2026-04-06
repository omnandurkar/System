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
                    orderBy: [
                        { orderIndex: 'asc' },
                        { id: 'asc' }
                    ]
                }
            },
            orderBy: [
                { orderIndex: 'asc' },
                { id: 'asc' }
            ]
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
                    description: t.description,
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

export async function updateTask(taskId, title, exp, daysMask, description) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const taskCheck = await prisma.task.findFirst({
            where: {
                id: taskId,
                routine: { userId: session.userId }
            }
        });

        if (!taskCheck) return { success: false, error: 'Unauthorized' };

        await prisma.task.update({
            where: { id: taskId },
            data: { title, expValue: exp, daysMask, description }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function addTask(routineId, title, exp, daysMask, description) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const routineCheck = await prisma.routine.findFirst({
            where: { id: routineId, userId: session.userId }
        });

        if (!routineCheck) return { success: false, error: 'Unauthorized' };

        await prisma.task.create({
            data: { routineId, title, expValue: exp, daysMask, description }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function deleteTask(taskId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const taskCheck = await prisma.task.findFirst({
            where: { id: taskId, routine: { userId: session.userId } }
        });

        if (!taskCheck) return { success: false, error: 'Unauthorized' };

        // Wipe associated logs/completions first to avoid foreign key constraints
        await prisma.taskCompletion.deleteMany({
            where: { taskId }
        });

        await prisma.task.delete({
            where: { id: taskId }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function updateTaskOrder(orderedIds) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.task.update({
                    where: { id: id },
                    data: { orderIndex: index }
                })
            )
        );

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function addRoutine(name, startTime, endTime) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.routine.create({
            data: {
                userId: session.userId,
                name: name,
                startTime: startTime,
                endTime: endTime,
                category: 'custom'
            }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}
export async function updateRoutine(routineId, name, startTime, endTime) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.routine.update({
            where: { id: routineId, userId: session.userId },
            data: { name, startTime, endTime }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function deleteRoutine(routineId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.routine.delete({
            where: { id: routineId, userId: session.userId }
        });

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function updateRoutineOrder(orderedIds) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.$transaction(
            orderedIds.map((id, index) =>
                prisma.routine.update({
                    where: { id: id, userId: session.userId },
                    data: { orderIndex: index }
                })
            )
        );

        revalidatePath('/');
        revalidatePath('/admin');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}
