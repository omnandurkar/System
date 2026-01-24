const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkDuplicates() {
    const client = await pool.connect();
    try {
        console.log('--- CHECKING DUPLICATES ---');

        const res = await client.query(`
            SELECT id, name, category, created_at 
            FROM routines 
            WHERE category IN ('weekend_chores', 'boss_raid')
        `);

        console.log('Found Routines:', res.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

checkDuplicates();
