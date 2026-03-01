import { getUserStats, getTodayTasks, checkForDungeonBreak } from '@/app/actions';
import { TaskItem } from '@/components/TaskItem';
import { AnimatedStats } from '@/components/AnimatedStats';
import { GamificationWrapper } from '@/components/GamificationWrapper';
import { CountdownTimer } from '@/components/CountdownTimer';
import { BonusQuest } from '@/components/BonusQuest';
import { RankBadge } from '@/components/RankBadge';
import { ShopWrapper } from '@/components/ShopWrapper'; // Wrapper for client-side state
import { DungeonBreakClientWrapper } from '@/components/DungeonBreakClientWrapper';
import { PlayerStatus } from '@/components/PlayerStatus';
import { BossRaidWidget } from '@/components/BossRaidWidget';
import { PenaltyOverlay } from '@/components/PenaltyOverlay';
import { TitleSelector } from '@/components/TitleSelector';
import { getTitles } from '@/app/actions';
import { LevelUpModal } from '@/components/LevelUpModal';
import { SystemWhisper } from '@/components/SystemWhisper';




export default async function Dashboard() {
    const user = await getUserStats();
    const routines = await getTodayTasks();
    const userTitles = await getTitles();

    // Calculate Task Completion for Gamification
    let totalTasks = 0;
    let completedTasks = 0;
    routines.forEach(r => {
        r.tasks.forEach(t => {
            totalTasks++;
            if (t.completed) completedTasks++;
        });
    });

    const nextLevelExp = user.level * 1000; // Example logic
    const progress = (user.exp / nextLevelExp) * 100;

    // Trigger Dungeon Check (Server Side)
    // NOTE: In Next.js Server Components, we can't easily "trigger" simpler side effects without blocking rendering.
    // Ideally, this check happens via middleware or a specific API route called by the client.
    // However, for this simplified structure, `getUserStats` already fetches the *Active* break.
    // We need to call `checkForDungeonBreak()` to potentially *create* one if none exists.
    let activeBreak = user.dungeonBreak;
    if (!activeBreak) {
        // Only try to spawn one if none is active
        const newBreak = await checkForDungeonBreak();
        if (newBreak) activeBreak = newBreak;
    }


    return (
        <div className="mx-auto max-w-4xl space-y-8 p-4">
            <LevelUpModal />
            <SystemWhisper />
            <PenaltyOverlay user={user} routines={routines} />
            <PlayerStatus user={user} />
            <BossRaidWidget bossRaid={user.bossRaid} totalTasks={totalTasks} completedTasks={completedTasks} userLevel={user.level} />
            <DungeonBreakClientWrapper initialBreak={activeBreak} /> {/* We need a client wrapper for interactivity */}

            <GamificationWrapper totalTasks={totalTasks} completedTasks={completedTasks} />

            <div className="flex flex-col items-center justify-between gap-4 md:flex-row md:items-start">
                <div className="space-y-2 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex flex-col">
                            {user.current_title && (
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 self-start">
                                    {user.current_title}
                                </span>
                            )}
                            <h1 className="text-3xl font-bold tracking-tighter uppercase sm:text-5xl">
                                PLAYER: {user.username}
                            </h1>
                        </div>
                        <RankBadge level={user.level} />
                    </div>
                    <div className="flex items-center gap-4">
                        <p className="font-mono text-sm tracking-widest text-muted-foreground">STATUS: HEALTHY</p>
                        <TitleSelector userTitles={userTitles} currentTitle={user.current_title} />
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <ShopWrapper userGold={user.gold || 0} currentTheme={user.current_theme} />
                    <CountdownTimer />
                </div>
            </div>

            {/* Header Stats */}
            <AnimatedStats user={user} nextLevelExp={nextLevelExp} progress={progress} />

            {/* Bonus Quests (Random Events) */}
            <BonusQuest />

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
