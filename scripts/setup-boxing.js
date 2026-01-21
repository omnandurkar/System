const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding category column to gym_exercises...');

        // 1. Add column
        await client.query(`
      ALTER TABLE gym_exercises 
      ADD COLUMN IF NOT EXISTS category VARCHAR(20) DEFAULT 'WEIGHTS';
    `);

        // 2. Seed Boxing Drills (Upsert based on name to avoid dups)
        // We'll add them to Day 0 (Sunday) initially or just ensure they exist.
        // Actually, let's just make sure they exist and assign them to ALL days? 
        // Or better, let's assign them to Day 0 for now as a default place.
        // The user wants them synced.

        const boxingDrills = [
            { name: 'Skipping', sets: '10 mins' },
            { name: 'Shadow Boxing', sets: '4 rounds' },
            { name: 'Bag Work', sets: '4 rounds' },
            { name: 'Footwork Drills', sets: '15 mins' }
        ];

        // Check if they exist, if not insert.
        for (const drill of boxingDrills) {
            // We'll add to Day 0 (Sunday/Cardio) as a placeholder. 
            // User can move them later.
            const res = await client.query('SELECT id FROM gym_exercises WHERE exercise_name = $1', [drill.name]);
            if (res.rows.length === 0) {
                console.log(`Seeding ${drill.name}...`);
                await client.query(`
                INSERT INTO gym_exercises (exercise_name, sets_reps, day_number, category)
                VALUES ($1, $2, $3, 'BOXING')
            `, [drill.name, drill.sets, 0]);
            } else {
                // Update category if existing
                await client.query(`
                UPDATE gym_exercises SET category = 'BOXING' WHERE exercise_name = $1
            `, [drill.name]);
            }
        }

        // Ensure "Weight" exercises are marked as WEIGHTS
        await client.query(`
        UPDATE gym_exercises SET category = 'WEIGHTS' WHERE category IS NULL OR category = '';
    `);

        console.log('Migration complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
