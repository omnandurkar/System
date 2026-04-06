'use client';

import { useState, useEffect } from 'react';
import { X, Brain, Landmark, ChevronLeft } from 'lucide-react';
import dynamic from 'next/dynamic';
import { getNetWorthAssets } from '@/app/finance-actions';
import FinanceCinematic from './FinanceCinematic';

const PurchaseAdvisor = dynamic(() => import('./PurchaseAdvisor'), { ssr: false });
const NetWorthHub = dynamic(() => import('./NetWorthHub'), { ssr: false });

export default function AdvancedFinancePanel({ onClose, monthlySavings, monthlyExpenses }) {
    const [showCinematic, setShowCinematic] = useState(true);
    const [activeTab, setActiveTab] = useState('ADVISOR');
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadAssets() {
            const data = await getNetWorthAssets();
            setAssets(data);
            setLoading(false);
        }
        loadAssets();
    }, []);

    if (showCinematic) {
        return <FinanceCinematic onComplete={() => setShowCinematic(false)} />;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
            <div className="relative w-full h-full max-w-5xl md:h-[85vh] md:rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden flex flex-col">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-zinc-900 bg-zinc-900/50 gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="p-2 -ml-2 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors"
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <div>
                                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none mb-1">Advanced Terminal</p>
                                <h2 className="text-base sm:text-lg font-bold font-mono text-white leading-none">Intelligence Engine</h2>
                            </div>
                        </div>
                        {/* Close button - only show on mobile next to title */}
                        <button
                            onClick={onClose}
                            className="sm:hidden p-2 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-zinc-800 w-full sm:w-auto">
                            <button
                                onClick={() => setActiveTab('NETWORTH')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${activeTab === 'NETWORTH' ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <Landmark size={14} />
                                <span className="hidden sm:inline">NET_WORTH_HUB</span>
                                <span className="sm:hidden">NET WORTH</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('ADVISOR')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${activeTab === 'ADVISOR' ? 'bg-zinc-800 text-yellow-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <Brain size={14} />
                                <span className="hidden sm:inline">PURCHASE_ADVISOR</span>
                                <span className="sm:hidden">ADVISOR</span>
                            </button>
                        </div>

                        {/* Close button - only show on desktop */}
                        <button
                            onClick={onClose}
                            className="hidden sm:flex p-2 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-all shadow-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-600 font-mono">
                            <div className="w-12 h-12 border-2 border-zinc-800 border-t-yellow-500 rounded-full animate-spin" />
                            <p className="text-xs uppercase tracking-[0.3em]">Accessing Classified Data...</p>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-700">
                            {activeTab === 'ADVISOR' ? (

                                <PurchaseAdvisor monthlySavings={monthlySavings} />
                            ) : (
                                <NetWorthHub
                                    assets={assets}
                                    setAssets={setAssets}
                                    monthlySavings={monthlySavings}
                                    monthlyExpenses={monthlyExpenses}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Decor */}
                <div className="px-6 py-2 border-t border-zinc-900 bg-zinc-950 flex justify-between items-center opacity-30">
                    <p className="text-[8px] font-mono text-zinc-700 uppercase tracking-tighter">System.v2.Finance.Modules.v1.04 — Secured Access</p>
                    <div className="flex gap-2">
                        <div className="w-1 h-1 rounded-full bg-zinc-800 animate-pulse" />
                        <div className="w-1 h-1 rounded-full bg-zinc-800 animate-pulse [animation-delay:200ms]" />
                        <div className="w-1 h-1 rounded-full bg-zinc-800 animate-pulse [animation-delay:400ms]" />
                    </div>
                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #27272a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3f3f46;
                }
            `}</style>
        </div>
    );
}