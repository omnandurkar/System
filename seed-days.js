const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDays() {
    console.log("Seeding Gym Days...");

    const days = [
        { dayNumber: 1, name: 'Monday', description: 'Chest & Triceps' },
        { dayNumber: 2, name: 'Tuesday', description: 'Back & Biceps' },
        { dayNumber: 3, name: 'Wednesday', description: 'Legs & Core' },
        { dayNumber: 4, name: 'Thursday', description: 'Shoulders & Arms' },
        { dayNumber: 5, name: 'Friday', description: 'Full Body / Functional' },
        { dayNumber: 6, name: 'Saturday', description: 'Active Recovery' },
        { dayNumber: 0, name: 'Sunday', description: 'Rest' }
    ];

    for (const d of days) {
        await prisma.gymDay.upsert({
            where: { dayNumber: d.dayNumber },
            update: {},
            create: {
                dayNumber: d.dayNumber,
                name: d.name,
                description: d.description
            }
        });
    }

    console.log("Done!");
}

seedDays()
    .then(async () => await prisma.$disconnect())
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
