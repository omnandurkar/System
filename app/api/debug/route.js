
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    const client = await pool.connect();
    try {
        const results = {};

        // 1. Check Timezone
        const now = new Date();
        results.serverTime = now.toString();
        results.isoTime = now.toISOString();

        // 2. Check for Boxing Tasks in `tasks` table
        const boxingTasks = await client.query("SELECT * FROM tasks WHERE title ILIKE '%Boxing%'");
        results.boxingTasksRaw = boxingTasks.rows;

        // 3. Check for Gym Exercises
        const boxingExercises = await client.query("SELECT * FROM gym_exercises WHERE category = 'BOXING'");
        results.boxingExercises = boxingExercises.rows;

        // 4. Update Schedule (Mon-Fri)
        results.message = "Updating Boxing Schedule to Mon-Fri...";

        const boxingDrills = [
            { name: 'Skipping', sets: '10 mins' },
            { name: 'Shadow Boxing', sets: '4 rounds' },
            { name: 'Bag Work', sets: '4 rounds' },
            { name: 'Footwork Drills', sets: '15 mins' }
        ];

        // Delete existing boxing drills (and their logs)
        // 1. Get IDs
        const idsRes = await client.query("SELECT id FROM gym_exercises WHERE category = 'BOXING'");
        const ids = idsRes.rows.map(r => r.id);

        if (ids.length > 0) {
            // 2. Delete Logs
            await client.query("DELETE FROM gym_logs WHERE exercise_id = ANY($1)", [ids]);
            // 3. Delete Exercises
            await client.query("DELETE FROM gym_exercises WHERE id = ANY($1)", [ids]);
        }

        // Insert for Days 1 (Mon) to 5 (Fri)
        const days = [1, 2, 3, 4, 5];

        for (const day of days) {
            for (const drill of boxingDrills) {
                await client.query(`
                    INSERT INTO gym_exercises (exercise_name, sets_reps, day_number, category)
                    VALUES ($1, $2, $3, 'BOXING')
                `, [drill.name, drill.sets, day]);
            }
        }
        results.updated = true;
        results.schedule = "Mon-Fri";

        return NextResponse.json(results);
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        client.release();
    }
}
