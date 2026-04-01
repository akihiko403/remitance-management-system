import GlassPanel from '@/Components/GlassPanel';
import MetricCard from '@/Components/MetricCard';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';

type EventDetail = {
    id: number;
    code: string;
    name: string;
    slug: string;
    event_date: string;
    venue?: string | null;
    status: string;
    description?: string | null;
    assignments_count: number;
    remittance_total: number;
    shortage_total: number;
    deduction_total: number;
    balance: number;
};

type Props = {
    event: EventDetail;
    activeTab: string;
    tabs: string[];
    assignments: {
        id: number;
        person_id: number;
        person_name: string;
        person_code: string;
        teller_position: string;
        team?: string | null;
        is_lead: boolean;
        notes?: string | null;
    }[];
    remittances: {
        id: number;
        transaction_date: string;
        person_name: string;
        teller_position?: string | null;
        payment_channel?: string | null;
        reference_number?: string | null;
        amount: number;
        notes?: string | null;
    }[];
    shortages: {
        id: number;
        transaction_date: string;
        person_name: string;
        teller_position?: string | null;
        reason?: string | null;
        amount: number;
        paid_amount: number;
        remaining_balance: number;
        settlement_status: string;
    }[];
    deductions: {
        id: number;
        transaction_date: string;
        person_name: string;
        method: string;
        reference_number?: string | null;
        shortage_reason?: string | null;
        amount: number;
    }[];
    peopleOptions: { id: number; label: string }[];
};

export default function EventShow({
    event,
    activeTab,
    tabs,
    assignments,
    remittances,
    shortages,
    deductions,
    peopleOptions,
}: Props) {
    const assignmentForm = useForm({
        person_id: '',
        teller_position: '',
        team: 'Finance Ops',
        is_lead: false,
        notes: '',
    });

    const submitAssignment = (formEvent: FormEvent) => {
        formEvent.preventDefault();
        assignmentForm.transform((data) => ({
            ...data,
            is_lead: data.is_lead ? 1 : 0,
        }));
        assignmentForm.post(route('events.assignments.store', event.id), {
            preserveScroll: true,
            onSuccess: () => assignmentForm.reset(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow={event.code}
                    title={event.name}
                    description={`${event.event_date} • ${event.venue ?? 'Venue pending'} • Event-based balances, teller assignments, and settlement flow.`}
                    actions={
                        <>
                            <Link
                                href={route('reports.event-shortages', {
                                    event_id: event.id,
                                })}
                                className="glass-button"
                            >
                                Event Report
                            </Link>
                        </>
                    }
                />
            }
        >
            <Head title={event.name} />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard label="Assignments" value={event.assignments_count} />
                <MetricCard label="Remittance" value={event.remittance_total} currency />
                <MetricCard label="Shortage" value={event.shortage_total} currency />
                <MetricCard label="Balance" value={event.balance} currency />
            </div>

            <GlassPanel>
                <div className="flex flex-wrap gap-3">
                    {tabs.map((tab) => (
                        <Link
                            key={tab}
                            href={route('events.show', {
                                event: event.id,
                                tab,
                            })}
                            className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                                activeTab === tab
                                    ? 'border-blue-400/40 bg-blue-500/20 text-blue-100 shadow-[0_12px_24px_rgba(59,130,246,0.18)]'
                                    : 'border-white/10 bg-white/5 text-slate-300 hover:-translate-y-0.5 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white'
                            }`}
                        >
                            {tab}
                        </Link>
                    ))}
                </div>
            </GlassPanel>

            {activeTab === 'overview' ? (
                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <GlassPanel>
                        <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                            Event Overview
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-white">
                            Executive summary
                        </div>
                        <p className="mt-4 text-sm leading-7 text-kgbi-silver/72">
                            {event.description || 'No executive description has been added yet for this event.'}
                        </p>
                        <div className="mt-8 grid gap-4 md:grid-cols-2">
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="text-sm text-kgbi-silver/60">Status</div>
                                <div className="mt-3">
                                    <StatusBadge value={event.status} />
                                </div>
                            </div>
                            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                                <div className="text-sm text-kgbi-silver/60">Remaining event balance</div>
                                <div className="mt-3 text-2xl font-semibold text-white">
                                    {formatCurrency(event.balance)}
                                </div>
                            </div>
                        </div>
                    </GlassPanel>

                    <GlassPanel>
                        <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                            Quick Links
                        </div>
                        <div className="mt-3 text-2xl font-semibold text-white">
                            Navigate by module
                        </div>
                        <div className="mt-6 grid gap-3">
                            {[
                                ['Remittance Encoding', route('remittances.index', { event_id: event.id })],
                                ['Deductions', route('deductions.index', { event_id: event.id })],
                                ['Reports', route('reports.event-shortages', { event_id: event.id })],
                            ].map(([label, href]) => (
                                <Link
                                    key={label}
                                    href={href}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-medium text-kgbi-silver/75 transition hover:border-kgbi-gold/40 hover:text-white"
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    </GlassPanel>
                </div>
            ) : null}

            {activeTab === 'assignments' ? (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="table-panel">
                        <div className="table-shell">
                        <table>
                            <thead>
                                <tr>
                                    <th>Person</th>
                                    <th>Position</th>
                                    <th>Lead</th>
                                    <th>Team</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                        <td>
                                            <div className="font-semibold text-white">
                                                {assignment.person_name}
                                            </div>
                                            <div className="mt-1 text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                                {assignment.person_code}
                                            </div>
                                        </td>
                                        <td>{assignment.teller_position}</td>
                                        <td>{assignment.is_lead ? 'Yes' : 'No'}</td>
                                        <td>{assignment.team || 'Finance Ops'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <GlassPanel>
                        <div className="text-xs uppercase tracking-[0.35em] text-kgbi-gold/70">
                            Add Assignment
                        </div>
                        <div className="mt-2 text-2xl font-semibold text-white">
                            Event teller placement
                        </div>
                        <form onSubmit={submitAssignment} className="mt-6 space-y-4">
                            <select
                                className="glass-select"
                                value={assignmentForm.data.person_id}
                                onChange={(event) =>
                                    assignmentForm.setData(
                                        'person_id',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Select person</option>
                                {peopleOptions.map((person) => (
                                    <option key={person.id} value={person.id}>
                                        {person.label}
                                    </option>
                                ))}
                            </select>
                            <input
                                className="glass-input"
                                placeholder="Teller position"
                                value={assignmentForm.data.teller_position}
                                onChange={(event) =>
                                    assignmentForm.setData(
                                        'teller_position',
                                        event.target.value,
                                    )
                                }
                            />
                            <input
                                className="glass-input"
                                placeholder="Team"
                                value={assignmentForm.data.team}
                                onChange={(event) =>
                                    assignmentForm.setData('team', event.target.value)
                                }
                            />
                            <textarea
                                className="glass-input min-h-28"
                                placeholder="Notes"
                                value={assignmentForm.data.notes}
                                onChange={(event) =>
                                    assignmentForm.setData('notes', event.target.value)
                                }
                            />
                            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-kgbi-silver/80">
                                <input
                                    type="checkbox"
                                    className="glass-checkbox"
                                    checked={assignmentForm.data.is_lead}
                                    onChange={(event) =>
                                        assignmentForm.setData(
                                            'is_lead',
                                            event.target.checked,
                                        )
                                    }
                                />
                                Lead assignment
                            </label>
                            <button type="submit" className="glass-button">
                                Save Assignment
                            </button>
                        </form>
                    </GlassPanel>
                </div>
            ) : null}

            {activeTab === 'remittances' ? (
                <div className="table-panel">
                    <div className="table-shell">
                        <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Person</th>
                                <th>Position</th>
                                <th>Channel</th>
                                <th>Reference</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {remittances.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.transaction_date}</td>
                                    <td>{row.person_name}</td>
                                    <td>{row.teller_position || 'N/A'}</td>
                                    <td>{row.payment_channel || 'N/A'}</td>
                                    <td>{row.reference_number || 'N/A'}</td>
                                    <td>{formatCurrency(row.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {activeTab === 'shortages' ? (
                <div className="table-panel">
                    <div className="table-shell">
                        <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Person</th>
                                <th>Reason</th>
                                <th>Shortage</th>
                                <th>Collected</th>
                                <th>Balance</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {shortages.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.transaction_date}</td>
                                    <td>{row.person_name}</td>
                                    <td>{row.reason || 'N/A'}</td>
                                    <td>{formatCurrency(row.amount)}</td>
                                    <td>{formatCurrency(row.paid_amount)}</td>
                                    <td>{formatCurrency(row.remaining_balance)}</td>
                                    <td>
                                        <StatusBadge value={row.settlement_status} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            ) : null}

            {activeTab === 'deductions' ? (
                <div className="table-panel">
                    <div className="table-shell">
                        <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Person</th>
                                <th>Method</th>
                                <th>Shortage Reason</th>
                                <th>Reference</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {deductions.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.transaction_date}</td>
                                    <td>{row.person_name}</td>
                                    <td>{row.method}</td>
                                    <td>{row.shortage_reason || 'N/A'}</td>
                                    <td>{row.reference_number || 'N/A'}</td>
                                    <td>{formatCurrency(row.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                        </table>
                    </div>
                </div>
            ) : null}
        </AuthenticatedLayout>
    );
}
