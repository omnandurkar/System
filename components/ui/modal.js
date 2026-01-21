'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        if (isOpen) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-zinc-800 bg-[#09090b] p-6 shadow-2xl sm:rounded-lg"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold leading-none tracking-tight text-white">{title}</h2>
                            <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100">
                                <X className="h-4 w-4 text-zinc-400" />
                                <span className="sr-only">Close</span>
                            </button>
                        </div>
                        <div className="mt-2">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function Input({ label, ...props }) {
    return (
        <div className="grid gap-2">
            {label && <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-200">{label}</label>}
            <input
                className="flex h-9 w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:cursor-not-allowed disabled:opacity-50 text-zinc-200"
                {...props}
            />
        </div>
    );
}

export function Button({ variant = 'default', className, ...props }) {
    const variants = {
        default: "bg-zinc-50 text-zinc-900 hover:bg-zinc-50/90",
        destructive: "bg-red-900 text-zinc-50 hover:bg-red-900/90",
        outline: "border border-zinc-800 bg-transparent hover:bg-zinc-800 text-zinc-50",
        ghost: "hover:bg-zinc-800 text-zinc-50",
    };

    return (
        <button
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`}
            {...props}
        />
    );
}
