'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { toggleTask } from '@/app/actions';

export async function getTodaysWorkout() {
    const session = await getSession();
    if (!session) return { type: 'REST', dayName: 'Login Required' };

    try {
        const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
        const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...

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
            const exercises = await prisma.$queryRaw`
        SELECT ge.*, 
               COALESCE(gl.completed, FALSE) as "isCompleted"
        FROM gym_exercises ge
        LEFT JOIN gym_logs gl ON gl.exercise_id = ge.id 
                              AND gl.user_id = ${session.userId}
                              AND gl.log_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
        WHERE ge.day_number = ${dayNum}
        ORDER BY ge.id ASC
      `;

            const dayInfo = await prisma.gymDay.findUnique({
                where: { dayNumber: dayNum }
            });

            return {
                type: 'LIFT',
                exercises: exercises, // Prisma returns array of objects, similar to rows
                dayName: dayInfo ? `${dayInfo.name} (${dayInfo.description})` : 'Workout'
            };
        } else if (dayType === 'REST') {
            return { type: 'REST', dayName: 'Active Recovery' };
        } else {
            return { type: 'CARDIO', dayName: 'Cardio + Stretching' };
        }

    } catch (error) {
        console.error("Error fetching workout:", error);
        throw error;
    }
}

export async function toggleGymExercise(exerciseId, completed) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Get Exercise Info
            const exercise = await tx.gymExercise.findUnique({
                where: { id: exerciseId },
                select: { dayNumber: true, category: true }
            });

            if (!exercise) throw new Error("Exercise not found");
            const category = exercise.category || 'WEIGHTS';

            // 2. Upsert Log
            await tx.$executeRaw`
                INSERT INTO gym_logs (user_id, exercise_id, log_date, completed)
                VALUES (${session.userId}, ${exerciseId}, (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date, ${completed})
                ON CONFLICT (user_id, exercise_id, log_date)
                DO UPDATE SET completed = ${completed}
            `;

            // 3. Check Pending
            const targetDayNum = exercise.dayNumber;

            const pendingRes = await tx.$queryRaw`
                SELECT count(*) as pending
                FROM gym_exercises ge
                LEFT JOIN gym_logs gl ON gl.exercise_id = ge.id 
                                      AND gl.user_id = ${session.userId}
                                      AND gl.log_date = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')::date
                WHERE ge.day_number = ${targetDayNum}
                AND (ge.category = ${category} OR (ge.category IS NULL AND ${category} = 'WEIGHTS'))
                AND (gl.completed IS NULL OR gl.completed = FALSE)
            `;

            const pendingCount = Number(pendingRes[0].pending);
            const isAllDone = pendingCount === 0;

            // 4. Find Dashboard Task
            let searchTerm = category === 'BOXING' ? 'Boxing' : 'Gym';
            if (category === 'WEIGHTS') searchTerm = 'Gym';

            const tasks = await tx.task.findMany({
                where: {
                    routine: { userId: session.userId },
                    title: { contains: searchTerm, mode: 'insensitive' }
                },
                orderBy: { id: 'desc' },
                take: 1
            });

            if (tasks.length > 0) {
                const taskId = tasks[0].id;
                if (isAllDone) {
                    await toggleTask(taskId, true);
                } else if (!completed) {
                    await toggleTask(taskId, false);
                }
            }
        });

        revalidatePath('/gym');
        revalidatePath('/');
    } catch (e) {
        console.error(e);
        throw e;
    }
}

export async function createExercise(data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await prisma.gymExercise.create({
        data: {
            exerciseName: data.name,
            setsReps: data.sets_reps,
            dayNumber: parseInt(data.day_number),
            category: data.category || 'WEIGHTS'
        }
    });

    revalidatePath('/gym');
    revalidatePath('/admin');
}

export async function updateExercise(id, data) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await prisma.gymExercise.update({
        where: { id: parseInt(id) },
        data: {
            exerciseName: data.name,
            setsReps: data.sets_reps,
            dayNumber: parseInt(data.day_number),
            category: data.category
        }
    });

    revalidatePath('/gym');
    revalidatePath('/admin');
}

export async function deleteExercise(id) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await prisma.gymExercise.delete({
        where: { id: parseInt(id) }
    });

    revalidatePath('/gym');
    revalidatePath('/admin');
}

export async function getAllExercises() {
    const exercises = await prisma.gymExercise.findMany({
        orderBy: [
            { dayNumber: 'asc' },
            { id: 'asc' }
        ]
    });
    return exercises;
}

export async function getAllDays() {
    const days = await prisma.gymDay.findMany({
        orderBy: { dayNumber: 'asc' }
    });
    return days;
}

export async function updateDayInfo(dayNum, name, description) {
    const session = await getSession();
    if (!session) throw new Error('Unauthorized');

    await prisma.gymDay.update({
        where: { dayNumber: parseInt(dayNum) },
        data: { name, description }
    });

    revalidatePath('/gym');
    revalidatePath('/admin');
}
