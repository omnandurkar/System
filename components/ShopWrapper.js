'use client';

import { useState } from 'react';
import { ShoppingBag, Zap } from 'lucide-react';
import { ShopModal } from '@/components/ShopModal';
import { cn } from '@/lib/utils';

export function ShopWrapper({ userGold }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "flex items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-4 py-2 text-sm font-medium text-yellow-500 transition-colors hover:bg-yellow-500/20",
                    "shadow-[0_0_10px_rgba(234,179,8,0.2)]"
                )}
            >
                <ShoppingBag className="h-4 w-4" />
                <span className="font-mono font-bold">{userGold} G</span>
            </button>

            <ShopModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                userGold={userGold}
            />
        </>
    );
}
