import { getAllRoutinesAndTasks, updateTask } from './actions';
import { getAllExercises, getAllDays } from '@/app/gym-action';
import { AdminTaskRow } from './admin-client';
import { ExerciseManager } from '@/components/ExerciseManager';

export default async function AdminPage() {
    const routines = await getAllRoutinesAndTasks();
    const exercises = await getAllExercises();
    const days = await getAllDays(); // Fetch Dynamic Days

    return (
        <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 font-mono">ADMINISTRATOR</h1>
                <p className="text-muted-foreground">Modify System Parameters.</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
                <ExerciseManager initialExercises={exercises} initialDays={days} />
            </div>

            <div className="space-y-8">
                {routines.map((routine) => (
                    <div key={routine.id} className="rounded-xl border border-border bg-card p-6">
                        <h2 className="mb-4 text-xl font-bold">{routine.name} <span className="text-sm font-normal text-muted-foreground">({routine.time})</span></h2>

                        <div className="space-y-4">
                            {routine.tasks.map((task) => (
                                <AdminTaskRow key={task.id} task={task} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
