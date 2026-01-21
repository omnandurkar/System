'use client';

import { useState } from 'react';
import { createExercise, updateExercise, deleteExercise, updateDayInfo } from '@/app/gym-action';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Play, Calendar, Dumbbell, Settings } from 'lucide-react';
import { Modal, Input, Button } from '@/components/ui/modal';
import { cn } from '@/lib/utils';

export function ExerciseManager({ initialExercises, initialDays }) {
    const [exercises, setExercises] = useState(initialExercises);
    const [days, setDays] = useState(initialDays || []);

    // Day Selection & Editing
    const [selectedDay, setSelectedDay] = useState(null); // Day Number (0-6)
    const [editingDay, setEditingDay] = useState(null); // Object for currently editing Name

    // Exercise CRUD
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingExercise, setEditingExercise] = useState(null);
    const [formData, setFormData] = useState({ name: '', sets_reps: '', category: 'WEIGHTS' });

    // Day Edit Form
    const [dayFormData, setDayFormData] = useState({ name: '', description: '' });

    // Helper: Get exercises for a specific day
    const getExercisesForDay = (dayNum) => exercises.filter(e => e.day_number === dayNum);

    // --- Handlers ---

    function openAdd(dayNum) {
        setEditingExercise(null);
        setFormData({ name: '', sets_reps: '', category: 'WEIGHTS' });
        setIsAddModalOpen(true);
    }

    function openEdit(ex) {
        setEditingExercise(ex);
        setFormData({ name: ex.exercise_name, sets_reps: ex.sets_reps, category: ex.category || 'WEIGHTS' });
        setIsAddModalOpen(true);
    }

    function openEditDay(e, day) {
        e.stopPropagation(); // Prevent opening the day details
        setEditingDay(day);
        setDayFormData({ name: day.name, description: day.description });
    }

    async function handleSubmit() {
        if (editingExercise) {
            await updateExercise(editingExercise.id, { ...formData, day_number: selectedDay });
        } else {
            await createExercise({ ...formData, day_number: selectedDay });
        }
        setIsAddModalOpen(false);
        window.location.reload();
    }

    async function handleDaySubmit() {
        if (editingDay) {
            await updateDayInfo(editingDay.day_number, dayFormData.name, dayFormData.description);
            setEditingDay(null);
            window.location.reload();
        }
    }

    async function handleDelete(id) {
        if (confirm('Delete this exercise protocol?')) {
            await deleteExercise(id);
            window.location.reload();
        }
    }

    return (
        <div className="space-y-8">
            <div className="border-b border-zinc-800 pb-4">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">PROTOCOL REGISTRY</h2>
                <p className="text-sm text-zinc-500 font-mono">SELECT A DAY TO MODIFY PROTOCOLS</p>
            </div>

            {/* DAY GRID */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {days.map((day) => {
                    const dayExercises = getExercisesForDay(day.day_number);
                    const count = dayExercises.length;

                    return (
                        <motion.div
                            key={day.day_number}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedDay(day.day_number)}
                            className={cn(
                                "group relative cursor-pointer rounded-lg border bg-zinc-900/50 p-6 md:p-6 transition-all hover:bg-zinc-800 hover:border-zinc-700 active:scale-95 touch-manipulation",
                                selectedDay === day.day_number ? "border-white bg-zinc-800 ring-1 ring-white" : "border-zinc-800"
                            )}
                        >


                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-mono text-zinc-500">DAY {day.day_number === 0 ? 7 : day.day_number}</span>
                                <Calendar className="h-4 w-4 text-zinc-600" />
                            </div>
                            <h3 className="font-bold text-lg text-white tracking-tight">{day.name}</h3>
                            <p className="text-xs text-zinc-400 font-mono mt-1 uppercase">{day.description}</p>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-zinc-500">
                                    <Dumbbell className="h-3 w-3" />
                                    <span>{count} PROTOCOLS</span>
                                </div>

                                <button
                                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
                                    onClick={(e) => openEditDay(e, day)}
                                >
                                    <Settings className="h-3 w-3" />
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* DAY DETAIL MODAL */}
            <Modal
                isOpen={selectedDay !== null}
                onClose={() => setSelectedDay(null)}
                title={`${days.find(d => d.day_number === selectedDay)?.name} // PROTOCOLS`}
            >
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex justify-end">
                        <Button onClick={() => openAdd(selectedDay)} className="w-full sm:w-auto">
                            <Plus className="mr-2 h-4 w-4" /> ADD NEW
                        </Button>
                    </div>

                    <div className="grid gap-2">
                        {selectedDay !== null && getExercisesForDay(selectedDay).length === 0 && (
                            <div className="text-center py-8 text-zinc-500 font-mono text-sm border border-dashed border-zinc-800 rounded">
                                NO PROTOCOLS ASSIGNED
                            </div>
                        )}
                        {selectedDay !== null && getExercisesForDay(selectedDay).map((ex) => (
                            <div key={ex.id} className="group flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-900 p-3 hover:bg-zinc-800/80">
                                <div>
                                    <h4 className="font-bold text-zinc-200 text-sm">{ex.exercise_name}</h4>
                                    <span className="text-xs font-mono text-zinc-500">{ex.sets_reps}</span>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(ex)}><Edit2 className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400" onClick={() => handleDelete(ex.id)}><Trash2 className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>

            {/* ADD/EDIT EXERCISE MODAL */}
            <Modal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                title={editingExercise ? "MODIFY PROTOCOL" : "INITIALIZE PROTOCOL"}
            >
                <div className="space-y-4">
                    <Input
                        label="PROTOCOL NAME"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. INCLINE PRESS"
                    />
                    <Input
                        label="PARAMETERS (SETS x REPS)"
                        value={formData.sets_reps}
                        onChange={e => setFormData({ ...formData, sets_reps: e.target.value })}
                        placeholder="e.g. 4x8"
                    />

                    <div className="space-y-1">
                        <label className="text-xs font-mono text-zinc-500 uppercase">Category</label>
                        <select
                            className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="WEIGHTS">WEIGHTS</option>
                            <option value="BOXING">BOXING (DAILY)</option>
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>CANCEL</Button>
                        <Button onClick={handleSubmit}>{editingExercise ? 'UPDATE' : 'CONFIRM'}</Button>
                    </div>
                </div>
            </Modal>

            {/* EDIT DAY NAME MODAL */}
            <Modal
                isOpen={editingDay !== null}
                onClose={() => setEditingDay(null)}
                title="CONFIGURE DAY"
            >
                <div className="space-y-4">
                    <Input
                        label="DAY TITLE"
                        value={dayFormData.name}
                        onChange={e => setDayFormData({ ...dayFormData, name: e.target.value })}
                        placeholder="e.g. CHEST DAY"
                    />
                    <Input
                        label="SUBTITLE / FOCUS"
                        value={dayFormData.description}
                        onChange={e => setDayFormData({ ...dayFormData, description: e.target.value })}
                        placeholder="e.g. PUSH / HYPERTROPHY"
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingDay(null)}>CANCEL</Button>
                        <Button onClick={handleDaySubmit}>UPDATE CONFIG</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
