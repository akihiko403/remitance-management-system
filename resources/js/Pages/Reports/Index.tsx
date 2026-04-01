import GlassPanel from '@/Components/GlassPanel';
import PageHeader from '@/Components/PageHeader';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn, formatCurrency } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type Props = {
    reportSlug: string;
    report: {
        title: string;
        subtitle: string;
        filters: {
            search?: string;
            event_id?: string;
            person_id?: string;
            date_from?: string;
            date_to?: string;
        };
        columns: { key: string; label: string }[];
        rows: Record<string, string | number | null>[];
        summary: { label: string; value: string | number }[];
    };
    availableReports: { slug: string; label: string; route: string }[];
    events: { id: number; name: string; code: string }[];
    people: { id: number; name: string; code: string }[];
    exportUrls: { pdf: string; xls: string };
};

export default function ReportsIndex({
    reportSlug,
    report,
    availableReports,
    events,
    people,
    exportUrls,
}: Props) {
    const isMoneyField = (key: string, label: string) =>
        /(amount|_total|balance|deduction_total|shortage_total|collected|exposure|settled_value)/i.test(
            key,
        ) || /^(Shortage|Collected|Balance|Total Deducted|Settled Value)$/i.test(label);

    const [filters, setFilters] = useState({
        search: report.filters.search ?? '',
        event_id: report.filters.event_id ?? '',
        person_id: report.filters.person_id ?? '',
        date_from: report.filters.date_from ?? '',
        date_to: report.filters.date_to ?? '',
    });

    const activeRoute =
        availableReports.find((item) => item.slug === reportSlug)?.route ??
        availableReports[0]?.route;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Reports"
                    title={report.title}
                    description={report.subtitle}
                    actions={
                        <>
                            <a href={exportUrls.xls} className="glass-button-secondary">
                                Export Excel
                            </a>
                            <a href={exportUrls.pdf} className="glass-button">
                                Export PDF
                            </a>
                        </>
                    }
                />
            }
        >
            <Head title={report.title} />

            <GlassPanel>
                <div className="flex flex-wrap gap-3">
                    {availableReports.map((item) => (
                        <Link
                            key={item.slug}
                            href={item.route}
                            className={cn(
                                'rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all duration-200',
                                item.slug === reportSlug
                                    ? 'border-blue-400/40 bg-blue-500/20 text-blue-100 shadow-[0_12px_24px_rgba(59,130,246,0.18)]'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white',
                            )}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </GlassPanel>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {report.summary.map((item) => (
                    <GlassPanel key={item.label}>
                        <div className="text-xs uppercase tracking-[0.35em] text-blue-300">
                            {item.label}
                        </div>
                        <div className="mt-3 text-2xl font-extrabold text-white">
                            {typeof item.value === 'number'
                                ? isMoneyField(item.label, item.label)
                                    ? formatCurrency(item.value)
                                    : item.value
                                : item.value}
                        </div>
                    </GlassPanel>
                ))}
            </div>

            <GlassPanel>
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        router.get(activeRoute, filters, {
                            preserveState: true,
                            replace: true,
                        });
                    }}
                    className="grid gap-4 xl:grid-cols-5"
                >
                    <input
                        className="glass-input"
                        placeholder="Search"
                        value={filters.search}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                search: event.target.value,
                            }))
                        }
                    />
                    <select
                        className="glass-select"
                        value={filters.event_id}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                event_id: event.target.value,
                            }))
                        }
                    >
                        <option value="">All events</option>
                        {events.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code} - {item.name}
                            </option>
                        ))}
                    </select>
                    <select
                        className="glass-select"
                        value={filters.person_id}
                        onChange={(event) =>
                            setFilters((current) => ({
                                ...current,
                                person_id: event.target.value,
                            }))
                        }
                    >
                        <option value="">All people</option>
                        {people.map((item) => (
                            <option key={item.id} value={item.id}>
                                {item.code} - {item.name}
                            </option>
                        ))}
                    </select>
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="date"
                            className="glass-input"
                            value={filters.date_from}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    date_from: event.target.value,
                                }))
                            }
                        />
                        <input
                            type="date"
                            className="glass-input"
                            value={filters.date_to}
                            onChange={(event) =>
                                setFilters((current) => ({
                                    ...current,
                                    date_to: event.target.value,
                                }))
                            }
                        />
                    </div>
                    <button type="submit" className="glass-button">
                        Apply Filters
                    </button>
                </form>
            </GlassPanel>

            <div className="table-panel">
                <div className="table-panel-header">
                    <div className="section-eyebrow">Report Output</div>
                    <div className="section-title">Filtered result set</div>
                </div>
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                {report.columns.map((column) => (
                                    <th key={column.key}>{column.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {report.rows.length ? (
                                report.rows.map((row, index) => (
                                    <tr key={`${reportSlug}-${index}`}>
                                        {report.columns.map((column) => {
                                            const value = row[column.key];
                                            return (
                                                <td key={column.key}>
                                                    {typeof value === 'number'
                                                        ? isMoneyField(
                                                              column.key,
                                                              column.label,
                                                          )
                                                            ? formatCurrency(value)
                                                            : value
                                                        : (value ?? 'N/A')}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={report.columns.length}
                                        className="text-center text-slate-400"
                                    >
                                        No rows available for the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
