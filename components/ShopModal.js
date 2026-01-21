'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Zap, Loader2, Shield, Palette, Frame } from 'lucide-react';
import { purchaseItem } from '@/app/actions';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

const SHOP_ITEMS = [
    {
        id: 'potion_rest_day',
        name: 'Rest Day Potion',
        description: 'Skip a day without losing your streak.',
        cost: 50,
        icon: Shield,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20'
    },
    {
        id: 'theme_shadow_purple',
        name: 'Shadow Purple',
        description: 'Unlock the "Shadow Purple" system theme.',
        cost: 100,
        icon: Palette,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20'
    },
    {
        id: 'theme_blood_red',
        name: 'Blood Red',
        description: 'Unlock the "Blood Red" system theme.',
        cost: 100,
        icon: Palette,
        color: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20'
    },
    {
        id: 'frame_gold',
        name: 'Gold Frame',
        description: 'A legendary border for your avatar.',
        cost: 250,
        icon: Frame,
        color: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20'
    }
];

export function ShopModal({ isOpen, onClose, userGold }) {
    const [buying, setBuying] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handlePurchase = async (item) => {
        if (userGold < item.cost) return;
        setBuying(item.id);

        try {
            const res = await purchaseItem(item.cost, item.id);
            if (res.success) {
                confetti({
                    particleCount: 50,
                    spread: 60,
                    origin: { y: 0.7 },
                    colors: ['#FFD700', '#FFA500'] // Gold colors
                });
                // Optimistic UI update could happen here, but we rely on revalidatePath
            } else {
                alert(res.message || "Purchase failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setBuying(null);
        }
    };

    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-4xl h-[80vh] bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-zinc-800 bg-zinc-900/50">
                            <div className="flex items-center gap-3">
                                <ShoppingBag className="h-6 w-6 text-yellow-500" />
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                                    The Shop
                                </h2>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
                                    <Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                    <span className="font-mono font-bold text-yellow-500">{userGold} G</span>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                    <X className="h-6 w-6 text-zinc-400" />
                                </button>
                            </div>
                        </div>

                        {/* Grid Content */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {SHOP_ITEMS.map((item) => (
                                    <div
                                        key={item.id}
                                        className={cn(
                                            "relative group flex flex-col p-6 rounded-lg border transition-all duration-300",
                                            "hover:scale-[1.02] active:scale-[0.98]",
                                            "bg-zinc-900/50 hover:bg-zinc-900",
                                            item.border
                                        )}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={cn("p-3 rounded-md", item.bg)}>
                                                <item.icon className={cn("h-6 w-6", item.color)} />
                                            </div>
                                            <div className="px-2 py-1 bg-black/50 rounded border border-zinc-800 text-xs font-mono text-zinc-400">
                                                ITEM
                                            </div>
                                        </div>

                                        <h3 className={cn("text-lg font-bold mb-1 transition-colors", item.color)}>
                                            {item.name}
                                        </h3>
                                        <p className="text-sm text-zinc-400 mb-6 line-clamp-2">
                                            {item.description}
                                        </p>

                                        <div className="mt-auto">
                                            <button
                                                onClick={() => handlePurchase(item)}
                                                disabled={userGold < item.cost || buying === item.id}
                                                className={cn(
                                                    "w-full py-3 px-4 rounded font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2",
                                                    userGold >= item.cost
                                                        ? "bg-white text-black hover:bg-yellow-400"
                                                        : "bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50"
                                                )}
                                            >
                                                {buying === item.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <>
                                                        <span>{item.cost} G</span>
                                                        {userGold < item.cost && <span className="text-[10px] ml-1 opacity-70">(Not enough)</span>}
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
}
