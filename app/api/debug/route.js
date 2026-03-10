
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const results = {};

        // 1. Check Timezone
        const now = new Date();
        results.serverTime = now.toString();
        results.isoTime = now.toISOString();

        // 2. Check for Boxing Tasks in `tasks` table
        const boxingTasks = await prisma.task.findMany({
            where: { title: { contains: 'Boxing', mode: 'insensitive' } }
        });
        results.boxingTasksRaw = boxingTasks;

        // 3. Check for Gym Exercises
        const boxingExercises = await prisma.gymExercise.findMany({
            where: { category: 'BOXING' }
        });
        results.boxingExercises = boxingExercises;

        // 4. Update Schedule (Mon-Fri)
        results.message = "Updating Boxing Schedule to Mon-Fri...";

        const boxingDrills = [
            { name: 'Skipping', sets: '10 mins' },
            { name: 'Shadow Boxing', sets: '4 rounds' },
            { name: 'Bag Work', sets: '4 rounds' },
            { name: 'Footwork Drills', sets: '15 mins' }
        ];

        // Delete existing boxing drills (and their logs via Cascade if configured, otherwise manual)
        const ids = boxingExercises.map(e => e.id);

        if (ids.length > 0) {
            await prisma.gymLog.deleteMany({
                where: { exerciseId: { in: ids } }
            });
            await prisma.gymExercise.deleteMany({
                where: { id: { in: ids } }
            });
        }

        // Insert for Days 1 (Mon) to 5 (Fri)
        const days = [1, 2, 3, 4, 5];

        for (const day of days) {
            for (const drill of boxingDrills) {
                await prisma.gymExercise.create({
                    data: {
                        exerciseName: drill.name,
                        setsReps: drill.sets,
                        dayNumber: day,
                        category: 'BOXING'
                    }
                });
            }
        }

        results.updated = true;
        results.schedule = "Mon-Fri";

        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
