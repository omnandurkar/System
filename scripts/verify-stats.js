const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verifyStats() {
    const client = await pool.connect();
    try {
        console.log('--- VERIFYING STATS ---');

        // 1. Check Columns
        const res = await client.query("SELECT strength, intelligence, vitality, stat_points FROM users LIMIT 1");
        console.log('User Stats Row:', res.rows[0]);

        if (res.rows[0].stat_points === null) {
            console.warn('WARNING: stat_points is null, should be 0 or dynamic.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

verifyStats();
