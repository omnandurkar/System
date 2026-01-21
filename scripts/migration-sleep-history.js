const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating recovery_logs table...');

        // Add columns for sleep tracking
        await client.query(`
            ALTER TABLE recovery_logs 
            ADD COLUMN IF NOT EXISTS bed_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS wake_time TIMESTAMP,
            ADD COLUMN IF NOT EXISTS dream_log TEXT,
            ADD COLUMN IF NOT EXISTS had_dream BOOLEAN DEFAULT FALSE;
        `);

        console.log('Migration complete.');
    } catch (e) {
        console.error('Migration error:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
