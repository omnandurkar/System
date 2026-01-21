import { getUserStats, getTodayTasks } from '@/app/actions';
import { TaskItem } from '@/components/TaskItem';
import { AnimatedStats } from '@/components/AnimatedStats';
import { GamificationWrapper } from '@/components/GamificationWrapper';
import { CountdownTimer } from '@/components/CountdownTimer';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function Dashboard() {
    const user = await getUserStats();
    const routines = await getTodayTasks();

    const nextLevelExp = user.level * 1000; // Example logic
    const progress = (user.exp / nextLevelExp) * 100;

    return (
        <div className="mx-auto max-w-4xl space-y-8 p-4">
            <GamificationWrapper />

            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
                <div className="space-y-1 text-center md:text-left">
                    <h1 className="text-3xl font-bold tracking-tighter uppercase sm:text-5xl">
                        PLAYER: {user.username}
                    </h1>
                    <p className="font-mono text-sm tracking-widest text-muted-foreground">STATUS: HEALTHY</p>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <CountdownTimer />
                </div>
            </div>

            {/* Header Stats */}
            <AnimatedStats user={user} nextLevelExp={nextLevelExp} progress={progress} />

            {/* Routines Timeline */}
            <div className="space-y-6">
                <div className="border-b border-zinc-800 pb-2">
                    <h2 className="text-lg font-semibold tracking-tight text-zinc-100">Active Protocols</h2>
                </div>

                {routines.map((routine) => (
                    <div key={routine.id} className="relative pl-8 before:absolute before:left-[11px] before:top-0 before:h-full before:w-[2px] before:bg-border last:before:hidden">
                        <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-4 border-background bg-muted-foreground ring-4 ring-background" />
                        <div className="mb-8">
                            <div className="mb-4 flex items-center justify-between">
                                <h3 className="text-lg font-semibold">{routine.name}</h3>
                                <span className="font-mono text-sm text-muted-foreground">{routine.time}</span>
                            </div>

                            <div className="grid gap-3">
                                {routine.tasks.map(task => (
                                    <TaskItem key={task.id} task={task} />
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
