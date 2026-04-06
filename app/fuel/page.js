"use client";

import { useState } from "react";
import { Info, Utensils, ShoppingBasket, Target, Zap, Clock } from "lucide-react";

export default function FuelPage() {
    const [selectedDay, setSelectedDay] = useState("Mon");

    const dinnerMeals = {
        Mon: { title: "Dal Tadka + Rice", time: "20 min", prep: "Cook fresh", protein: "Medium" },
        Tue: { title: "Paneer Bhurji + 3 Rotis", time: "15 min", prep: "Cook fresh", protein: "High" },
        Wed: { title: "Rajma + Rice", time: "Varies", prep: "Soak morning or use canned", protein: "High" },
        Thu: { title: "Chhole + Roti", time: "15 min", prep: "Use canned chhole", protein: "High" },
        Fri: { title: "Moong Dal Khichdi", time: "20 min", prep: "One pot, super easy", protein: "Medium" },
        Sat: { title: "Tofu Bhurji + Roti", time: "15 min", prep: "Best protein day of week", protein: "Highest" },
        Sun: { title: "Dal Palak + Rice", time: "25 min", prep: "Rest day — eat well", protein: "High" },
    };

    const days = Object.keys(dinnerMeals);

    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">FUEL SYSTEM</h1>
                <p className="text-muted-foreground">Vegetarian. Affordable. Consistent.</p>
            </div>

            {/* Macro Targets */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                    <Zap className="h-5 w-5 text-yellow-500 mb-2" />
                    <span className="text-2xl font-bold">2,700</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">kcal / day</span>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                    <Target className="h-5 w-5 text-red-500 mb-2" />
                    <span className="text-2xl font-bold">125g</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">protein / day</span>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                    <Utensils className="h-5 w-5 text-blue-500 mb-2" />
                    <span className="text-2xl font-bold">320g</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">carbs / day</span>
                </div>
                <div className="rounded-xl border border-border bg-card p-4 flex flex-col items-center justify-center text-center">
                    <span className="h-5 w-5 text-orange-500 flex items-center justify-center font-bold mb-2">F</span>
                    <span className="text-2xl font-bold">70g</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">fats / day</span>
                </div>
            </div>

            <div className="space-y-6">
                {/* Full Day Meals Timeline */}
                <section>
                    <h3 className="mb-4 font-bold text-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" /> FULL DAY MEALS
                    </h3>
                    <div className="space-y-3">
                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40 group-hover:bg-primary transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">6:30 AM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Home Breakfast</p>
                                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">~600 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>Masala oats soaked — 50g</li>
                                    <li>Banana shake (1 banana + 200ml milk + 2 tbsp oats)</li>
                                    <li>Sprouts bowl — 1 cup</li>
                                    <li>One sabji</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~28g protein · cook in 20 min</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-border group-hover:bg-primary/50 transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">9:40 AM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Office Snack</p>
                                    <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">~300 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>Whatever office serves (poha/idli/fruit)</li>
                                    <li>OR: 4 wholewheat biscuits + 1 banana</li>
                                    <li>1 glass water minimum</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~8g protein · keep light</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500/40 group-hover:bg-red-500 transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">12:45 PM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Lunch</p>
                                    <span className="text-xs font-mono text-red-500 bg-red-500/10 px-2 py-0.5 rounded">~750 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>1.5 bowls dal (high protein)</li>
                                    <li>1.5 cups rice or 3 rotis</li>
                                    <li>Sabji whatever is served</li>
                                    <li>Chaas/buttermilk if available</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~30g protein · eat maximum here</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500/40 group-hover:bg-blue-500 transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">3:30 PM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Pre-Gym</p>
                                    <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded">~350 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>1 cup muesli</li>
                                    <li>250ml full cream milk</li>
                                    <li>1 banana (optional)</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~15g protein · 90 min before gym</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500/40 group-hover:bg-green-500 transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">7:00 PM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Post-Gym</p>
                                    <span className="text-xs font-mono text-green-500 bg-green-500/10 px-2 py-0.5 rounded">~200 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>300ml full cream milk</li>
                                    <li>1 banana optional</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~12g protein · recovery window (within 30m)</p>
                            </div>
                        </div>

                        <div className="rounded-lg border border-border bg-card p-4 text-sm flex gap-4 items-start relative overflow-hidden group">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/40 group-hover:bg-purple-500 transition-colors"></div>
                            <span className="text-muted-foreground font-medium min-w-[70px]">8:30 PM</span>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                    <p className="font-semibold text-foreground">Dinner</p>
                                    <span className="text-xs font-mono text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded">~600 kcal</span>
                                </div>
                                <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mb-2">
                                    <li>See rotation below</li>
                                    <li>Dal + rice OR paneer sabji + rotis</li>
                                    <li>OR rajma/chhole + roti</li>
                                    <li>1 glass milk before bed</li>
                                </ul>
                                <p className="text-xs font-medium text-foreground opacity-80">~30g protein · cook fresh daily</p>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-border" />

                {/* Weekly Dinner Rotation */}
                <section>
                    <h3 className="mb-4 font-bold text-foreground">WEEKLY DINNER ROTATION</h3>
                    <div className="rounded-xl border border-border bg-card overflow-hidden">

                        {/* Day Tabs */}
                        <div className="flex overflow-x-auto hide-scrollbar border-b border-border bg-muted/30">
                            {days.map((day) => (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`flex-1 py-3 px-4 text-sm font-semibold transition-all min-w-[70px] ${selectedDay === day
                                            ? "bg-primary text-primary-foreground"
                                            : "text-muted-foreground hover:bg-muted"
                                        }`}
                                >
                                    {day}
                                </button>
                            ))}
                        </div>

                        {/* Active Day Info */}
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                <div>
                                    <h4 className="text-xl font-bold text-foreground mb-1">{dinnerMeals[selectedDay].title}</h4>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                                        <Info className="h-4 w-4" /> {dinnerMeals[selectedDay].prep}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <div className="bg-muted px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap">
                                        ⏱ {dinnerMeals[selectedDay].time}
                                    </div>
                                    <div className="bg-primary/20 text-primary px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap">
                                        Protein: {dinnerMeals[selectedDay].protein}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </section>

                <hr className="border-border" />

                {/* Weekly Buy List */}
                <section>
                    <h3 className="mb-4 font-bold text-foreground flex items-center gap-2">
                        <ShoppingBasket className="h-4 w-4 text-primary" /> WEEKLY BUY LIST
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            "Oats 1kg (~₹80)",
                            "Muesli 1kg (~₹200)",
                            "Milk daily 500ml",
                            "Bananas — buy 6 at a time",
                            "Paneer 200g × 3 times/week",
                            "Canned rajma/chhole (~₹40 each)",
                            "Moong/masoor dal",
                            "Rotis from dhaba (4 rotis = ₹20)",
                            "Sprouts — sprout moong at home",
                            "Peanut butter 1 jar"
                        ].map((item, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50">
                                <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                                <span className="text-sm font-medium">{item}</span>
                            </div>
                        ))}
                    </div>
                </section>

            </div>
        </div>
    );
}
