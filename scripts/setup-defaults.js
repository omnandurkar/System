const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const USER_ID = 1;

async function setupDefaults() {
    console.log("Setting up Man Protocol OS Defaults while keeping RPG system intact...");

    try {
        // 1. Wipe existing routines to establish the strict baseline.
        await prisma.routine.deleteMany({
            where: { userId: USER_ID }
        });

        // ==========================================
        // MORNING (DISCIPLINE BUILDER) - Everyday
        // ==========================================
        const morning = await prisma.routine.create({
            data: {
                userId: USER_ID,
                name: 'MORNING (DISCIPLINE)',
                startTime: '06:15',
                endTime: '08:00',
                category: 'morning'
            }
        });

        await prisma.task.createMany({
            data: [
                { routineId: morning.id, title: 'Wake up (No phone 20m, Water, Make bed)', expValue: 50, daysMask: '1111111' },
                { routineId: morning.id, title: 'Morning Food', expValue: 20, daysMask: '1111111' },
                { routineId: morning.id, title: 'Light movement (Stretch OR 2x Squats/Pushups)', expValue: 30, daysMask: '1111111' },
                { routineId: morning.id, title: 'Get ready + pack bag', expValue: 20, daysMask: '1111111' },
                { routineId: morning.id, title: 'Leave flat', expValue: 10, daysMask: '1111111' }
            ]
        });

        // ==========================================
        // OFFICE HOURS - Weekdays Only (1111100)
        // ==========================================
        const office = await prisma.routine.create({
            data: {
                userId: USER_ID,
                name: 'OFFICE HOURS',
                startTime: '09:00',
                endTime: '17:00',
                category: 'work'
            }
        });

        await prisma.task.create({
            data: { routineId: office.id, title: 'Do job properly (No slacking/complaints)', expValue: 100, daysMask: '1111100' }
        });

        // ==========================================
        // EVENING (WHERE MEN ARE BUILT) - Gym/Boxing
        // Weekdays focus (1111100)
        // ==========================================
        const evening = await prisma.routine.create({
            data: {
                userId: USER_ID,
                name: 'EVENING (TRAINING)',
                startTime: '18:00',
                endTime: '20:30',
                category: 'evening'
            }
        });

        await prisma.task.createMany({
            data: [
                { routineId: evening.id, title: 'Gym (Weights Protocol)', expValue: 150, daysMask: '1111100' },
                { routineId: evening.id, title: 'Boxing (Skip, Shadow, Bag, Footwork)', expValue: 100, daysMask: '1111100' },
                { routineId: evening.id, title: 'Cool down + shower', expValue: 20, daysMask: '1111111' }
            ]
        });

        // ==========================================
        // NIGHT (CONTROLLED) - Everyday
        // ==========================================
        const night = await prisma.routine.create({
            data: {
                userId: USER_ID,
                name: 'NIGHT (CONTROLLED)',
                startTime: '21:00',
                endTime: '22:45',
                category: 'night'
            }
        });

        await prisma.task.createMany({
            data: [
                { routineId: night.id, title: 'Dinner (Veg System)', expValue: 20, daysMask: '1111111' },
                { routineId: night.id, title: 'Career Prep OR Investing', expValue: 80, daysMask: '1111111' },
                { routineId: night.id, title: 'Reading (Physical Book)', expValue: 40, daysMask: '1111111' }
            ]
        });

        // ==========================================
        // WEEKEND PROTOCOL - Weekends Only (0000011)
        // ==========================================
        const weekend = await prisma.routine.create({
            data: {
                userId: USER_ID,
                name: 'WEEKEND PROTOCOL',
                startTime: '09:00',
                endTime: '18:00',
                category: 'weekend_chores'
            }
        });

        await prisma.task.createMany({
            data: [
                { routineId: weekend.id, title: 'Room Cleaning & Laundry', expValue: 80, daysMask: '0000011' },
                { routineId: weekend.id, title: 'Weekly Planning (30 min)', expValue: 50, daysMask: '0000011' },
                { routineId: weekend.id, title: 'Meal Prep Basics', expValue: 60, daysMask: '0000011' },
                { routineId: weekend.id, title: 'Career Learning (2 hours)', expValue: 200, daysMask: '0000011' }
            ]
        });


        console.log("Defaults injected successfully.");

    } catch (e) {
        console.error("Injection failed:", e);
    } finally {
        await prisma.$disconnect();
    }
}

setupDefaults();
