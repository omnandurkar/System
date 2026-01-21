import { getTodaysWorkout } from '@/app/gym-action';
import { GymChecklist } from '@/components/GymChecklist';

export default async function GymPage() {
    const workout = await getTodaysWorkout();

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">GYM PROTOCOL</h1>
                <p className="text-muted-foreground">"Where men are built."</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">
                    {workout.dayName ? workout.dayName.toUpperCase() : 'REST DAY'}
                </h2>

                {workout.exercises && (
                    <div className="space-y-8">
                        {/* WEIGHTS SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Weight Protocol</h3>
                            <GymChecklist
                                exercises={workout.exercises.filter(e => !e.category || e.category === 'WEIGHTS')}
                                type="LIFT"
                            />
                            {workout.exercises.filter(e => !e.category || e.category === 'WEIGHTS').length === 0 && (
                                <p className="text-zinc-600 text-sm italic">No weight training scheduled.</p>
                            )}
                        </div>

                        {/* SEPARATOR */}
                        <div className="h-px w-full bg-zinc-800" />

                        {/* BOXING SECTION */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest">Boxing Drills</h3>
                            <GymChecklist
                                exercises={workout.exercises.filter(e => e.category === 'BOXING')}
                                type="BOXING"
                            />
                            {workout.exercises.filter(e => e.category === 'BOXING').length === 0 && (
                                <p className="text-zinc-600 text-sm italic">No boxing drills scheduled.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4 text-primary">BOXING DRILLS</h2>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Skipping</span> <span className="text-muted-foreground">10 mins</span></div>
                    <div className="flex justify-between"><span>Shadow Boxing</span> <span className="text-muted-foreground">4 rounds</span></div>
                    <div className="flex justify-between"><span>Bag Work</span> <span className="text-muted-foreground">4 rounds</span></div>
                    <div className="flex justify-between"><span>Footwork</span> <span className="text-muted-foreground">Drills</span></div>
                </div>
            </div>
        </div>
    );
}
