'use server';

import pool from '@/lib/db';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginUser(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM users WHERE username = $1', [username]);
        if (res.rows.length === 0) {
            return { error: 'Invalid credentials.' };
        }

        const user = res.rows[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return { error: 'Invalid credentials.' };
        }

        // Success
        await login(user.id, user.username);

    } catch (error) {
        console.error(error);
        return { error: 'System error.' };
    } finally {
        client.release();
    }
    redirect('/');
}

export async function signupUser(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');
    const confirm = formData.get('confirm');

    if (password !== confirm) {
        return { error: 'Passwords do not match.' };
    }

    if (password.length < 4) {
        return { error: 'Password too weak.' };
    }

    const client = await pool.connect();
    try {
        // Check existing
        const check = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        if (check.rows.length > 0) {
            return { error: 'Username taken.' };
        }

        // Create User
        const hashed = await bcrypt.hash(password, 10);
        const userRes = await client.query(
            'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
            [username, hashed]
        );
        const userId = userRes.rows[0].id;

        // --- CLONE DEFAULT ROUTINES FOR NEW USER ---
        // (We hardcode the same defaults as setup-db.js for simplicity)
        const routines = [
            { name: 'Morning Discipline', start: '06:15', end: '08:00', cat: 'morning' },
            { name: 'Office Hours', start: '09:00', end: '18:00', cat: 'work' },
            { name: 'Evening Protocol', start: '18:00', end: '20:30', cat: 'evening' },
            { name: 'Night Control', start: '21:00', end: '22:45', cat: 'night' },
        ];

        for (const r of routines) {
            const rRes = await client.query(
                'INSERT INTO routines (user_id, name, start_time, end_time, category) VALUES ($1, $2, $3, $4, $5) RETURNING id',
                [userId, r.name, r.start, r.end, r.cat]
            );
            const rId = rRes.rows[0].id;

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

        // Login immediately
        await login(userId, username);

    } catch (error) {
        console.error(error);
        return { error: 'System error.' };
    } finally {
        client.release();
    }
    redirect('/');
}

export async function logoutUser() {
    await logout();
    redirect('/login');
}
