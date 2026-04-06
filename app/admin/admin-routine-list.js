'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { AdminTaskRow, AddTaskForm, AddRoutineForm } from './admin-client';
import { updateTaskOrder, updateRoutineOrder, updateRoutine, deleteRoutine } from './actions';
import { GripHorizontal, Edit2, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminRoutineList({ initialRoutines }) {
    const [routines, setRoutines] = useState(initialRoutines);

    const onDragEnd = async (result) => {
        const { source, destination, draggableId, type } = result;

        if (!destination) return;

        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        // Handle Routine Reordering
        if (type === 'routine') {
            const newRoutines = Array.from(routines);
            const [movedRoutine] = newRoutines.splice(source.index, 1);
            newRoutines.splice(destination.index, 0, movedRoutine);

            setRoutines(newRoutines);
            const orderedIds = newRoutines.map(r => r.id);
            await updateRoutineOrder(orderedIds);
            return;
        }

        // Handle Task Reordering (within the same routine)
        if (source.droppableId !== destination.droppableId) {
            console.warn("Cross-routine dragging not supported yet.");
            return;
        }

        const routineId = parseInt(source.droppableId.split('-')[1]);
        const routineIndex = routines.findIndex(r => r.id === routineId);

        if (routineIndex === -1) return;

        const newRoutines = [...routines];
        const routineTasks = Array.from(newRoutines[routineIndex].tasks);

        const [movedTask] = routineTasks.splice(source.index, 1);
        routineTasks.splice(destination.index, 0, movedTask);

        newRoutines[routineIndex].tasks = routineTasks;
        setRoutines(newRoutines);

        const orderedIds = routineTasks.map(t => t.id);
        await updateTaskOrder(orderedIds);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="board" type="routine">
                {(provided) => (
                    <div
                        className="space-y-8"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {routines.map((routine, routineIndex) => (
                            <Draggable
                                key={routine.id}
                                draggableId={`routine-${routine.id}`}
                                index={routineIndex}
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={cn(
                                            "rounded-xl border border-border bg-card p-6 relative group",
                                            snapshot.isDragging && "shadow-2xl border-primary/50 ring-2 ring-primary/20"
                                        )}
                                        style={provided.draggableProps.style}
                                    >
                                        <AdminRoutineHeader
                                            routine={routine}
                                            dragHandleProps={provided.dragHandleProps}
                                        />

                                        <Droppable droppableId={`routine-${routine.id}`} type="task">
                                            {(provided) => (
                                                <div
                                                    className="space-y-4"
                                                    {...provided.droppableProps}
                                                    ref={provided.innerRef}
                                                >
                                                    {routine.tasks.map((task, taskIndex) => (
                                                        <Draggable
                                                            key={task.id}
                                                            draggableId={`task-${task.id}`}
                                                            index={taskIndex}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    style={{
                                                                        ...provided.draggableProps.style,
                                                                        opacity: snapshot.isDragging ? 0.8 : 1,
                                                                    }}
                                                                >
                                                                    <AdminTaskRow
                                                                        task={task}
                                                                        dragHandleProps={provided.dragHandleProps}
                                                                    />
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>

                                        <AddTaskForm routineId={routine.id} />
                                    </div>
                                )}
                            </Draggable>
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>

            <AddRoutineForm />
        </DragDropContext>
    );
}

// Sub-component for clarity
function AdminRoutineHeader({ routine, dragHandleProps }) {
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [name, setName] = useState(routine.name);
    const [startTime, setStartTime] = useState(routine.time.split(' - ')[0]);
    const [endTime, setEndTime] = useState(routine.time.split(' - ')[1]);
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        await updateRoutine(routine.id, name, startTime, endTime);
        setLoading(false);
        setIsEditing(false);
    }

    async function confirmDelete() {
        setLoading(true);
        setShowDeleteModal(false);
        await deleteRoutine(routine.id);
        setLoading(false);
    }

    if (isEditing) {
        return (
            <div className="mb-6 flex flex-col gap-3 p-4 rounded-lg bg-muted/30 border border-primary/20">
                <input
                    className="w-full rounded border border-input bg-background px-3 py-1.5 text-sm font-bold text-white"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Start Time</label>
                        <input
                            type="time"
                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-white"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                        <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">End Time</label>
                        <input
                            type="time"
                            className="w-full rounded border border-input bg-background px-2 py-1.5 text-xs text-white"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                    <button onClick={() => setIsEditing(false)} className="cursor-pointer px-3 py-1.5 text-xs text-muted-foreground hover:text-white">CANCEL</button>
                    <button onClick={handleSave} disabled={loading} className="cursor-pointer px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground rounded hover:bg-primary/90">SAVE CHANGES</button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Custom Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-xl border border-red-500/30 bg-zinc-900 p-6 shadow-2xl">
                        {/* Top accent bar */}
                        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500 to-transparent rounded-t-xl" />

                        {/* Icon + Title */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
                                <Trash2 size={18} className="text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs font-mono text-red-400 tracking-widest uppercase">⚠ Warning — Irreversible Action</p>
                                <h3 className="text-base font-bold text-white mt-0.5">Delete Protocol</h3>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="rounded-lg bg-zinc-800/60 border border-zinc-700 p-4 mb-6">
                            <p className="text-sm text-zinc-300 font-mono">
                                <span className="text-white font-bold">&quot;{routine.name}&quot;</span> and{' '}
                                <span className="text-red-300 font-bold">ALL its tasks</span> will be permanently deleted.
                            </p>
                            <p className="text-xs text-zinc-500 mt-2 font-mono">This action cannot be undone. XP from completed tasks will not be refunded.</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="cursor-pointer px-4 py-2 text-sm font-mono text-zinc-400 border border-zinc-700 rounded hover:bg-zinc-800 hover:text-white transition-colors"
                            >
                                ABORT
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={loading}
                                className="cursor-pointer px-4 py-2 text-sm font-bold font-mono text-white bg-red-600 rounded hover:bg-red-500 disabled:opacity-50 transition-colors tracking-wider"
                            >
                                {loading ? 'DELETING...' : '⚡ CONFIRM DELETE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 min-w-0">
                    <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground opacity-30 hover:opacity-100 transition-opacity flex-shrink-0 mt-0.5">
                        <GripHorizontal size={20} />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-bold leading-tight break-words">
                            {routine.name}
                        </h2>
                        <span className="text-xs font-mono text-muted-foreground">{routine.time}</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setIsEditing(true)} className="cursor-pointer p-2 text-muted-foreground hover:text-blue-400 transition-colors">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => setShowDeleteModal(true)} className="cursor-pointer p-2 text-muted-foreground hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </>
    );
}
