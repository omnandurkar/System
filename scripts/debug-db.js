const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
if (!process.env.DATABASE_URL) require('dotenv').config();

const pool = new Pool({
    user: process.env.POSTGRES_USER,
    host: process.env.POSTGRES_HOST,
    database: process.env.POSTGRES_DATABASE,
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
    ssl: { rejectUnauthorized: false } // Helper for some cloud DBs
});

async function debug() {
    const client = await pool.connect();
    try {
        console.log("--- DEBUG START ---");

        // 1. Timezone Check
        const now = new Date();
        console.log("Current Server Time (Local):", now.toString());
        console.log("Current Server Time (ISO):", now.toISOString());
        console.log("Date used for logic:", now.toISOString().split('T')[0]);

        // 2. Fetch User
        const userRes = await client.query('SELECT id, username FROM users LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log("No users found.");
            return;
        }
        const userId = userRes.rows[0].id; // Assuming single user for now or picking first
        console.log(`Checking for User: ${userRes.rows[0].username} (${userId})`);

        // 3. Check Routines
        console.log("\n--- Routines ---");
        const routinesRes = await client.query('SELECT * FROM routines WHERE user_id = $1', [userId]);
        routinesRes.rows.forEach(r => {
            console.log(`[${r.id}] ${r.name} (${r.start_time}-${r.end_time})`);
        });

        // 4. Check Tasks
        console.log("\n--- Tasks (All) ---");
        const tasksRes = await client.query(`
            SELECT t.id, t.title, r.name as routine_name 
            FROM tasks t 
            JOIN routines r ON t.routine_id = r.id 
            WHERE r.user_id = $1
        `, [userId]);

        tasksRes.rows.forEach(t => {
            console.log(`[${t.id}] ${t.title} (in ${t.routine_name})`);
        });

        // 5. Specific Search for Boxing
        console.log("\n--- Searching for 'Boxing' ---");
        const boxingRes = await client.query("SELECT * FROM tasks WHERE title ILIKE '%Boxing%'");
        if (boxingRes.rows.length === 0) {
            console.log("No tasks found with 'Boxing' in title.");
        } else {
            console.log("Found raw boxing tasks (might not be linked to user):");
            boxingRes.rows.forEach(t => console.log(JSON.stringify(t)));
        }

    } catch (e) {
        console.error("Debug Error:", e);
    } finally {
        client.release();
        pool.end();
    }
}

debug();
