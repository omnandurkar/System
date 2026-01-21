
export default function FuelPage() {
    return (
        <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">FUEL SYSTEM</h1>
                <p className="text-muted-foreground">Vegetarian. Budget-friendly. Consistent.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="mb-4 font-semibold text-primary">MORNING OPTIONS</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Oats + Milk + Peanuts</li>
                        <li>Peanut Butter Bread + Milk</li>
                    </ul>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="mb-4 font-semibold text-primary">POST-WORKOUT</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Banana</li>
                        <li>Chana (Chickpeas)</li>
                        <li>Peanuts</li>
                        <li>Milk (if possible)</li>
                    </ul>
                </div>

                <div className="col-span-full rounded-xl border border-border bg-card p-6">
                    <h3 className="mb-4 font-semibold text-primary">DINNER STAPLES</h3>
                    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                        <li>Rice + Dal (Lentils)</li>
                        <li>Veg Sabzi + Roti</li>
                        <li>Paneer / Soya Chunks (Protein Source)</li>
                    </ul>
                </div>
            </div>

            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                <p>NO FANCY DIETS.</p>
                <p>CONSISTENCY {'>'} PERFECTION.</p>
            </div>
        </div>
    );
}
