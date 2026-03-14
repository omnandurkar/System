'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/AppSidebar';
import { AuraEffects } from '@/components/AuraEffects';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemLogo, SystemTitle } from '@/components/SystemLogo';

export default function Layout({ children, user }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const pathname = usePathname();
    const isAuthPage = ['/login', '/signup'].some(path => pathname?.startsWith(path));

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    if (isAuthPage) {
        return <>{children}</>;
    }

    const streak = user?.currentStreak || 0;
    const bestStreak = user?.bestStreak || 0;
    const currentTheme = user?.currentTheme;

    return (
        <div className={cn(
            "flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-500",
            currentTheme === 'theme_shadow_purple' && "bg-slate-950 selection:bg-purple-500/30",
            currentTheme === 'theme_blood_red' && "bg-rose-950 selection:bg-red-500/30"
        )}>
            {/* Theme Overlay Gradients */}
            {currentTheme === 'theme_shadow_purple' && (
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/20 via-slate-950/0 to-slate-950/0" />
            )}
            {currentTheme === 'theme_blood_red' && (
                <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-rose-950/0 to-rose-950/0" />
            )}
            <AuraEffects streak={streak} bestStreak={bestStreak} />

            {/* Desktop Sidebar - Strictly hidden on mobile, visible on desktop */}
            <aside className="hidden md:block w-72 shrink-0 border-r border-zinc-800">
                <AppSidebar streak={streak} />
            </aside>

            {/* Mobile Drawer Overlay - Strictly hidden on desktop */}
            <div
                className={cn(
                    "fixed inset-0 z-[100] md:hidden transition-all duration-300",
                    isMobileMenuOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
                )}
            >
                {/* Backdrop Layer - Blur only applies here */}
                <div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                />

                {/* Drawer Content */}
                <div
                    className={cn(
                        "absolute left-0 top-0 bottom-0 w-72 bg-zinc-950 border-r border-zinc-800 shadow-2xl transform transition-transform duration-300",
                        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    )}
                >
                    <div className="flex flex-col h-full relative">
                        {/* Close Button */}
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white z-20"
                        >
                            <X className="h-6 w-6" />
                        </button>

                        {/* Sidebar Content */}
                        <div className="flex-1 overflow-y-auto py-2">
                            <AppSidebar streak={streak} onNavigate={() => setIsMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full w-full relative overflow-hidden">
                {/* Mobile Header - Strictly hidden on desktop */}
                <header className="md:hidden flex-none sticky top-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-5">
                    <div className="flex items-center gap-5">
                        <SystemLogo size={36} />
                        <SystemTitle />
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(true)}
                        className="p-2 -mr-2 text-zinc-400 hover:text-white rounded-md"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-12">
                    <div className="max-w-7xl mx-auto space-y-10">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
