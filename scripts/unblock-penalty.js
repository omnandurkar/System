const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function unblock() {
    const client = await pool.connect();
    try {
        console.log('--- UNBLOCKING PENALTY ---');

        // Find penalty routines
        const res = await client.query("SELECT id FROM routines WHERE category = 'penalty'");
        console.log(`Found ${res.rowCount} penalty routines.`);

        if (res.rowCount > 0) {
            await client.query("DELETE FROM routines WHERE category = 'penalty'");
            console.log('Deleted penalty routines.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

unblock();
