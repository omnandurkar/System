const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function cleanupDuplicates() {
    const client = await pool.connect();
    try {
        console.log('--- CLEANING DUPLICATES ---');

        // 1. Get IDs to Keep (Min ID for each category)
        const keepRes = await client.query(`
            SELECT MIN(id) as keep_id, category 
            FROM routines 
            WHERE category IN ('weekend_chores', 'boss_raid')
            GROUP BY category
        `);

        const keepIds = keepRes.rows.map(r => r.keep_id);
        console.log('Keeping Routine IDs:', keepIds);

        if (keepIds.length === 0) {
            console.log("No routines found to clean.");
            return;
        }

        // 2. Delete the rest
        const delRes = await client.query(`
            DELETE FROM routines 
            WHERE category IN ('weekend_chores', 'boss_raid')
            AND id NOT IN (${keepIds.join(',')})
            RETURNING id, name
        `);

        console.log(`Deleted ${delRes.rowCount} duplicate routines:`, delRes.rows);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

cleanupDuplicates();
