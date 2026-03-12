import { getAllRoutinesAndTasks } from './actions';
import { getAllExercises, getAllDays } from '@/app/gym-action';
import { AdminRoutineList } from './admin-routine-list';
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

            <AdminRoutineList initialRoutines={routines} />
        </div>
    );
}
