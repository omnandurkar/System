const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testTimezone() {
    const client = await pool.connect();
    try {
        console.log('--- DATABASE TIME ---');
        const res = await client.query(`
            SELECT 
                NOW() as db_now, 
                NOW() AT TIME ZONE 'UTC' as db_utc,
                NOW() AT TIME ZONE 'Asia/Kolkata' as db_ist,
                (NOW() AT TIME ZONE 'Asia/Kolkata')::date as db_ist_date
        `);
        console.log(res.rows[0]);

        console.log('\n--- JAVASCRIPT TIME ---');
        const jsNow = new Date();
        console.log('JS Now (Local/System):', jsNow.toString());
        console.log('JS UTC:', jsNow.toISOString());

        const istString = jsNow.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
        console.log('JS IST String:', istString);

        const istDate = new Date(istString);
        console.log('JS IST Date Object:', istDate.toString());
        console.log('JS IST Day:', istDate.getDay());

        console.log('\n--- COMPARISON ---');
        const dbDate = new Date(res.rows[0].db_ist);
        console.log('DB IST Matching JS IST?',
            dbDate.getDate() === istDate.getDate() &&
            dbDate.getHours() === istDate.getHours()
        );

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        await pool.end();
    }
}

testTimezone();
