'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Dumbbell, Utensils, Moon, Shield, LogOut, Archive, Terminal, Wallet, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logoutUser } from '@/app/auth-actions';
import { ThemeToggle } from '@/components/ThemeToggle';
import { SystemLogo, SystemTitle } from '@/components/SystemLogo';


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
            "relative flex h-full w-full flex-col items-center border-r border-border bg-card pt-12 pb-8 md:w-72 overflow-hidden text-clip",
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

            <div className="relative z-10 space-y-4 w-full flex flex-col h-full items-start px-8">
                <div className=" flex items-center pt-2  space-x-2 justify-start gap-5 w-full">
                    <SystemLogo size={42} glow={true} className="shrink-0 pr-2 drop-shadow-[0_0_20px_rgba(59,130,246,0.2)]" />
                    <div className=" md:block overflow-hidden">
                        <SystemTitle />
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-2 w-full">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    "group flex h-10 w-full items-center justify-start rounded-xl px-4 text-xs font-mono uppercase tracking-widest transition-all",
                                    isActive
                                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                                        : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent",
                                    "md:w-full"
                                )}
                            >
                                <item.icon className={cn("h-4 w-4 mr-3 transition-transform group-hover:scale-110", isActive && "text-blue-400")} />
                                <span className=" md:block">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="mt-auto w-full space-y-2 pt-4 border-t border-zinc-800/50">
                    <form action={logoutUser}>
                        <button
                            type="submit"
                            className={cn(
                                "group flex h-10 w-full items-center justify-start rounded-xl px-4 text-xs font-mono uppercase tracking-widest text-red-500/60 transition-all hover:bg-red-500/10 hover:text-red-500",
                                "md:w-full"
                            )}
                        >
                            <LogOut className="h-4 w-4 mr-3" />
                            <span className=" md:block">Terminate Session</span>
                        </button>
                    </form>
                </div>

                <div className=" w-full flex items-center justify-between opacity-40 hover:opacity-100 transition-opacity">
                    <p className=" text-[8px] font-mono text-zinc-500 md:block uppercase tracking-[0.2em]">
                        v1.6.0-PROXIMA // SYSTEM
                    </p>
                    <Link href="/architect" className="text-zinc-500 hover:text-blue-400 transition-colors p-1" title="The Architect">
                        <Info className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
