"use client";

import { useState } from "react";
import { BookOpen, X, Info } from "lucide-react";

export function GymGuideModal() {
    const [isOpen, setIsOpen] = useState(false);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="flex items-center gap-2 rounded-md bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-sm font-semibold text-zinc-100 transition-colors border border-zinc-700"
            >
                <BookOpen className="h-4 w-4" />
                Guide
            </button>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 hide-scrollbar">

                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between pb-4 bg-card/90 backdrop-blur-sm border-b border-border">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        GYM PROTOCOL GUIDE
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="rounded-full p-2 hover:bg-zinc-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5 text-zinc-400 hover:text-white" />
                    </button>
                </div>

                <div className="mt-6 space-y-8">
                    {/* Weekly Split section */}
                    <section>
                        <h3 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                            WEEKLY GYM SPLIT <span className="text-sm font-normal text-muted-foreground">— 6 Days</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
                                <div className="font-bold text-lg mb-1">Mon — Push</div>
                                <div className="text-sm text-zinc-400 mb-2">Chest + Shoulders + Triceps.</div>
                                <div className="text-sm">Bench press, OHP, lateral raises, dips, skull crushers</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
                                <div className="font-bold text-lg mb-1">Tue — Pull</div>
                                <div className="text-sm text-zinc-400 mb-2">Back + Biceps.</div>
                                <div className="text-sm">Pull-downs, rows, barbell curls, hammer curls</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 border-l-4 border-l-primary">
                                <div className="font-bold text-lg mb-1">Wed — Legs</div>
                                <div className="text-sm text-zinc-400 mb-2">Squats, leg press, leg curls, calf raises.</div>
                                <div className="text-sm italic">Don't skip — legs = testosterone = muscle everywhere</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
                                <div className="font-bold text-lg mb-1">Thu — Push</div>
                                <div className="text-sm text-zinc-400 mb-2">Incline press, cable flyes, shoulder press, skull crushers</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4">
                                <div className="font-bold text-lg mb-1">Fri — Pull</div>
                                <div className="text-sm text-zinc-400 mb-2">Deadlift (key!), pull-ups, face pulls, concentration curls</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 border-l-4 border-l-yellow-500">
                                <div className="font-bold text-lg mb-1">Sat — Weak Spots</div>
                                <div className="text-sm text-zinc-400 mb-2">Extra chest + shoulder work.</div>
                                <div className="text-sm">Focus on what's lagging</div>
                            </div>

                            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-4 col-span-1 md:col-span-2 border-l-4 border-l-green-500">
                                <div className="font-bold text-lg mb-1">Sun — Rest</div>
                                <div className="text-sm text-zinc-400">Full rest or light walk. Muscles grow on rest days</div>
                            </div>
                        </div>
                    </section>

                    <hr className="border-border" />

                    {/* Priority Exercises */}
                    <section>
                        <div className="mb-4">
                            <h3 className="text-xl font-semibold text-primary">PRIORITY EXERCISES</h3>
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <Info className="h-4 w-4" /> For the main goal: Chest + Shoulders + Arms
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Flat Bench Press</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">4 sets × 8–10 reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">King of chest. Full range of motion — feel the stretch at the bottom. This is what makes chest wide and full in T-shirts. Increase weight every 2 weeks.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Overhead Press (OHP)</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">4 sets × 8–10 reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Best exercise for wider shoulders. Builds the "cap" look that makes T-shirts look great. Do seated dumbbell or standing barbell.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Lateral Raises</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">4 sets × 12–15 reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Secret weapon for wide-looking shoulders. Light weight, controlled. Gives you the V-taper that makes your waist look smaller even without losing weight.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Incline Dumbbell Press</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">3 sets × 10 reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Upper chest filler. This is what gives fullness from collar to chest. Key for the fitted shirt look.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100 flex items-center gap-2">Pull-ups <span className="text-xs font-normal text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">Garden Bar</span></h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">3–5 sets × max reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Best back + bicep builder with no equipment. Even 2–3 reps daily compounds fast. In 3 months you'll be doing 10+ clean reps. Do this every single morning.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Dips</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">3 sets × max reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Builds lower chest + triceps. Use parallel bars every chest day. Massive effect on arm + chest appearance.</p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                    <h4 className="font-bold text-lg text-zinc-100">Barbell/Dumbbell Curls</h4>
                                    <span className="text-xs font-mono bg-zinc-800 px-2 py-1 rounded text-zinc-300">3 sets × 10–12 reps</span>
                                </div>
                                <p className="text-sm text-zinc-400">Bicep peak that shows in T-shirt sleeves. Slow the negative (lowering) phase — that's where growth happens.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
