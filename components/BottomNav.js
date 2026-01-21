'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, Moon, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    { name: 'Home', href: '/', icon: LayoutDashboard },
    { name: 'Routine', href: '/routine', icon: CheckSquare },
    { name: 'Gym', href: '/gym', icon: Dumbbell },
    { name: 'Fuel', href: '/fuel', icon: Utensils },
    { name: 'Sleep', href: '/recovery', icon: Moon },
    { name: 'Admin', href: '/admin', icon: Shield },
];

export function BottomNav() {
    const pathname = usePathname();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/90 backdrop-blur pb-safe">
            <nav className="flex h-16 items-center justify-around px-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-1 rounded-lg p-2 transition-colors",
                                isActive ? "text-white" : "text-zinc-500 hover:text-zinc-300"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5", isActive && "fill-current")} />
                            <span className="text-[10px] font-mono uppercase tracking-tight">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
