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

export async function addFixedExpense(budgetId, name, amount, category, note, isRecurring, emiMonthsTotal, emiMonthsPaid) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId: session.userId } });
        if (!budget) return { success: false };

        await prisma.fixedExpense.create({
            data: {
                budgetId, name, amount: parseFloat(amount) || 0, category,
                note: note || null,
                isRecurring: Boolean(isRecurring),
                emiMonthsTotal: emiMonthsTotal ? parseInt(emiMonthsTotal) : null,
                emiMonthsPaid: emiMonthsPaid ? parseInt(emiMonthsPaid) : 0
            }
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

export async function addVariableExpense(budgetId, name, amount, category, note) {
    const session = await getSession();
    if (!session) return { success: false };

    try {
        const budget = await prisma.monthlyBudget.findFirst({ where: { id: budgetId, userId: session.userId } });
        if (!budget) return { success: false };

        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

        await prisma.variableExpense.create({
            data: { budgetId, name, amount: parseFloat(amount) || 0, category, date: new Date(todayStr), note: note || null }
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
// ─── NET WORTH ───────────────────────────────────────────────────────────────

export async function getNetWorthAssets() {
    const session = await getSession();
    if (!session) return [];
    try {
        return await prisma.netWorthAsset.findMany({
            where: { userId: session.userId },
            orderBy: [{ type: 'asc' }, { id: 'asc' }]
        });
    } catch (e) { console.error(e); return []; }
}

export async function addNetWorthAsset(name, type, amount, isLiquid, maturityDate, notes, investedAmount) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.netWorthAsset.create({
            data: {
                userId: session.userId, name, type,
                amount: parseFloat(amount) || 0,
                investedAmount: parseFloat(investedAmount) || 0,
                isLiquid: Boolean(isLiquid),
                maturityDate: maturityDate ? new Date(maturityDate) : null,
                notes: notes || null
            }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

export async function updateNetWorthAsset(id, amount) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.netWorthAsset.updateMany({
            where: { id, userId: session.userId },
            data: { amount: parseFloat(amount) || 0, updatedAt: new Date() }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

export async function deleteNetWorthAsset(id) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.netWorthAsset.deleteMany({ where: { id, userId: session.userId } });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

// ─── FINANCE GOALS ───────────────────────────────────────────────────────────

export async function getFinanceGoals() {
    const session = await getSession();
    if (!session) return [];
    try {
        return await prisma.financeGoal.findMany({
            where: { userId: session.userId },
            orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }]
        });
    } catch (e) { console.error(e); return []; }
}

export async function addFinanceGoal(title, targetAmount, priority, deadline) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.financeGoal.create({
            data: {
                userId: session.userId, title,
                targetAmount: parseFloat(targetAmount) || 0,
                priority: priority || 'SHORT',
                deadline: deadline ? new Date(deadline) : null
            }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

export async function deleteFinanceGoal(id) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.financeGoal.deleteMany({ where: { id, userId: session.userId } });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

// ─── PURCHASE ADVISOR ────────────────────────────────────────────────────────

export async function analyzePurchase(itemName, price, currentMonthlySavings) {
    const session = await getSession();
    if (!session) return null;

    try {
        const assets = await prisma.netWorthAsset.findMany({
            where: { userId: session.userId },
            orderBy: { amount: 'desc' }
        });

        const totalNetWorth = assets.reduce((s, a) => s + a.amount, 0);
        const totalLiquid = assets.filter(a => a.isLiquid).reduce((s, a) => s + a.amount, 0);
        const targetPrice = parseFloat(price);
        const monthlySavings = parseFloat(currentMonthlySavings) || 0;

        // Option A: Can buy now from liquid?
        const canBuyNow = totalLiquid >= targetPrice;

        // Option B: Months needed to save
        const shortfall = Math.max(0, targetPrice - totalLiquid);
        const monthsNeeded = monthlySavings > 0 ? Math.ceil(shortfall / monthlySavings) : null;
        const affordableDate = monthsNeeded !== null
            ? new Date(Date.now() + monthsNeeded * 30 * 24 * 60 * 60 * 1000)
            : null;

        // Option C: What to liquidate
        // Priority order: CRYPTO > STOCKS > FD > SIP (never PF)
        const LIQUIDATION_ORDER = ['CRYPTO', 'STOCKS', 'FD', 'SIP', 'SAVINGS', 'OTHER'];
        const liquidatable = assets
            .filter(a => a.isLiquid && !a.type.includes('PF'))
            .sort((a, b) => LIQUIDATION_ORDER.indexOf(a.type) - LIQUIDATION_ORDER.indexOf(b.type));

        let needed = targetPrice;
        const liquidationPlan = [];
        for (const asset of liquidatable) {
            if (needed <= 0) break;
            const useAmount = Math.min(asset.amount, needed);
            liquidationPlan.push({ ...asset, sellAmount: useAmount });
            needed -= useAmount;
        }
        const canLiquidate = needed <= 0;

        return {
            itemName, targetPrice, totalNetWorth, totalLiquid,
            canBuyNow, shortfall, monthsNeeded, affordableDate,
            canLiquidate, liquidationPlan, monthlySavings
        };
    } catch (e) {
        console.error(e);
        return null;
    }
}

// ─── NET WORTH SNAPSHOTS (for History Graph #6) ──────────────────────────────

export async function saveNetWorthSnapshot(totalValue) {
    const session = await getSession();
    if (!session) return;
    const now = new Date();
    try {
        await prisma.netWorthSnapshot.upsert({
            where: { userId_month_year: { userId: session.userId, month: now.getMonth() + 1, year: now.getFullYear() } },
            create: { userId: session.userId, totalValue, month: now.getMonth() + 1, year: now.getFullYear() },
            update: { totalValue, createdAt: now }
        });
    } catch (e) { console.error(e); }
}

export async function getNetWorthHistory() {
    const session = await getSession();
    if (!session) return [];
    try {
        const snaps = await prisma.netWorthSnapshot.findMany({
            where: { userId: session.userId },
            orderBy: [{ year: 'asc' }, { month: 'asc' }],
            take: 12
        });
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return snaps.map(s => ({ label: `${MONTHS[s.month - 1]} ${s.year}`, value: s.totalValue }));
    } catch (e) { console.error(e); return []; }
}

// ─── COMPLETE GOAL (#15) ──────────────────────────────────────────────────────

export async function completeGoal(id) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.financeGoal.updateMany({
            where: { id, userId: session.userId },
            data: { completedAt: new Date() }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

// ─── PURCHASE ADVISOR LOG (#20) ───────────────────────────────────────────────

export async function logPurchaseDecision(itemName, price, verdict, decision) {
    const session = await getSession();
    if (!session) return;
    try {
        await prisma.purchaseAdvisorLog.create({
            data: { userId: session.userId, itemName, price: parseFloat(price) || 0, verdict, decision: decision || null }
        });
        revalidatePath('/finance');
    } catch (e) { console.error(e); }
}

export async function getPurchaseAdvisorLogs() {
    const session = await getSession();
    if (!session) return [];
    try {
        return await prisma.purchaseAdvisorLog.findMany({
            where: { userId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 30
        });
    } catch (e) { console.error(e); return []; }
}

// ─── CATEGORY BUDGET CAPS (#6) ───────────────────────────────────────────────

export async function getCategoryBudgetCaps(budgetId) {
    const session = await getSession();
    if (!session) return [];
    try {
        return await prisma.categoryBudgetCap.findMany({ where: { budgetId } });
    } catch (e) { console.error(e); return []; }
}

export async function upsertCategoryBudgetCap(budgetId, category, capAmount) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.categoryBudgetCap.upsert({
            where: { budgetId_category: { budgetId, category } },
            create: { budgetId, category, capAmount: parseFloat(capAmount) || 0 },
            update: { capAmount: parseFloat(capAmount) || 0 }
        });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

export async function deleteCategoryBudgetCap(budgetId, category) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        await prisma.categoryBudgetCap.deleteMany({ where: { budgetId, category } });
        revalidatePath('/finance');
        return { success: true };
    } catch (e) { console.error(e); return { success: false }; }
}

// ─── RECURRING AUTO-FILL (#12) ────────────────────────────────────────────────

export async function copyRecurringExpenses(fromBudgetId, toBudgetId) {
    const session = await getSession();
    if (!session) return { success: false };
    try {
        const recurring = await prisma.fixedExpense.findMany({
            where: { budgetId: fromBudgetId, isRecurring: true }
        });
        if (recurring.length === 0) return { success: true, copied: 0 };
        await prisma.fixedExpense.createMany({
            data: recurring.map(e => ({
                budgetId: toBudgetId, name: e.name, amount: e.amount,
                category: e.category, isRecurring: true,
                emiMonthsTotal: e.emiMonthsTotal,
                emiMonthsPaid: e.emiMonthsPaid ? e.emiMonthsPaid + 1 : 0,
                note: e.note
            })),
            skipDuplicates: false
        });
        revalidatePath('/finance');
        return { success: true, copied: recurring.length };
    } catch (e) { console.error(e); return { success: false }; }
}

// ─── ANNUAL VIEW (#19) ────────────────────────────────────────────────────────

export async function getAnnualSummary(year) {
    const session = await getSession();
    if (!session) return [];
    try {
        const budgets = await prisma.monthlyBudget.findMany({
            where: { userId: session.userId, year },
            include: { fixedExpenses: true, variableExpenses: true },
            orderBy: { month: 'asc' }
        });
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return Array.from({ length: 12 }, (_, i) => {
            const b = budgets.find(b => b.month === i + 1);
            if (!b) return { month: MONTHS[i], income: 0, totalExpense: 0, savings: 0, hasData: false };
            const totalFixed = b.fixedExpenses.reduce((s, e) => s + e.amount, 0);
            const totalVar = b.variableExpenses.reduce((s, e) => s + e.amount, 0);
            const totalExpense = totalFixed + totalVar;
            return { month: MONTHS[i], income: b.income, totalExpense, savings: Math.max(0, b.income - totalExpense), hasData: b.income > 0 };
        });
    } catch (e) { console.error(e); return []; }
}

// Update getOrCreateBudget to include categoryBudgetCaps (#6)
export async function getOrCreateBudgetWithCaps(month, year) {
    const session = await getSession();
    if (!session) return null;
    try {
        const budget = await prisma.monthlyBudget.upsert({
            where: { userId_month_year: { userId: session.userId, month, year } },
            create: { userId: session.userId, month, year, income: 0, savingsGoal: 0 },
            update: {},
            include: {
                fixedExpenses: { orderBy: { id: 'asc' } },
                variableExpenses: { orderBy: { date: 'desc' } },
                categoryBudgetCaps: true
            }
        });
        return budget;
    } catch (e) { console.error(e); return null; }
}

// ─── RECENT EXPENSES (for Quick Repeat row in QuickExpenseLogger) ─────────────
export async function getRecentVariableExpenses(limit = 10) {
    const session = await getSession();
    if (!session) return [];
    try {
        return await prisma.variableExpense.findMany({
            where: { budget: { userId: session.userId } },
            orderBy: { date: 'desc' },
            take: limit,
            select: { name: true, amount: true, category: true }
        });
    } catch (e) { console.error(e); return []; }
}
