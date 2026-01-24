import { getSystemLogs } from '@/app/history-actions';
import { TerminalLog } from '@/components/TerminalLog';

export default async function SystemLogsPage() {
    const logs = await getSystemLogs();

    return (
        <div className="p-4 md:p-8 min-h-screen">
            <h1 className="text-2xl font-bold mb-6 tracking-tight flex items-center gap-2">
                <span className="text-zinc-500">/</span> SYSTEM ARCHIVES
            </h1>
            <TerminalLog logs={logs} />
        </div>
    );
}
