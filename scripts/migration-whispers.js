const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Migrating System Whispers ---');

        await client.query(`
            CREATE TABLE IF NOT EXISTS system_whispers (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                type VARCHAR(50) NOT NULL,
                message TEXT NOT NULL,
                target_value VARCHAR(50),
                created_at DATE DEFAULT CURRENT_DATE,
                status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED
                UNIQUE(user_id, created_at)
            );
        `);
        console.log('Created system_whispers table.');

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
