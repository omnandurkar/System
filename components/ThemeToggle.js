'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }) {
    const { theme, setTheme } = useTheme();

    return (
        <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className={cn(
                "flex h-9 w-9 items-center justify-center rounded-md border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
                className
            )}
        >
            <Sun className="h-[1.2rem] w-[1.2rem] scale-100 transition-all dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 transition-all dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </button>
    );
}
