require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('Connected to database successfully.');

    // --- 1. Cleanup ---
    await client.query(`DROP TABLE IF EXISTS task_completions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS daily_logs CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS gym_exercises CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS routines CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // --- 2. Users ---
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        level INTEGER DEFAULT 1,
        exp INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_active_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- 3. Routines (Buckets like Morning, Evening) ---
    await client.query(`
      CREATE TABLE routines (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        category VARCHAR(20) -- 'morning', 'work', 'evening', 'night', 'weekend'
      );
    `);

    // --- 4. Tasks (The tickable items) ---
    await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        routine_id INTEGER REFERENCES routines(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        exp_value INTEGER DEFAULT 10,
        days_mask VARCHAR(7) DEFAULT '1111111', -- MTWTFSS, 1=active
        is_hardcoded BOOLEAN DEFAULT FALSE
      );
    `);

    // --- 5. Gym Exercises (Global lookup)
    await client.query(`
      CREATE TABLE gym_exercises (
        id SERIAL PRIMARY KEY,
        day_number INTEGER, -- 1=Chest, 2=Back, etc.
        day_name VARCHAR(50),
        exercise_name VARCHAR(255),
        sets_reps VARCHAR(100)
      );
    `);

    // --- 6. Tracking ---
    await client.query(`
      CREATE TABLE daily_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        total_exp_gained INTEGER DEFAULT 0,
        notes TEXT,
        UNIQUE(user_id, date)
      );
    `);

    await client.query(`
      CREATE TABLE task_completions (
        id SERIAL PRIMARY KEY,
        daily_log_id INTEGER REFERENCES daily_logs(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        completed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Seed Gym Exercises (Global Standard Protocol)
    const gymPlan = [
      { day: 1, name: 'Chest + Triceps', ex: [['Bench Press', '4x8'], ['Incline DB Press', '3x10'], ['Push-ups', '2 sets failure'], ['Tricep Dips', '3x12']] },
      { day: 2, name: 'Back + Biceps', ex: [['Pull-ups', '4x8-10'], ['Barbell Row', '3x10'], ['Seated Row', '3x12'], ['Barbell Curl', '3x10']] },
      { day: 3, name: 'Shoulders + Neck', ex: [['Overhead Press', '4x8'], ['Lateral Raises', '4x12'], ['Rear Delt Fly', '3x12'], ['Shrugs', '4x12']] },
      { day: 4, name: 'Legs + Core', ex: [['Squats', '4x8'], ['Leg Press', '3x12'], ['RDL', '3x10'], ['Plank', '3x45s']] },
      { day: 5, name: 'Arms + Chest Pump', ex: [['Close-grip Bench', '3x8'], ['Cable Fly', '3x12'], ['Preacher Curl', '3x10'], ['Dips', '2 sets']] },
    ];

    for (const d of gymPlan) {
      for (const exercise of d.ex) {
        await client.query(
          'INSERT INTO gym_exercises (day_number, day_name, exercise_name, sets_reps) VALUES ($1, $2, $3, $4)',
          [d.day, d.name, exercise[0], exercise[1]]
        );
      }
    }

    // Seed Admin User
    const hashedPassword = await bcrypt.hash('admin', 10);
    const userRes = await client.query(
      'INSERT INTO users (username, password, level, exp) VALUES ($1, $2, 1, 0) RETURNING id',
      ['admin', hashedPassword]
    );
    const userId = userRes.rows[0].id;
    console.log(`User 'admin' created with ID: ${userId}`);

    // Seed Default Routines for Admin
    const routines = [
      { name: 'Morning Discipline', start: '06:15', end: '08:00', cat: 'morning' },
      { name: 'Office Hours', start: '09:00', end: '18:00', cat: 'work' },
      { name: 'Evening Protocol', start: '18:00', end: '20:30', cat: 'evening' },
      { name: 'Night Control', start: '21:00', end: '22:45', cat: 'night' },
    ];

    for (const r of routines) {
      const res = await client.query(
        'INSERT INTO routines (user_id, name, start_time, end_time, category) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [userId, r.name, r.start, r.end, r.cat]
      );
      const rId = res.rows[0].id;

      let tasks = [];
      if (r.cat === 'morning') {
        tasks = [
          { title: 'Wake up 06:15 - No Phone', exp: 20 },
          { title: 'Make Bed', exp: 10 },
          { title: 'Morning Food', exp: 10 },
          { title: 'Light Movement (Stretch/Core)', exp: 15 }
        ];
      } else if (r.cat === 'work') {
        tasks = [
          { title: 'Deep Work Session', exp: 50 },
          { title: 'No Slacking / No Complaints', exp: 20 }
        ];
      } else if (r.cat === 'evening') {
        tasks = [
          { title: 'Gym (Weights)', exp: 40 },
          { title: 'Boxing (Bag/Shadow)', exp: 30 },
          { title: 'Cool Down + Shower', exp: 10 }
        ];
      } else if (r.cat === 'night') {
        tasks = [
          { title: 'Dinner (Clean)', exp: 10 },
          { title: 'Career Prep / Investing', exp: 30 },
          { title: 'Reading (Physical Book)', exp: 20 },
          { title: 'Sleep 22:45', exp: 20 }
        ];
      }

      for (const t of tasks) {
        await client.query(
          'INSERT INTO tasks (routine_id, title, exp_value) VALUES ($1, $2, $3)',
          [rId, t.title, t.exp]
        );
      }
    }

    console.log('Seeding completed.');

  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
