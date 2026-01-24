const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating database for Stats...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS strength INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS intelligence INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS vitality INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS stat_points INTEGER DEFAULT 0;
        `);

        console.log('Added stats columns.');

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
