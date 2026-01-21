const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanup() {
    const client = await pool.connect();
    try {
        console.log('Cleaning up duplicate task completions...');

        // Remove duplicates, keeping the first one
        await client.query(`
            DELETE FROM task_completions a USING task_completions b
            WHERE a.id > b.id 
            AND a.daily_log_id = b.daily_log_id 
            AND a.task_id = b.task_id;
        `);

        console.log('Done.');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanup();
