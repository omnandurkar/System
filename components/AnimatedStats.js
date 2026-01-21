'use client';

import { motion } from 'framer-motion';

export function AnimatedStats({ user, nextLevelExp, progress }) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
            >
                <h3 className="text-sm font-medium text-muted-foreground">IDENTITY LEVEL</h3>
                <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{user.level}</span>
                    <span className="text-sm text-muted-foreground">OPERATOR</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <motion.div
                        className="h-full bg-foreground"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, ease: "circOut" }}
                    />
                </div>
                <p className="mt-2 text-right text-xs text-muted-foreground">{user.exp} / {nextLevelExp} XP</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-border bg-card p-6"
            >
                <h3 className="text-sm font-medium text-muted-foreground">CURRENT STREAK</h3>
                <div className="mt-2 text-4xl font-bold">{user.current_streak} <span className="text-lg font-normal text-muted-foreground">DAYS</span></div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-xl border border-border bg-card p-6"
            >
                <h3 className="text-sm font-medium text-muted-foreground">DISCIPLINE SCORE</h3>
                <div className="mt-2 text-4xl font-bold">--%</div>
            </motion.div>
        </div>
    );
}
