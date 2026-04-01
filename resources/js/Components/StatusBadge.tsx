import { cn } from '@/lib/utils';

const toneMap: Record<string, string> = {
    open: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    closed: 'border-sky-500/30 bg-sky-500/15 text-sky-200',
    draft: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
    archived: 'border-slate-500/30 bg-slate-500/15 text-slate-200',
    settled: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    partial: 'border-amber-500/30 bg-amber-500/15 text-amber-100',
    outstanding: 'border-rose-500/30 bg-rose-500/15 text-rose-100',
    active: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    inactive: 'border-slate-500/30 bg-slate-500/15 text-slate-200',
    encoded: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-200',
    'not encoded': 'border-amber-500/30 bg-amber-500/15 text-amber-100',
};

export default function StatusBadge({ value }: { value: string }) {
    const tone = toneMap[value?.toLowerCase()] ?? toneMap.archived;

    return (
        <span
            className={cn(
                'inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-medium uppercase tracking-[0.18em]',
                tone,
            )}
        >
            {value}
        </span>
    );
}
