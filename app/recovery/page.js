import { getTodayRecovery } from '@/app/recovery-actions';
import { RecoveryCalculator } from '@/components/RecoveryCalculator';

export default async function RecoveryPage() {
    const log = await getTodayRecovery();

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-4">
            <div className="space-y-2 border-b border-zinc-800 pb-4">
                <h1 className="text-3xl font-bold tracking-tight text-white font-mono">RECOVERY PROTOCOL</h1>
                <p className="text-zinc-500">Analyze systemic fatigue and restore baseline.</p>
            </div>

            <RecoveryCalculator initialLog={log} />
        </div>
    );
}
