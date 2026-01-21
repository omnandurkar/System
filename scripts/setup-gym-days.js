const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' }); // Try .env.local first
if (!process.env.DATABASE_URL) require('dotenv').config(); // Fallback

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating gym_days table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS gym_days (
        day_number INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT
      );
    `);

        // Seed default days if empty
        const res = await client.query('SELECT count(*) FROM gym_days');
        if (parseInt(res.rows[0].count) === 0) {
            console.log('Seeding default days...');
            const days = [
                { num: 1, name: 'MONDAY', desc: 'PUSH/LEGS' },
                { num: 2, name: 'TUESDAY', desc: 'PULL/COND' },
                { num: 3, name: 'WEDNESDAY', desc: 'FULL BODY' },
                { num: 4, name: 'THURSDAY', desc: 'SKILLS' },
                { num: 5, name: 'FRIDAY', desc: 'COMPOUND' },
                { num: 6, name: 'SATURDAY', desc: 'REST' },
                { num: 0, name: 'SUNDAY', desc: 'CARDIO' },
            ];

            for (const day of days) {
                await client.query(
                    'INSERT INTO gym_days (day_number, name, description) VALUES ($1, $2, $3)',
                    [day.num, day.name, day.desc]
                );
            }
        }

        console.log('Migration complete.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
