'use server';

import prisma from '@/lib/db';
import { login, logout } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

export async function loginUser(prevState, formData) {
    const username = formData.get('username');
    const password = formData.get('password');

    try {
        const user = await prisma.user.findUnique({
            where: { username: username }
        });

        if (!user) {
            return { error: 'Invalid credentials.' };
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return { error: 'Invalid credentials.' };
        }

        // Success
        await login(user.id, user.username);
    } catch (error) {
        console.error(error);
        return { error: 'System error.' };
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

    try {
        // Check existing
        const check = await prisma.user.findUnique({
            where: { username: username },
            select: { id: true }
        });

        if (check) {
            return { error: 'Username taken.' };
        }

        // Create User
        const hashed = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                username: username,
                password: hashed,
                level: 1,
                exp: 0,
                hp: 100,
                maxHp: 100,
                fatigue: 0,
                maxFatigue: 100,
                gold: 0
            }
        });

        const userId = newUser.id;

        // --- CLONE DEFAULT ROUTINES FOR NEW USER ---
        const routines = [
            { name: 'Morning Discipline', start: '06:15', end: '08:00', cat: 'morning' },
            { name: 'Office Hours', start: '09:00', end: '18:00', cat: 'work' },
            { name: 'Evening Protocol', start: '18:00', end: '20:30', cat: 'evening' },
            { name: 'Night Control', start: '21:00', end: '22:45', cat: 'night' },
        ];

        for (const r of routines) {
            const newRoutine = await prisma.routine.create({
                data: {
                    userId: userId,
                    name: r.name,
                    startTime: r.start,
                    endTime: r.end,
                    category: r.cat
                }
            });

            const rId = newRoutine.id;

            let tasks = [];
            if (r.cat === 'morning') {
                tasks = [
                    { title: 'Wake up 06:15 - No Phone', expValue: 20 },
                    { title: 'Make Bed', expValue: 10 },
                    { title: 'Morning Food', expValue: 10 },
                    { title: 'Light Movement (Stretch/Core)', expValue: 15 }
                ];
            } else if (r.cat === 'work') {
                tasks = [
                    { title: 'Deep Work Session', expValue: 50 },
                    { title: 'No Slacking / No Complaints', expValue: 20 }
                ];
            } else if (r.cat === 'evening') {
                tasks = [
                    { title: 'Gym (Weights)', expValue: 40 },
                    { title: 'Boxing (Bag/Shadow)', expValue: 30 },
                    { title: 'Cool Down + Shower', expValue: 10 }
                ];
            } else if (r.cat === 'night') {
                tasks = [
                    { title: 'Dinner (Clean)', expValue: 10 },
                    { title: 'Career Prep / Investing', expValue: 30 },
                    { title: 'Reading (Physical Book)', expValue: 20 },
                    { title: 'Sleep 22:45', expValue: 20 }
                ];
            }

            for (const t of tasks) {
                await prisma.task.create({
                    data: {
                        routineId: rId,
                        title: t.title,
                        expValue: t.expValue,
                        daysMask: '1111111',
                        targetValue: 1,
                        unit: 'reps'
                    }
                });
            }
        }

        // Login immediately
        await login(userId, username);

    } catch (error) {
        console.error(error);
        return { error: 'System error.' };
    }

    redirect('/');
}

export async function logoutUser() {
    await logout();
    redirect('/login');
}
