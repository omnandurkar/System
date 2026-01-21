const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Creating dungeon_breaks table...');

        // 1. Create table
        await client.query(`
            CREATE TABLE IF NOT EXISTS dungeon_breaks (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                description TEXT NOT NULL,
                xp_reward INTEGER NOT NULL DEFAULT 500,
                penalty_hp INTEGER NOT NULL DEFAULT 20,
                expires_at TIMESTAMP NOT NULL,
                status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add HP column to users if it doesn't exist (needed for penalty)
        console.log('Adding hp column to users table if missing...');
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS hp INTEGER DEFAULT 100,
            ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT 100;
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
