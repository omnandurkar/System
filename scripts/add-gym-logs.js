const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating gym_logs table...');

        await client.query(`
            CREATE TABLE IF NOT EXISTS gym_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                exercise_id INTEGER REFERENCES gym_exercises(id),
                log_date DATE DEFAULT CURRENT_DATE,
                completed BOOLEAN DEFAULT FALSE,
                UNIQUE(user_id, exercise_id, log_date)
            );
        `);

        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
