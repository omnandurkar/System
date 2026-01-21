'use client';

import { useState } from 'react';
import { updateTask } from './actions';
import { Save, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminTaskRow({ task }) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(task.title);
    const [exp, setExp] = useState(task.exp);
    const [loading, setLoading] = useState(false);

    async function handleSave() {
        setLoading(true);
        await updateTask(task.id, title, parseInt(exp));
        setLoading(false);
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-4 rounded bg-muted/50 p-2">
                <input
                    className="flex-1 rounded border border-input bg-background px-3 py-1 text-sm"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
                <input
                    type="number"
                    className="w-20 rounded border border-input bg-background px-3 py-1 text-sm"
                    value={exp}
                    onChange={(e) => setExp(e.target.value)}
                />
                <button onClick={handleSave} disabled={loading} className="p-2 hover:text-green-500">
                    <Save size={16} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between border-b border-border py-2 last:border-0 hover:bg-muted/20">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{title}</span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-xs font-mono text-muted-foreground">{exp} XP</span>
                <button onClick={() => setIsEditing(true)} className="p-2 text-muted-foreground hover:text-foreground">
                    <Edit2 size={14} />
                </button>
            </div>
        </div>
    );
}
