const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function forceSeed() {
    const client = await pool.connect();
    try {
        console.log('Force Seeding Boxing Drills...');

        // We need to fetch the day_number for today to ensure they show up TODAY
        const dayOfWeek = new Date().getDay();
        let dayNum = (dayOfWeek >= 1 && dayOfWeek <= 5) ? dayOfWeek : 0;

        console.log(`Targeting Day Number: ${dayNum}`);

        const boxingDrills = [
            { name: 'Skipping', sets: '10 mins' },
            { name: 'Shadow Boxing', sets: '4 rounds' },
            { name: 'Bag Work', sets: '4 rounds' },
            { name: 'Footwork Drills', sets: '15 mins' }
        ];

        for (const drill of boxingDrills) {
            // Delete existing valid entries for this day/name/category to avoid duplicates before inserting
            await client.query(`
            DELETE FROM gym_exercises 
            WHERE exercise_name = $1 AND category = 'BOXING' AND day_number = $2
        `, [drill.name, dayNum]);

            // Insert fresh
            await client.query(`
            INSERT INTO gym_exercises (exercise_name, sets_reps, day_number, category)
            VALUES ($1, $2, $3, 'BOXING')
        `, [drill.name, drill.sets, dayNum]);

            console.log(`Inserted ${drill.name} for Day ${dayNum}`);
        }

        console.log('Force Seed Complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

forceSeed();
