'use client';

import Link from 'next/link';
import { ArrowLeft, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function ArchitectPage() {
    return (
        <div className="min-h-screen bg-[#050505] text-white font-mono overflow-auto relative selection:bg-blue-500/30">
            {/* System Grid Background Background */}
            <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
                {/* Scanning line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-[scan_6s_ease-in-out_infinite]" />
            </div>

            {/* Glowing Orbs */}
            <div className="fixed top-20 left-10 w-96 h-96 bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="fixed bottom-20 right-10 w-96 h-96 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 flex flex-col min-h-screen">
                {/* Header */}
                <header className="flex items-center justify-between mb-16 border-b border-blue-900/30 pb-6">
                    <Link href="/" className="group flex items-center space-x-2 text-zinc-400 hover:text-blue-400 transition-colors">
                        <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
                        <span className="uppercase tracking-widest text-sm">Return to System</span>
                    </Link>
                    <div className="flex items-center space-x-3 opacity-60">
                        <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />
                        <span className="text-red-500 text-xs tracking-[0.3em] uppercase">Auth Level: Absolute</span>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex flex-col space-y-12">

                    {/* Title Section */}
                    <div className="text-center space-y-4">
                        <div className="inline-flex items-center justify-center space-x-3 mb-2">
                            <Cpu className="h-8 w-8 text-blue-500" />
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-200 uppercase drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                                The Architect
                            </h1>
                            <Cpu className="h-8 w-8 text-blue-500" />
                        </div>
                        <p className="text-zinc-500 tracking-[0.4em] uppercase text-sm md:text-base">Entity Identification Protocol</p>
                    </div>

                    {/* HUD Panels Container */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Panel 1: Vision & Purpose */}
                        <div className="relative group p-8 rounded-2xl bg-black/40 border border-blue-900/50 backdrop-blur-sm overflow-hidden transition-all hover:border-blue-500/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)]">
                            <div className="absolute top-0 left-0 w-2 h-full bg-blue-600/50 group-hover:bg-blue-400 transition-colors" />
                            <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-blue-400/50 m-4 pointer-events-none" />
                            <div className="absolute top-0 right-0 w-8 h-8 border-t border-r border-blue-400/50 m-4 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b border-l border-blue-400/50 m-4 pointer-events-none" />
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b border-r border-blue-400/50 m-4 pointer-events-none" />

                            <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center uppercase tracking-widest">
                                <span className="mr-3 text-blue-500/50">_01</span>
                                Purpose & Vision
                            </h2>
                            <div className="space-y-4 text-zinc-300 text-sm leading-relaxed">
                                <p>
                                    This System was not forged by choice, but out of necessity. It is designed to track progress, optimize performance, and elevate the host beyond their natural limits.
                                </p>
                                <p>
                                    Inspired by the concepts of infinite growth and gamified progression, "The System" transforms mundane tasks into quests, turning life itself into an RPG where the only opponent is oneself.
                                </p>
                                <p>
                                    <span className="text-blue-300">"Arise."</span> Break your limits. Prove your worth to the System.
                                </p>
                            </div>
                        </div>

                        {/* Panel 2: Creator & Portfolio */}
                        <div className="relative group p-8 rounded-2xl bg-black/40 border border-purple-900/50 backdrop-blur-sm overflow-visible transition-all hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] z-20">
                            <div className="absolute top-0 right-0 w-2 h-full bg-purple-600/50 group-hover:bg-purple-400 transition-colors" />

                            <h2 className="text-xl font-bold text-purple-400 mb-6 flex items-center uppercase tracking-widest">
                                <span className="mr-3 text-purple-500/50">_02</span>
                                Entity
                            </h2>

                            <div className="space-y-8 relative">
                                <div className="space-y-2">
                                    <p className="text-xs text-zinc-500 tracking-[0.2em] uppercase">Designation:</p>
                                    <div className="relative inline-block group/name cursor-help">
                                        <p className="text-3xl font-bold text-white tracking-widest uppercase border-b border-dashed border-zinc-700 pb-1">
                                            Om Nandurkar
                                        </p>

                                        {/* Hover Image Container - Solo Leveling style status window popout */}
                                        <div className="absolute left-1/2 -top-[230px] -translate-x-1/2 w-64 opacity-0 scale-95 pointer-events-none group-hover/name:opacity-100 group-hover/name:scale-100 group-hover/name:-translate-y-2 transition-all duration-300 z-50">
                                            <div className="relative p-2 bg-[#050505] border border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] rounded-lg">
                                                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#050505] border-b border-r border-blue-500/50 rotate-45" />
                                                <div className="w-full h-48 relative overflow-hidden rounded bg-zinc-900">
                                                    {/* Fallback pattern while loading or if missing */}
                                                    <div className="absolute inset-0 flex items-center justify-center text-zinc-800 pointer-events-none">
                                                        <Cpu className="w-12 h-12 opacity-50" />
                                                    </div>
                                                    <img
                                                        src="/Om.jpg"
                                                        alt="Om Nandurkar"
                                                        className="absolute inset-0 w-full h-full object-cover transition-all duration-500 relative z-10"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </div>
                                                <div className="mt-2 text-center pointer-events-none relative z-10">
                                                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Status: Architect</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-zinc-400">Class: Developer / System Creator</p>
                                </div>

                                <div className="space-y-4">
                                    <p className="text-xs text-zinc-500 tracking-[0.2em] uppercase">Network Link:</p>
                                    <a
                                        href="https://www.omnandurkar.tech"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center space-x-3 px-6 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 hover:border-blue-500 text-blue-300 rounded-lg transition-all"
                                    >
                                        <span className="tracking-widest uppercase text-sm">Access Portfolio</span>
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </div>

                    </div>
                </main>

                <footer className="mt-16 text-center opacity-30">
                    <p className="text-[10px] uppercase tracking-[0.3em] font-mono">
                        System Access Confirmed • Architect Protocol Engaged
                    </p>
                </footer>
            </div>

            <style jsx>{`
                @keyframes scan {
                    0% { top: 0; opacity: 0; }
                    10% { opacity: 1; }
                    90% { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
}
