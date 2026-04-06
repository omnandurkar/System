
export default function RoutinePage() {
    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">THE PROTOCOL</h1>
                <p className="text-muted-foreground">Non-negotiables.</p>
            </div>

            <div className="space-y-6">
                <section>
                    <h3 className="mb-2 font-bold text-foreground">MORNING</h3>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                        <p>06:15 Start. No phone first 20 mins. Make bed immediately.</p>
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 font-bold text-foreground">WORK</h3>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                        <p>Do the job properly. No slacking. This funds the mission.</p>
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 font-bold text-foreground">NIGHT RULES</h3>
                    <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                        <ul className="list-disc list-inside space-y-1">
                            <li>No Reels / Scrolling</li>
                            <li>No "Just one video"</li>
                            <li>Read physical books before sleep</li>
                        </ul>
                    </div>
                </section>

                <section>
                    <h3 className="mb-2 font-bold text-foreground">FULL DAILY SCHEDULE</h3>
                    <div className="space-y-3">

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">5:30 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Wake up — NO phone golden rule</p>
                                <p className="text-muted-foreground">Alarm off → washroom → 1 glass water → soak masala oats in water (2 min job) → shoes on → go.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">5:45 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Morning run — 25–30 min cardio</p>
                                <p className="text-muted-foreground">Zone 2 jog (easy pace, can talk). Burns face fat, builds stamina. Consistency {'>'} speed.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">6:15 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Garden pull-up bar — upper body</p>
                                <p className="text-muted-foreground">3–5 sets of max pull-ups. Even 2–3 reps daily = huge progress in 2 months. Dead hangs if can't do full reps yet.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">6:30 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Cook + eat home breakfast — muscle fuel</p>
                                <p className="text-muted-foreground">Cook one sabji (15 min). Eat: soaked oats + banana shake (oats+banana+milk) + sprouts bowl + sabji.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">7:20 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Morning study — 30 min DSA / System Design</p>
                                <p className="text-muted-foreground">Fresh brain = best learning. 1 LeetCode problem OR 2 pages system design. Phone in other room. No YouTube.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">7:55 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Shower + pack bag + ready</p>
                                <p className="text-muted-foreground">Gym bag already packed from night before. Outfit already ready. Leave flat by 8:00 AM sharp.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">8:00 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Leave flat → reach office by 8:30</p>
                                <p className="text-muted-foreground">Commute: listen to tech podcast or system design audio. No social media scrolling.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">9:40 AM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Office breakfast — light top-up snack</p>
                                <p className="text-muted-foreground">Eat light — fruit/poha/idli. Your real breakfast is already done. This is just a bridge.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">12:45 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Lunch — BIGGEST meal of day — muscle fuel</p>
                                <p className="text-muted-foreground">Dal + rice + sabji + roti. Eat maximum here. Ask for extra dal. Don't skip or eat half.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">3:30 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Muesli + milk — pre-gym fuel snack</p>
                                <p className="text-muted-foreground">1 cup muesli + full cream milk + optional banana. Eat 90 min before gym. Prevents energy crash.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">5:30 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Office → GYM (near office) — strength</p>
                                <p className="text-muted-foreground">Straight from office. Don't go home first — you won't go back. Bag is with you. 60–70 min session.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">7:00 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Post-gym milk + banana — recovery</p>
                                <p className="text-muted-foreground">1 glass full cream milk within 30 min of gym ending. Casein + protein for overnight muscle repair.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">7:30 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Commute home + cook dinner</p>
                                <p className="text-muted-foreground">Cook fresh: dal+rice OR roti+paneer/rajma. 20–25 min. While cooking: soak tomorrow's sprouts.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">8:00 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Shower before dinner</p>
                                <p className="text-muted-foreground">Post-gym + commute shower. Wind down, feel fresh for study. Eat dinner after.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">8:30 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Main study session — 90 min DSA + System Design</p>
                                <p className="text-muted-foreground">Phone in another room. 45 min DSA + 45 min system design. This is your job-switch investment.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">10:00 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">Night prep — 10 min</p>
                                <p className="text-muted-foreground">Keep tomorrow's outfit ready. Pack gym T-shirt in bag. Check sprouts soaking. Set 5:30 alarm. Phone down.</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start">
                            <span className="text-muted-foreground font-medium min-w-[60px]">10:30 PM</span>
                            <div>
                                <p className="font-semibold text-foreground mb-1">SLEEP — non-negotiable</p>
                                <p className="text-muted-foreground">7 hours minimum. Muscles grow during sleep. This is as important as the gym itself.</p>
                            </div>
                        </div>

                    </div>
                </section>
            </div>
        </div>
    );
}
