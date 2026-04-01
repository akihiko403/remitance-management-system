import GlassPanel from '@/Components/GlassPanel';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function MetricCard({
    label,
    value,
    meta,
    currency = false,
}: {
    label: string;
    value: number | string;
    meta?: string;
    currency?: boolean;
}) {
    return (
        <GlassPanel className="dashboard-stat-card">
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-blue-500/12 blur-2xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/60 to-transparent" />
            <div className="relative">
                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
                    {label}
                </div>
                <div className="mt-3 text-[1.95rem] font-extrabold leading-none text-white">
                    {currency
                        ? formatCurrency(Number(value))
                        : typeof value === 'number'
                          ? formatNumber(value)
                          : value}
                </div>
                {meta ? (
                    <div className="mt-3 max-w-[18rem] text-[13px] leading-6 text-slate-300">
                        {meta}
                    </div>
                ) : null}
            </div>
        </GlassPanel>
    );
}
