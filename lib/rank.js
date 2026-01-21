export function getRank(level) {
    if (level <= 10) return { rank: 'E', title: 'E-Rank Hunter', color: 'text-zinc-400', border: 'border-zinc-500', bg: 'bg-zinc-500/10', glow: 'shadow-zinc-500/20' };
    if (level <= 20) return { rank: 'D', title: 'D-Rank Hunter', color: 'text-green-400', border: 'border-green-500', bg: 'bg-green-500/10', glow: 'shadow-green-500/20' };
    if (level <= 30) return { rank: 'C', title: 'C-Rank Hunter', color: 'text-blue-400', border: 'border-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' };
    if (level <= 40) return { rank: 'B', title: 'B-Rank Hunter', color: 'text-purple-400', border: 'border-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' };
    if (level <= 50) return { rank: 'A', title: 'A-Rank Hunter', color: 'text-red-500', border: 'border-red-600', bg: 'bg-red-600/10', glow: 'shadow-red-600/30' };

    // S-Rank (Level 51+)
    return {
        rank: 'S',
        title: 'S-Rank Hunter',
        color: 'text-yellow-400',
        border: 'border-yellow-500',
        bg: 'bg-yellow-500/10',
        glow: 'shadow-yellow-500/50'
    };
}
