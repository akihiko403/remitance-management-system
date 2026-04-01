import GlassPanel from '@/Components/GlassPanel';
import MetricCard from '@/Components/MetricCard';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowTrendingUpIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    EllipsisVerticalIcon,
} from '@heroicons/react/24/solid';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

type Stat = {
    label: string;
    value: number;
    meta: string;
};

type ChartPoint = {
    label: string;
    event_date: string;
    remittance: number;
    shortage: number;
    deduction: number;
    balance: number;
};

type EventSummary = {
    id: number;
    name: string;
    code: string;
    status: string;
    event_date: string;
    assignments: number;
    remittance_total: number;
    shortage_total: number;
    deduction_total: number;
    balance: number;
};

type Props = {
    stats: Stat[];
    chartSeries: ChartPoint[];
    eventSummaries: EventSummary[];
    topBalances: { id: number; code: string; name: string; balance: number }[];
    recentActivities: {
        id: number;
        log_name: string;
        description: string;
        causer: string;
        created_at: string;
    }[];
    executiveSummary: {
        shortageCollectionRate: number;
        averageRemittancePerEvent: number;
        openExposure: number;
    };
};

const tooltipStyle = {
    background: 'rgba(16,25,47,0.98)',
    border: '1px solid rgba(96,165,250,0.14)',
    borderRadius: 18,
    boxShadow: '0 18px 40px rgba(2, 8, 23, 0.34)',
};

export default function Dashboard({
    stats,
    chartSeries,
    topBalances,
    executiveSummary,
}: Props) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => (
                    <MetricCard
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        meta={stat.meta}
                        currency={stat.label !== 'Masterlist' && stat.label !== 'Active Events'}
                    />
                ))}
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
                <GlassPanel>
                    <div className="mb-8 flex items-start justify-between gap-4">
                        <div className="max-w-2xl">
                            <div className="panel-kicker">Financial Trend</div>
                            <div className="panel-heading">
                                Event remittance vs shortage recovery
                            </div>
                            <div className="panel-subtext">
                                Compare event cash movement against shortage recovery
                                progress across the latest encoded operations.
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="topbar-control h-9 w-9"
                            >
                                <ChevronLeftIcon className="h-4 w-4" />
                            </button>
                            <button
                                type="button"
                                className="topbar-control h-9 w-9"
                            >
                                <ChevronRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                    <div className="h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartSeries}>
                                <defs>
                                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.34} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Area
                                    type="monotone"
                                    dataKey="remittance"
                                    stroke="#3b82f6"
                                    fill="url(#goldFill)"
                                    strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassPanel>

                <GlassPanel>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <div className="panel-kicker">Operations Snapshot</div>
                            <div className="panel-heading">Recovery performance</div>
                        </div>
                        <button
                            type="button"
                            className="topbar-control h-9 w-9"
                        >
                            <EllipsisVerticalIcon className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-6 space-y-4">
                        <div className="rounded-[1.4rem] border border-white/8 bg-[#18233f] p-5 transition hover:bg-[#1d2a4d]">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Shortage collection rate
                            </div>
                            <div className="mt-2 flex items-end gap-3">
                                <div className="text-3xl font-extrabold text-white">
                                    {executiveSummary.shortageCollectionRate}%
                                </div>
                                <div className="pb-1 text-xs font-semibold text-emerald-300">
                                    +2.4%
                                </div>
                            </div>
                            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                <div
                                    className="h-full rounded-full bg-gradient-to-r from-[#2563eb] to-[#60a5fa]"
                                    style={{
                                        width: `${Math.min(
                                            executiveSummary.shortageCollectionRate,
                                            100,
                                        )}%`,
                                    }}
                                />
                            </div>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/8 bg-[#18233f] p-5 transition hover:bg-[#1d2a4d]">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Average remittance per event
                            </div>
                            <div className="mt-2 text-3xl font-extrabold text-white">
                                {formatCurrency(executiveSummary.averageRemittancePerEvent)}
                            </div>
                        </div>
                        <div className="rounded-[1.4rem] border border-white/8 bg-[#18233f] p-5 transition hover:bg-[#1d2a4d]">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                                Open exposure
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-3xl font-extrabold text-blue-300">
                                {formatCurrency(executiveSummary.openExposure)}
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                            </div>
                        </div>
                    </div>
                    <Link
                        href={route('reports.deduction-history')}
                        className="glass-button-secondary mt-6 w-full"
                    >
                        Detailed Analysis
                    </Link>
                </GlassPanel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <GlassPanel>
                    <div className="mb-6">
                        <div className="panel-kicker">Event Exposure</div>
                        <div className="panel-heading">Recent event balance profile</div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartSeries}>
                                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                                <XAxis
                                    dataKey="label"
                                    stroke="#94a3b8"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Bar dataKey="shortage" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="deduction" fill="#2563eb" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassPanel>

                <GlassPanel>
                    <div className="panel-kicker">Outstanding People</div>
                    <div className="panel-heading">Highest remaining balances</div>
                    <div className="mt-6 space-y-3">
                        {topBalances.map((person) => (
                            <div
                                key={person.id}
                                className="flex items-center justify-between rounded-[1.35rem] border border-white/8 bg-[#18233f] px-4 py-4 transition hover:bg-[#1d2a4d]"
                            >
                                <div>
                                    <div className="text-sm font-semibold text-white">
                                        {person.name}
                                    </div>
                                    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
                                        {person.code}
                                    </div>
                                </div>
                                <div className="text-sm font-semibold text-blue-300">
                                    {formatCurrency(person.balance)}
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            </div>

        </AuthenticatedLayout>
    );
}
