'use server';

import prisma from '@/lib/db';
import { getSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { addXP } from '@/app/actions';

export async function getOrCreateBudget(month, year) {
    const session = await getSession();
    if (!session) return null;

    try {
        const budget = await prisma.monthlyBudget.upsert({
            where: { userId_month_year: { userId: session.userId, month, year } },
            create: { userId: session.userId, month, year, income: 0, savingsGoal: 0 },
            update: {},
            include: {
                fixedExpenses: { orderBy: { id: 'asc' } },
                variableExpenses: { orderBy: { date: 'desc' } }
            }
        });
        return budget;
    } catch (e) {
        console.error(e);
        return null;
    }
}

export async function updateBudgetMeta(budgetId, income, savingsGoal) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.monthlyBudget.update({
            where: { id: budgetId, userId: session.userId },
            data: { income: parseFloat(income) || 0, savingsGoal: parseFloat(savingsGoal) || 0 }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function addFixedExpense(budgetId, name, amount, category) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        // Verify the budget belongs to user
        const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId: session.userId } });
        if (!budget) return { success: false };

        await prisma.fixedExpense.create({
            data: { budgetId, name, amount: parseFloat(amount) || 0, category }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function toggleFixedPaid(expenseId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const expense = await prisma.fixedExpense.findFirst({
            where: { id: expenseId, budget: { userId: session.userId } }
        });
        if (!expense) return { success: false };

        await prisma.fixedExpense.update({
            where: { id: expenseId },
            data: { isPaid: !expense.isPaid }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function deleteFixedExpense(expenseId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.fixedExpense.deleteMany({
            where: { id: expenseId, budget: { userId: session.userId } }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function addVariableExpense(budgetId, name, amount, category) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId: session.userId } });
        if (!budget) return { success: false };

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        await prisma.variableExpense.create({
            data: { budgetId, name, amount: parseFloat(amount) || 0, category, date: new Date(todayStr) }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function deleteVariableExpense(expenseId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        await prisma.variableExpense.deleteMany({
            where: { id: expenseId, budget: { userId: session.userId } }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function checkAndAwardSavingsXP(budgetId) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const budget = await prisma.monthlyBudget.findFirst({
            where: { id: budgetId, userId: session.userId },
            include: { fixedExpenses: true, variableExpenses: true }
        });
        if (!budget || budget.xpAwarded) return { alreadyAwarded: true };

        const totalFixed = budget.fixedExpenses.reduce((s, e) => s + e.amount, 0);
        const totalVariable = budget.variableExpenses.reduce((s, e) => s + e.amount, 0);
        const actualSavings = budget.income - totalFixed - totalVariable;

        if (actualSavings >= budget.savingsGoal && budget.savingsGoal > 0) {
            await addXP(500);
            await prisma.monthlyBudget.update({ where: { id: budgetId }, data: { xpAwarded: true } });
            return { success: true, xpAwarded: true };
        }
        return { success: true, xpAwarded: false };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}
