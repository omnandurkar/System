const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function resetStats() {
    const client = await pool.connect();
    try {
        console.log('Resetting user stats (HP=100, Fatigue=0)...');
        await client.query(`
            UPDATE users 
            SET hp = 100, fatigue = 0 
        `);
        console.log('Stats reset successfully.');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

resetStats();
