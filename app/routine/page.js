
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
            </div>
        </div>
    );
}
