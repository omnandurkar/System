'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, Moon, Shield, LogOut, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/app/auth-actions';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Routine', href: '/routine', icon: CheckSquare },
    { name: 'Gym & Box', href: '/gym', icon: Dumbbell },
    { name: 'Fuel', href: '/fuel', icon: Utensils },
    { name: 'Recovery', href: '/recovery', icon: Moon },
    { name: 'Archives', href: '/history', icon: Archive },
    { name: 'Admin', href: '/admin', icon: Shield },
];

export function AppSidebar({ onNavigate }) {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-full flex-col items-center border-r border-border bg-card py-8 md:w-64">
            <div className="mb-8 flex items-center justify-center">
                <div className="h-8 w-8 rounded-full bg-foreground" />
                <span className="ml-3 hidden text-lg font-bold tracking-tight md:block">
                    SYSTEM
                </span>
            </div>

            <nav className="flex flex-1 flex-col gap-2 px-2 w-full">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onNavigate}
                            className={cn(
                                "group flex h-10 w-full items-center justify-start rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                                isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                                "md:w-full"
                            )}
                        >
                            <item.icon className="h-5 w-5 md:mr-3" />
                            <span className="hidden md:block">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto w-full px-2 space-y-2">
                <form action={logoutUser}>
                    <button
                        type="submit"
                        className={cn(
                            "group flex h-10 w-full items-center justify-start rounded-md px-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10",
                            "md:w-full"
                        )}
                    >
                        <LogOut className="h-5 w-5 md:mr-3" />
                        <span className="hidden md:block">Logout</span>
                    </button>
                </form>
            </div>

            <div className="mt-4 px-4 text-center">
                <p className="hidden text-xs text-muted-foreground md:block">
                    v1.0.0 SYSTEM
                </p>
            </div>
        </div>
    );
}
