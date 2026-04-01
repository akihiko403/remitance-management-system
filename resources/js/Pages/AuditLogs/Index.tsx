import GlassPanel from '@/Components/GlassPanel';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FormEvent, useState } from 'react';

type AuditRow = {
    id: number;
    log_name: string;
    description: string;
    subject: string;
    causer: string;
    properties: Record<string, unknown>;
    created_at: string;
};

type Props = {
    logs: Paginated<AuditRow>;
    filters: { search?: string; log_name?: string };
    logNames: string[];
};

export default function AuditLogsIndex({ logs, filters, logNames }: Props) {
    const [filterValues, setFilterValues] = useState({
        search: filters.search ?? '',
        log_name: filters.log_name ?? '',
    });

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Audit Logs"
                    title="Operational audit trail"
                    description="Every critical create, update, delete, and authentication action is surfaced here for finance controls and post-event review."
                />
            }
        >
            <Head title="Audit Logs" />

            <GlassPanel>
                <form
                    onSubmit={(event: FormEvent) => {
                        event.preventDefault();
                        router.get(route('audit-logs.index'), filterValues, {
                            preserveState: true,
                            replace: true,
                        });
                    }}
                    className="grid gap-4 lg:grid-cols-[1fr_260px_auto]"
                >
                    <input
                        className="glass-input"
                        placeholder="Search activity text"
                        value={filterValues.search}
                        onChange={(event) =>
                            setFilterValues((current) => ({
                                ...current,
                                search: event.target.value,
                            }))
                        }
                    />
                    <select
                        className="glass-select"
                        value={filterValues.log_name}
                        onChange={(event) =>
                            setFilterValues((current) => ({
                                ...current,
                                log_name: event.target.value,
                            }))
                        }
                    >
                        <option value="">All log groups</option>
                        {logNames.map((logName) => (
                            <option key={logName} value={logName}>
                                {logName}
                            </option>
                        ))}
                    </select>
                    <button type="submit" className="glass-button">
                        Apply Filters
                    </button>
                </form>
            </GlassPanel>

            <div className="table-panel">
                <div className="table-panel-header">
                    <div className="section-eyebrow">Audit Timeline</div>
                    <div className="section-title">Recorded system activity</div>
                </div>
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Log</th>
                                <th>Description</th>
                                <th>Subject</th>
                                <th>Causer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.data.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.created_at}</td>
                                    <td>{row.log_name}</td>
                                    <td>
                                        {row.description}
                                        <div className="mt-1 text-xs text-slate-400">
                                            {JSON.stringify(row.properties)}
                                        </div>
                                    </td>
                                    <td>{row.subject}</td>
                                    <td>{row.causer}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={logs.links} />
        </AuthenticatedLayout>
    );
}
