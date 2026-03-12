import { getOrCreateBudget } from '@/app/finance-actions';
import FinanceDashboard from './FinanceDashboard';

export const metadata = { title: 'Treasury — System' };

export default async function FinancePage() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await getOrCreateBudget(month, year);

    return <FinanceDashboard initialBudget={budget} currentMonth={month} currentYear={year} />;
}
