const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating recovery_logs table...');

        await client.query(`
      CREATE TABLE IF NOT EXISTS recovery_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        log_date DATE DEFAULT CURRENT_DATE,
        sleep_hours NUMERIC(3,1),
        soreness_level INTEGER,
        stress_level INTEGER,
        recovery_score INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, log_date)
      );
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
