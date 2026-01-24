const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Migrating Titles ---');

        // 1. Create table user_titles
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_titles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                title_id VARCHAR(50) NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, title_id)
            );
        `);
        console.log('Created user_titles table.');

        // 2. Add current_title to users
        // Check if exists first
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='current_title';
        `);

        if (res.rowCount === 0) {
            await client.query('ALTER TABLE users ADD COLUMN current_title VARCHAR(50)');
            console.log('Added current_title column to users.');
        } else {
            console.log('current_title column already exists.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
