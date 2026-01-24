const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Migrating database for Task Progress...');

        // 1. Add target_value and unit to tasks
        await client.query(`
            ALTER TABLE tasks 
            ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 1,
            ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT NULL;
        `);
        console.log('Added target_value and unit to tasks.');

        // 2. Add progress to task_completions
        await client.query(`
            ALTER TABLE task_completions 
            ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;
        `);
        console.log('Added progress to task_completions.');

        console.log('Migration Complete.');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
