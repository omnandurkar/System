'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, Moon, Shield, LogOut, Archive, Terminal, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/app/auth-actions';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Routine', href: '/routine', icon: CheckSquare },
    { name: 'Gym & Box', href: '/gym', icon: Dumbbell },
    { name: 'Fuel', href: '/fuel', icon: Utensils },
    { name: 'Recovery', href: '/recovery', icon: Moon },
    { name: 'Treasury', href: '/finance', icon: Wallet },
    { name: 'Archives', href: '/history', icon: Archive },
    { name: 'Logs', href: '/system-logs', icon: Terminal },
    { name: 'Admin', href: '/admin', icon: Shield },
];

export function AppSidebar({ onNavigate, streak }) {
    const pathname = usePathname();
    const hasDarkEnergy = streak >= 7;

    return (
        <div className={cn(
            "relative flex h-full w-full flex-col items-center border-r border-border bg-card py-8 md:w-64 overflow-hidden text-clip",
            hasDarkEnergy && "border-purple-900/30"
        )}>
            {hasDarkEnergy && (
                <>
                    {/* Dark Energy Smoke Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
                        <div className="absolute -inset-[100%] bg-[radial-gradient(circle_at_50%_50%,rgba(88,28,135,0.4),transparent_50%)] animate-[spin_10s_linear_infinite]" />
                        <div className="absolute -inset-[100%] bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0.8),transparent_40%)] animate-[spin_15s_linear_infinite_reverse]" />
                    </div>
                    {/* Bottom flame hint */}
                    <div className="absolute bottom-0 w-full h-32 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none z-0 animate-pulse" />
                </>
            )}

            <div className="relative z-10 w-full flex flex-col h-full items-center">
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
                                <span className=" ms-2 md:block">{item.name}</span>
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
        </div>
    );
}
