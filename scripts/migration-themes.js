const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Migrating Themes ---');

        // 1. Create table user_purchases
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_purchases (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                item_id VARCHAR(50) NOT NULL,
                purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, item_id)
            );
        `);
        console.log('Created user_purchases table.');

        // 2. Add current_theme to users (check if exists first)
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='current_theme';
        `);

        if (res.rowCount === 0) {
            await client.query('ALTER TABLE users ADD COLUMN current_theme VARCHAR(50) DEFAULT NULL');
            console.log('Added current_theme column to users.');
        } else {
            console.log('current_theme column already exists.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
