'use client';

import { useState } from 'react';
import { updateTask, deleteTask, addTask, addRoutine } from './actions';
import { Save, Edit2, Trash2, Plus, X, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const DAY_COLORS = {
    'Mon': 'text-red-400 bg-red-400/10 border-red-400/20',
    'Tue': 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    'Wed': 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    'Thu': 'text-green-400 bg-green-400/10 border-green-400/20',
    'Fri': 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    'Sat': 'text-indigo-400 bg-indigo-400/10 border-indigo-400/20',
    'Sun': 'text-purple-400 bg-purple-400/10 border-purple-400/20',
};

export function AdminTaskRow({ task, dragHandleProps }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description || '');
    const [exp, setExp] = useState(task.exp);

    // Map existing repeatDays back to 7-char mask
    const initialMask = [0, 1, 2, 3, 4, 5, 6].map(i => {
        const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        return task.repeatDays?.includes(dayNames[i]) ? '1' : '0';
    }).join('');

    const [mask, setMask] = useState(initialMask);
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        await updateTask(task.id, title, parseInt(exp), mask, description);
        setLoading(false);
        setIsEditing(false);
    }

    async function handleDelete() {
        if (!confirm("Delete this task permanently?")) return;
        setLoading(true);
        await deleteTask(task.id);
        setLoading(false);
    }

    const toggleDay = (index) => {
        const arr = mask.split('');
        arr[index] = arr[index] === '1' ? '0' : '1';
        setMask(arr.join(''));
    };

    if (isEditing) {
        return (
            <div className="flex flex-col gap-3 rounded bg-muted/50 p-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                        className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm text-white"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            className="w-20 rounded border border-input bg-background px-3 py-1 text-sm text-white"
                            value={exp}
                            onChange={(e) => setExp(e.target.value)}
                        />
                        <button onClick={handleSave} disabled={loading} className="cursor-pointer p-2 text-muted-foreground hover:text-green-500">
                            <Save size={16} />
                        </button>
                        <button onClick={handleDelete} disabled={loading} className="cursor-pointer p-2 text-muted-foreground hover:text-red-500">
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>

                <textarea
                    className="w-full rounded border border-input bg-background/50 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] font-sans"
                    placeholder="Short description (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                {/* Visual Days Mask Toggle */}
                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                    <span className="text-xs text-muted-foreground mr-1 font-mono">ACTIVE DAYS:</span>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((char, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleDay(idx)}
                            className={cn(
                                "cursor-pointer flex h-7 w-7 items-center justify-center rounded border text-xs font-mono transition-colors",
                                mask[idx] === '1'
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                            )}
                        >
                            {char}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between border-b border-border py-2 last:border-0 hover:bg-muted/20 bg-background group">
            <div className="flex items-center gap-2 min-w-0">
                <div
                    {...dragHandleProps}
                    className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground opacity-50 hover:opacity-100 transition-opacity shrink-0"
                >
                    <GripVertical size={16} />
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                    <span className="text-sm font-medium truncate">{title}</span>
                    {/* Day Badges */}
                    <div className="flex flex-wrap gap-1">
                        {task.repeatDays?.map(day => (
                            <span
                                key={day}
                                className={cn(
                                    "text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase",
                                    DAY_COLORS[day] || "text-zinc-400 bg-zinc-800"
                                )}
                            >
                                {day.slice(0, 3)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground">{exp} XP</span>
                <button onClick={() => setIsEditing(true)} className="cursor-pointer p-2 text-muted-foreground hover:text-foreground">
                    <Edit2 size={14} />
                </button>
            </div>
        </div>
    );
}

export function AddTaskForm({ routineId }) {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [exp, setExp] = useState(50);
    const [mask, setMask] = useState('1111111');
    const [loading, setLoading] = useState(false);

    const toggleDay = (index) => {
        const arr = mask.split('');
        arr[index] = arr[index] === '1' ? '0' : '1';
        setMask(arr.join(''));
    };

    async function handleAdd() {
        if (!title.trim()) return;
        setLoading(true);
        await addTask(routineId, title, parseInt(exp), mask, description);

        // Reset and close
        setTitle('');
        setDescription('');
        setExp(50);
        setMask('1111111');
        setIsOpen(false);
        setLoading(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-dashed border-border py-2 text-sm text-muted-foreground hover:bg-muted/20 hover:text-foreground transition-colors"
            >
                <Plus size={16} /> ADD TASK
            </button>
        );
    }

    return (
        <div className="mt-4 flex flex-col gap-3 rounded border border-border bg-card/50 p-3 shadow-inner">
            <h4 className="text-xs font-bold text-muted-foreground font-mono">NEW TASK DEPLOYMENT</h4>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                    className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Task Protocol Name..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                />
                <input
                    type="number"
                    className="w-full sm:w-20 rounded border border-input bg-background px-3 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                />
            </div>

            <textarea
                className="w-full rounded border border-input bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary min-h-[60px] font-sans"
                placeholder="Task Description (Optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
            />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-1 gap-2">
                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                    <span className="text-[10px] text-muted-foreground mr-1 font-mono uppercase tracking-widest">Active Days:</span>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((char, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleDay(idx)}
                            className={cn(
                                "flex h-6 w-6 items-center justify-center rounded border text-[10px] font-mono transition-colors",
                                mask[idx] === '1'
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-transparent text-muted-foreground border-border hover:border-muted-foreground"
                            )}
                        >
                            {char}
                        </button>
                    ))}
                </div>

                <div className="flex gap-2 self-end">
                    <button onClick={() => setIsOpen(false)} disabled={loading} className="p-1 px-3 text-xs text-muted-foreground hover:text-red-500 border border-transparent hover:border-red-500/20 rounded">
                        CANCEL
                    </button>
                    <button onClick={handleAdd} disabled={loading || !title.trim()} className="p-1 px-4 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded disabled:opacity-50 flex items-center gap-1">
                        <Save size={12} /> DEPLOY
                    </button>
                </div>
            </div>
        </div>
    );
}

export function AddRoutineForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [loading, setLoading] = useState(false);

    async function handleDeploy() {
        if (!name.trim() || !startTime || !endTime) return;
        setLoading(true);
        await addRoutine(name, startTime, endTime);

        setName('');
        setStartTime('09:00');
        setEndTime('10:00');
        setIsOpen(false);
        setLoading(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/20 bg-background/50 py-6 text-sm font-bold text-primary hover:bg-primary/5 hover:border-primary/50 transition-all font-mono"
            >
                <Plus size={18} /> DEPLOY NEW PROTOCOL BLOCK
            </button>
        );
    }

    return (
        <div className="mt-8 flex flex-col gap-4 rounded-xl border border-primary/30 bg-card p-6 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />

            <h4 className="text-xl font-bold font-mono tracking-tight text-zinc-100 flex items-center justify-between">
                NEW PROTOCOL SETUP
                <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-white transition-colors">
                    <X size={20} />
                </button>
            </h4>

            <div className="flex flex-col gap-3 mt-2">
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Protocol Sequence Name</label>
                    <input
                        className="rounded border border-input bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary font-bold placeholder:font-normal placeholder:opacity-50"
                        placeholder="e.g. DEEP WORK, HYPERBOLIC TIME CHAMBER..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Start Time</label>
                        <input
                            type="time"
                            className="rounded border border-input bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider">End Time</label>
                        <input
                            type="time"
                            className="rounded border border-input bg-background/50 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <button
                    onClick={handleDeploy}
                    disabled={loading || !name.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-sm font-bold tracking-widest text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors uppercase font-mono"
                >
                    <Save size={16} /> INITIALIZE PROTOCOL SEQUENCE
                </button>
            </div>
        </div>
    );
}
