const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding database...");

    // Hash password
    const hashedPassword = await bcrypt.hash('admin', 10);

    // Upsert admin user
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: hashedPassword,
            level: 1,
            exp: 0,
            hp: 100,
            maxHp: 100,
            fatigue: 0,
            maxFatigue: 100,
            gold: 500
        },
    });

    console.log("Done! Admin user:", admin.username);
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    });
