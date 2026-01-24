require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Neon/Vercel
});

async function main() {
  const client = await pool.connect();
  try {
    console.log('--- SYSTEM REBOOT: INITIALIZING NEON DB PROTOCOL ---');

    // --- 1. Cleanup (Drop Everything) ---
    console.log('Cleaning old data...');
    await client.query(`DROP TABLE IF EXISTS system_whispers CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS user_titles CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS dungeon_breaks CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS task_completions CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS daily_logs CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS gym_exercises CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS tasks CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS routines CASCADE;`);
    await client.query(`DROP TABLE IF EXISTS users CASCADE;`);

    // --- 2. Users (Expanded V2 Schema) ---
    console.log('Constructing Player Database...');
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        
        -- Core Progression
        level INTEGER DEFAULT 1,
        exp INTEGER DEFAULT 0,
        
        -- Stats (RPG)
        hp INTEGER DEFAULT 100,
        max_hp INTEGER DEFAULT 100,
        fatigue INTEGER DEFAULT 0,
        max_fatigue INTEGER DEFAULT 100,
        gold INTEGER DEFAULT 0,
        
        -- Attributes
        strength INTEGER DEFAULT 1,
        intelligence INTEGER DEFAULT 1,
        vitality INTEGER DEFAULT 1,
        stat_points INTEGER DEFAULT 0,
        
        -- Meta
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        last_active_date DATE,
        current_title VARCHAR(100),
        
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- 3. Routines ---
    await client.query(`
      CREATE TABLE routines (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(50) NOT NULL,
        start_time VARCHAR(10),
        end_time VARCHAR(10),
        category VARCHAR(20) -- 'morning', 'work', 'evening', 'night', 'weekend_chores', 'boss_raid', 'penalty'
      );
    `);

    // --- 4. Tasks (Expanded) ---
    await client.query(`
      CREATE TABLE tasks (
        id SERIAL PRIMARY KEY,
        routine_id INTEGER REFERENCES routines(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        exp_value INTEGER DEFAULT 10,
        target_value INTEGER DEFAULT 1, -- e.g. 100 Reps
        unit VARCHAR(20),               -- e.g. 'reps', 'min'
        days_mask VARCHAR(7) DEFAULT '1111111',
        is_hardcoded BOOLEAN DEFAULT FALSE
      );
    `);

    // --- 5. Gym Exercises ---
    await client.query(`
      CREATE TABLE gym_exercises (
        id SERIAL PRIMARY KEY,
        day_number INTEGER,
        day_name VARCHAR(50),
        exercise_name VARCHAR(255),
        sets_reps VARCHAR(100)
      );
    `);

    // --- 6. Tracking Logs ---
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
        progress INTEGER DEFAULT 0, -- Partial completion tracking
        completed_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // --- 7. RPG Features ---

    // Dungeon Breaks
    await client.query(`
        CREATE TABLE dungeon_breaks (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            description TEXT NOT NULL,
            xp_reward INTEGER NOT NULL,
            penalty_hp INTEGER NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    // Titles
    await client.query(`
        CREATE TABLE user_titles (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            title_id VARCHAR(50) NOT NULL, -- e.g. 'The Early Bird'
            unlocked_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, title_id)
        );
    `);

    // System Whispers
    await client.query(`
        CREATE TABLE system_whispers (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            type VARCHAR(50) NOT NULL,
            message TEXT NOT NULL,
            target_value VARCHAR(50),
            created_at DATE DEFAULT CURRENT_DATE,
            status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, FAILED, SKIPPED
            UNIQUE(user_id, created_at)
        );
    `);

    // --- SEED CONTENT ---

    // Gym Protocol
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

    // Default Admin User
    const hashedPassword = await bcrypt.hash('admin', 10);
    const userRes = await client.query(
      'INSERT INTO users (username, password, level, exp) VALUES ($1, $2, 1, 0) RETURNING id',
      ['admin', hashedPassword]
    );
    const userId = userRes.rows[0].id; // Create but don't delete other users logic here for future safety, but we dropped tables so fine.

    console.log('Seeding Default Routines...');
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
      // (Keep existing task logic but add target/units where sensible?)
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

    console.log('--- SYSTEM INITIALIZATION COMPLETE ---');
    console.log(`User 'admin' created with password 'admin'.`);

  } catch (err) {
    console.error('CRITICAL FAILURE:', err);
  } finally {
    client.release();
    pool.end();
  }
}

main();
