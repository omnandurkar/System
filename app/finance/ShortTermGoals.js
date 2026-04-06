'use client';
import { useState } from 'react';
import {
    Plus, Trash2, CheckCircle, Clock, AlertTriangle, ChevronDown,
    ChevronUp, ShoppingBag, CreditCard, Banknote, PiggyBank, Star,
    Package, Edit2, X, Save
} from 'lucide-react';
import {
    addFinanceGoal, deleteFinanceGoal, getFinanceGoals, completeGoal,
    updateShortTermGoal
} from '@/app/finance-actions';
import { cn } from '@/lib/utils';

function fmt(n) {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
}

const EMPTY_FORM = {
    title: '', targetAmount: '', description: '',
    currentPrice: '', deadline: '',
    emiDownPayment: '', emiMonths: '', emiMonthlyAmount: '',
    notes: '',
};

// ── Purchase Options Card ──────────────────────────────────────────────
function PurchaseOptions({ goal, monthlySavings }) {
    const price = goal.currentPrice || goal.targetAmount;
    const [open, setOpen] = useState(false);

    const hasEmi = goal.emiMonths && goal.emiMonths > 0;
    const emiTotal = hasEmi
        ? (goal.emiDownPayment || 0) + (goal.emiMonthlyAmount || 0) * goal.emiMonths
        : null;

    const shortfall = price > 0 ? Math.max(0, price) : 0;
    const monthsNeeded = monthlySavings > 0 ? Math.ceil(shortfall / monthlySavings) : null;

    return (
        <div className="mt-3 border-t border-zinc-800 pt-3">
            <button
                onClick={() => setOpen(v => !v)}
                className="cursor-pointer flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-purple-400 transition-colors"
            >
                {open ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                PURCHASE OPTIONS
            </button>

            {open && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 animate-in slide-in-from-top-2 duration-200">
                    {/* Option A — Buy Now */}
                    <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Banknote size={12} className="text-green-400" />
                            <span className="text-[9px] font-mono text-green-400 uppercase tracking-widest font-bold">Pay Cash</span>
                        </div>
                        <p className="text-sm font-bold font-mono text-white">{fmt(price)}</p>
                        <p className="text-[9px] font-mono text-zinc-500 mt-1">One-time full payment</p>
                    </div>

                    {/* Option B — EMI */}
                    {hasEmi ? (
                        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                            <div className="flex items-center gap-1.5 mb-2">
                                <CreditCard size={12} className="text-blue-400" />
                                <span className="text-[9px] font-mono text-blue-400 uppercase tracking-widest font-bold">EMI Plan</span>
                            </div>
                            {goal.emiDownPayment > 0 && (
                                <p className="text-[9px] font-mono text-zinc-400">
                                    Down: <span className="text-white font-bold">{fmt(goal.emiDownPayment)}</span>
                                </p>
                            )}
                            <p className="text-sm font-bold font-mono text-white">
                                {fmt(goal.emiMonthlyAmount)}<span className="text-xs text-zinc-500">/mo</span>
                            </p>
                            <p className="text-[9px] font-mono text-zinc-500">{goal.emiMonths} months · Total {fmt(emiTotal)}</p>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-dashed border-zinc-700 bg-zinc-900/40 p-3 flex items-center justify-center">
                            <p className="text-[9px] font-mono text-zinc-600 text-center">No EMI info<br />added yet</p>
                        </div>
                    )}

                    {/* Option C — Save Up */}
                    <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                            <PiggyBank size={12} className="text-purple-400" />
                            <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest font-bold">Save Up</span>
                        </div>
                        {monthsNeeded !== null ? (
                            <>
                                <p className="text-sm font-bold font-mono text-white">{monthsNeeded}mo</p>
                                <p className="text-[9px] font-mono text-zinc-500">at {fmt(monthlySavings)}/mo</p>
                            </>
                        ) : (
                            <p className="text-[9px] font-mono text-zinc-600">Set savings rate to see ETA</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Goal Card ──────────────────────────────────────────────────────────
function GoalCard({ goal, onComplete, onDelete, onEdit, monthlySavings }) {
    const price = goal.currentPrice || goal.targetAmount;
    const daysLeft = goal.deadline
        ? Math.ceil((new Date(goal.deadline) - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const urgent = daysLeft !== null && daysLeft <= 30 && daysLeft > 0;
    const overdue = daysLeft !== null && daysLeft <= 0;

    return (
        <div className={cn(
            "relative rounded-xl border bg-zinc-900/60 p-4 transition-all hover:border-zinc-600 group",
            overdue ? "border-red-500/40" : urgent ? "border-orange-500/30" : "border-zinc-700/60"
        )}>
            {/* Urgency badge */}
            {(urgent || overdue) && (
                <div className={cn(
                    "flex items-center gap-1 text-[9px] font-mono font-bold mb-2 uppercase",
                    overdue ? "text-red-400" : "text-orange-400"
                )}>
                    <AlertTriangle size={9} />
                    {overdue ? "DEADLINE PASSED" : `${daysLeft}D LEFT`}
                </div>
            )}

            {/* Header row */}
            <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <ShoppingBag size={14} className="text-purple-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-bold font-mono text-white truncate">{goal.title}</p>
                        {goal.description && (
                            <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{goal.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onEdit(goal)}
                        className="cursor-pointer text-zinc-600 hover:text-blue-400 transition-colors p-1 opacity-0 group-hover:opacity-100">
                        <Edit2 size={11} />
                    </button>
                    <button onClick={() => onDelete(goal.id)}
                        className="cursor-pointer text-zinc-600 hover:text-red-400 transition-colors p-1">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Price + deadline row */}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
                <div className="flex items-center gap-1.5 bg-zinc-800/60 rounded-lg px-2.5 py-1.5">
                    <Package size={11} className="text-zinc-400" />
                    <span className="text-xs font-bold font-mono text-white">{fmt(price)}</span>
                </div>
                {goal.deadline && (
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500">
                        <Clock size={10} />
                        {new Date(goal.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                )}
                <button onClick={() => onComplete(goal.id)}
                    className="cursor-pointer ml-auto flex items-center gap-1 text-[10px] font-mono text-green-400 border border-green-500/30 px-2.5 py-1 rounded-lg hover:bg-green-500/10 transition-all">
                    <CheckCircle size={10} />
                    GOT IT!
                </button>
            </div>

            {/* Notes */}
            {goal.notes && (
                <p className="mt-2 text-[9px] font-mono text-zinc-600 italic border-l border-zinc-700 pl-2">
                    {goal.notes}
                </p>
            )}

            {/* Purchase Options */}
            <PurchaseOptions goal={goal} monthlySavings={monthlySavings} />
        </div>
    );
}

// ── Add / Edit Form ────────────────────────────────────────────────────
function GoalForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const [showEmi, setShowEmi] = useState(!!(initial?.emiMonths));

    const inp = "rounded border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 text-sm text-white font-mono placeholder:text-zinc-600 focus:outline-none focus:border-purple-500 w-full";
    const lbl = "text-[9px] font-mono text-zinc-500 uppercase tracking-wide mb-1 block";

    return (
        <div className="rounded-xl border border-purple-500/20 bg-zinc-900/80 p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-mono font-bold text-purple-300 uppercase tracking-widest flex items-center gap-2">
                    <Star size={11} /> {initial ? 'EDIT WISH' : 'NEW WISH'}
                </h4>
                <button onClick={onCancel} className="cursor-pointer text-zinc-500 hover:text-white"><X size={14} /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className={lbl}>Item Name *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                        placeholder="e.g. Hair Dryer, iPhone 16" className={inp} />
                </div>
                <div>
                    <label className={lbl}>Target Price (₹) *</label>
                    <input type="number" value={form.targetAmount} onChange={e => setForm(f => ({ ...f, targetAmount: e.target.value }))}
                        placeholder="e.g. 3500" className={inp} />
                </div>
                <div>
                    <label className={lbl}>Current Market Price (₹)</label>
                    <input type="number" value={form.currentPrice} onChange={e => setForm(f => ({ ...f, currentPrice: e.target.value }))}
                        placeholder="Optional – today's price" className={inp} />
                </div>
                <div>
                    <label className={lbl}>Want It By</label>
                    <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                        className={inp} />
                </div>
                <div className="sm:col-span-2">
                    <label className={lbl}>Description</label>
                    <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="e.g. for travel, birthday gift, home use..." className={inp} />
                </div>
            </div>

            {/* EMI Toggle */}
            <div>
                <button onClick={() => setShowEmi(v => !v)}
                    className="cursor-pointer flex items-center gap-2 text-[10px] font-mono text-blue-400 hover:text-blue-300 border border-blue-500/20 px-3 py-1.5 rounded-lg transition-all">
                    <CreditCard size={11} />
                    {showEmi ? 'HIDE EMI OPTIONS' : 'ADD EMI OPTIONS'}
                    {showEmi ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>

                {showEmi && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in slide-in-from-top-1 duration-150">
                        <div>
                            <label className={lbl}>Down Payment (₹)</label>
                            <input type="number" value={form.emiDownPayment} onChange={e => setForm(f => ({ ...f, emiDownPayment: e.target.value }))}
                                placeholder="0" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>No. of Months</label>
                            <input type="number" value={form.emiMonths} onChange={e => setForm(f => ({ ...f, emiMonths: e.target.value }))}
                                placeholder="e.g. 6" className={inp} />
                        </div>
                        <div>
                            <label className={lbl}>Monthly EMI (₹)</label>
                            <input type="number" value={form.emiMonthlyAmount} onChange={e => setForm(f => ({ ...f, emiMonthlyAmount: e.target.value }))}
                                placeholder="e.g. 600" className={inp} />
                        </div>
                    </div>
                )}
            </div>

            <div>
                <label className={lbl}>Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Any extra notes..." className={inp} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
                <button onClick={onCancel} className="cursor-pointer text-xs text-zinc-500 hover:text-white font-mono px-3 py-1.5 transition-colors">CANCEL</button>
                <button onClick={() => onSave(form)}
                    className="cursor-pointer flex items-center gap-1.5 text-xs font-bold bg-purple-600 text-white px-5 py-1.5 rounded-lg hover:bg-purple-500 font-mono transition-all shadow-lg shadow-purple-600/20">
                    <Save size={11} /> {initial ? 'SAVE CHANGES' : 'ADD TO WISHLIST'}
                </button>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function ShortTermGoals({ goals, setGoals, monthlySavings }) {
    const [showForm, setShowForm] = useState(false);
    const [editGoal, setEditGoal] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, title: '' });

    const shortGoals = goals.filter(g => g.priority === 'SHORT' && !g.completedAt);
    const completedGoals = goals.filter(g => g.priority === 'SHORT' && g.completedAt);

    async function handleAdd(form) {
        if (!form.title || !form.targetAmount) return;
        await addFinanceGoal(
            form.title, form.targetAmount, 'SHORT', form.deadline || null,
            form.description, form.currentPrice, form.emiDownPayment,
            form.emiMonths, form.emiMonthlyAmount, form.notes
        );
        setGoals(await getFinanceGoals());
        setShowForm(false);
    }

    async function handleEdit(form) {
        if (!form.title || !form.targetAmount) return;
        await updateShortTermGoal(editGoal.id, form);
        setGoals(await getFinanceGoals());
        setEditGoal(null);
    }

    async function handleComplete(id) {
        await completeGoal(id);
        setGoals(await getFinanceGoals());
    }

    function handleDelete(id) {
        const goal = goals.find(g => g.id === id);
        setConfirmDelete({ show: true, id, title: goal?.title || 'this item' });
    }

    async function executeDelete(id) {
        await deleteFinanceGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
        setConfirmDelete({ show: false, id: null, title: '' });
    }

    return (
        <div className="space-y-6">
            {/* Header row */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">SYSTEM MODULE</p>
                    <h2 className="text-xl font-bold font-mono flex items-center gap-2 mt-0.5">
                        <ShoppingBag size={18} className="text-purple-400" />
                        Wish List
                    </h2>
                </div>
                {!showForm && !editGoal && (
                    <button onClick={() => setShowForm(true)}
                        className="cursor-pointer flex items-center gap-1.5 text-xs font-mono font-bold text-purple-400 border border-purple-500/30 bg-purple-500/10 px-4 py-2 rounded-lg hover:bg-purple-500/20 transition-all">
                        <Plus size={12} /> NEW WISH
                    </button>
                )}
            </div>

            {/* Stats row */}
            {shortGoals.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">ITEMS</p>
                        <p className="text-xl font-black font-mono text-white mt-1">{shortGoals.length}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">TOTAL COST</p>
                        <p className="text-xl font-black font-mono text-purple-300 mt-1">
                            {fmt(shortGoals.reduce((s, g) => s + (g.currentPrice || g.targetAmount), 0))}
                        </p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 text-center">
                        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">COMPLETED</p>
                        <p className="text-xl font-black font-mono text-green-400 mt-1">{completedGoals.length}</p>
                    </div>
                </div>
            )}

            {/* Add form */}
            {showForm && <GoalForm onSave={handleAdd} onCancel={() => setShowForm(false)} />}

            {/* Edit form */}
            {editGoal && (
                <GoalForm
                    initial={{
                        title: editGoal.title,
                        targetAmount: editGoal.targetAmount?.toString() || '',
                        description: editGoal.description || '',
                        currentPrice: editGoal.currentPrice?.toString() || '',
                        deadline: editGoal.deadline ? new Date(editGoal.deadline).toISOString().split('T')[0] : '',
                        emiDownPayment: editGoal.emiDownPayment?.toString() || '',
                        emiMonths: editGoal.emiMonths?.toString() || '',
                        emiMonthlyAmount: editGoal.emiMonthlyAmount?.toString() || '',
                        notes: editGoal.notes || '',
                    }}
                    onSave={handleEdit}
                    onCancel={() => setEditGoal(null)}
                />
            )}

            {/* Empty state */}
            {shortGoals.length === 0 && !showForm && (
                <div className="rounded-xl border border-dashed border-zinc-700 p-12 text-center">
                    <ShoppingBag size={32} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm font-mono text-zinc-600">No wishlist items yet.</p>
                    <p className="text-xs font-mono text-zinc-700 mt-1">Add things you want to buy — gadgets, appliances, anything!</p>
                </div>
            )}

            {/* Active goals grid */}
            {!editGoal && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {shortGoals.map(goal => (
                        <GoalCard
                            key={goal.id}
                            goal={goal}
                            monthlySavings={monthlySavings}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            onEdit={g => { setEditGoal(g); setShowForm(false); }}
                        />
                    ))}
                </div>
            )}

            {/* Completed archive */}
            {completedGoals.length > 0 && (
                <div className="rounded-xl border border-green-500/10 bg-green-500/5 overflow-hidden">
                    <p className="text-[9px] text-green-400 font-mono uppercase tracking-widest px-4 py-3 border-b border-green-500/10 flex items-center gap-2">
                        <CheckCircle size={10} /> Acquired ({completedGoals.length})
                    </p>
                    <div className="divide-y divide-zinc-800/40">
                        {completedGoals.map(g => (
                            <div key={g.id} className="flex items-center justify-between px-4 py-2.5">
                                <div className="flex items-center gap-2">
                                    <CheckCircle size={13} className="text-green-400" />
                                    <p className="text-xs font-mono text-zinc-400 line-through">{g.title}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-mono text-zinc-500">
                                        {g.completedAt ? new Date(g.completedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                                    </span>
                                    <span className="text-xs font-mono text-green-400">{fmt(g.currentPrice || g.targetAmount)}</span>
                                    <button onClick={() => handleDelete(g.id)} className="cursor-pointer text-zinc-700 hover:text-red-400">
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete confirmation modal */}
            {confirmDelete.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-xl border border-red-500/30 bg-zinc-950 p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertTriangle size={22} />
                            <h3 className="font-mono text-sm font-bold uppercase tracking-widest">REMOVE_ITEM</h3>
                        </div>
                        <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
                            Remove <span className="text-white font-bold">"{confirmDelete.title}"</span> from your wish list?
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete({ show: false, id: null, title: '' })}
                                className="flex-1 py-1.5 rounded border border-zinc-800 text-zinc-400 hover:bg-zinc-900 font-mono text-[9px] uppercase tracking-widest transition-all">
                                ABORT
                            </button>
                            <button onClick={() => executeDelete(confirmDelete.id)}
                                className="flex-1 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-[9px] uppercase tracking-widest transition-all">
                                CONFIRM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
