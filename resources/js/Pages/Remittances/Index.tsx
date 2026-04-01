import FormField from '@/Components/FormField';
import MetricCard from '@/Components/MetricCard';
import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

type RemittanceDraft = {
    id: number;
    remittance_amount: number;
    cash_on_hand: number;
    short_amount: number;
    remarks?: string | null;
};

type Row = {
    assignment_id: number;
    person_id: number;
    name: string;
    teller_position: string;
    event_name: string;
    encoding_status: string;
    previous_balance: number;
    remittance?: RemittanceDraft | null;
};

type Props = {
    activeEvent: {
        id: number;
        code: string;
        name: string;
        event_date: string;
        venue?: string | null;
    } | null;
    rows: Row[];
    stats: {
        assigned_count: number;
        encoded_count: number;
        total_remittance: number;
    };
};

function parseAmount(value: string) {
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : 0;
}

function sanitizeAmountInput(value: string) {
    const cleaned = value.replace(/[^\d.]/g, '');
    const [wholePart, ...decimalParts] = cleaned.split('.');

    if (decimalParts.length === 0) {
        return cleaned;
    }

    return `${wholePart}.${decimalParts.join('')}`;
}

export default function RemittancesIndex({
    activeEvent,
    rows,
    stats,
}: Props) {
    const [selectedRow, setSelectedRow] = useState<Row | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    const form = useForm({
        remittance_amount: '0',
        cash_on_hand: '0',
        remarks: '',
    });
    const paymentForm = useForm({
        person_id: '',
        transaction_date: '',
        amount: '',
        notes: '',
    });

    const shortAmount = Math.max(
        parseAmount(form.data.remittance_amount) -
            parseAmount(form.data.cash_on_hand),
        0,
    );

    useEffect(() => {
        if (!selectedRow) {
            return;
        }

        const refreshedRow =
            rows.find((row) => row.assignment_id === selectedRow.assignment_id) ??
            null;

        if (!refreshedRow) {
            setSelectedRow(null);
            setModalOpen(false);
            setPaymentModalOpen(false);
            return;
        }

        setSelectedRow(refreshedRow);
    }, [rows, selectedRow]);

    const closeModal = () => {
        setPaymentModalOpen(false);
        setSelectedRow(null);
        setModalOpen(false);
        form.reset();
        form.clearErrors();
        paymentForm.reset();
        paymentForm.clearErrors();
    };

    const openModal = (row: Row) => {
        setSelectedRow(row);
        form.setData({
            remittance_amount: String(row.remittance?.remittance_amount ?? 0),
            cash_on_hand: String(row.remittance?.cash_on_hand ?? 0),
            remarks: row.remittance?.remarks ?? '',
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const openPaymentModal = () => {
        if (!selectedRow) {
            return;
        }

        paymentForm.setData({
            person_id: String(selectedRow.person_id),
            transaction_date: new Date().toISOString().slice(0, 10),
            amount: '',
            notes: '',
        });
        paymentForm.clearErrors();
        setPaymentModalOpen(true);
    };

    const closePaymentModal = () => {
        setPaymentModalOpen(false);
        paymentForm.reset();
        paymentForm.clearErrors();
    };

    if (!activeEvent) {
        return (
            <AuthenticatedLayout
                header={
                    <PageHeader
                        eyebrow="Remittance"
                        title="No active event is ready for encoding"
                        description="Set one event to active and assign attendees before opening the remittance roster."
                        actions={
                            <Link
                                href={route('events.index')}
                                className="glass-button"
                            >
                                Manage Events
                            </Link>
                        }
                    />
                }
            >
                <Head title="Remittances" />

                <div className="app-surface panel-pad">
                    <div className="section-eyebrow">Active Event Required</div>
                    <div className="section-title">
                        Attendance drives the remittance list
                    </div>
                    <p className="section-copy">
                        The remittance page only shows people assigned to the
                        current active event. Create or activate an event first,
                        then complete Event Attendance and Teller Assignment.
                    </p>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow={activeEvent.code}
                    title="Active Event Remittance Encoding"
                    description={`${activeEvent.name} | ${activeEvent.event_date} | ${activeEvent.venue ?? 'Venue pending'} | Encode remittance per assigned attendee from the active event roster.`}
                    actions={
                        <Link
                            href={route('events.attendance.index', activeEvent.id)}
                            className="glass-button-secondary"
                        >
                            Manage Attendance
                        </Link>
                    }
                />
            }
        >
            <Head title="Remittances" />

            <div className="grid gap-5 md:grid-cols-3">
                <MetricCard label="Assigned People" value={stats.assigned_count} />
                <MetricCard label="Encoded" value={stats.encoded_count} />
                <MetricCard
                    label="Total Remittance"
                    value={stats.total_remittance}
                    currency
                />
            </div>

            <div className="table-panel">
                <div className="table-panel-header">
                    <div className="section-eyebrow">Active Event Roster</div>
                    <div className="section-title">
                        Assigned attendees for remittance encoding
                    </div>
                </div>
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Teller Position</th>
                                <th>Event</th>
                                <th>Encoding Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.assignment_id}>
                                    <td className="font-semibold text-white">
                                        {row.name}
                                    </td>
                                    <td>{row.teller_position}</td>
                                    <td>{row.event_name}</td>
                                    <td>
                                        <StatusBadge value={row.encoding_status} />
                                    </td>
                                    <td>
                                        <div className="action-group justify-end">
                                            <button
                                                type="button"
                                                className="glass-button px-3 py-2 text-xs"
                                                onClick={() => openModal(row)}
                                            >
                                                {row.remittance
                                                    ? 'Edit Remittance'
                                                    : 'Encode Remittance'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                show={modalOpen && !paymentModalOpen}
                onClose={closeModal}
                maxWidth="2xl"
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();

                        if (!selectedRow) {
                            return;
                        }

                        form.post(
                            route(
                                'remittances.assignments.upsert',
                                selectedRow.assignment_id,
                            ),
                            {
                                preserveScroll: true,
                                onSuccess: () => closeModal(),
                            },
                        );
                    }}
                >
                    <ModalFormShell
                        eyebrow={
                            selectedRow?.remittance
                                ? 'Edit Remittance'
                                : 'Encode Remittance'
                        }
                        title="Per-person remittance encoding"
                        description="Update the financial record for this attendee."
                        headerAside={
                            selectedRow && selectedRow.previous_balance > 0 ? (
                                <div className="flex min-w-[220px] flex-col items-end gap-3">
                                    <div className="w-full rounded-2xl border border-rose-500/30 bg-[linear-gradient(180deg,rgba(244,63,94,0.12),rgba(244,63,94,0.05))] px-5 py-4 text-right shadow-[0_18px_40px_rgba(244,63,94,0.12)]">
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-rose-200/75">
                                            Outstanding Previous Short
                                        </div>
                                        <div className="mt-2 text-2xl font-extrabold tracking-tight text-rose-200">
                                            {formatCurrency(selectedRow.previous_balance)}
                                        </div>
                                        <div className="mt-1 text-xs font-medium text-rose-100/70">
                                            From earlier events
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={openPaymentModal}
                                        className="glass-button-danger w-full px-4 py-2 text-sm font-semibold"
                                    >
                                        Pay It
                                    </button>
                                </div>
                            ) : null
                        }
                        onClose={closeModal}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="glass-button-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="glass-button"
                                >
                                    {form.processing
                                        ? 'Saving...'
                                        : 'Save Remittance'}
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Person Name
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                    {selectedRow?.name ?? ''}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Teller Position
                                </div>
                                <div className="mt-2 text-sm font-semibold uppercase text-white">
                                    {selectedRow?.teller_position ?? ''}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 md:col-span-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                    Event Context
                                </div>
                                <div className="mt-2 text-sm font-semibold text-white">
                                    {selectedRow?.event_name ?? activeEvent.name}
                                </div>
                            </div>
                            <FormField
                                label="System Cash On Hand"
                                error={form.errors.remittance_amount}
                            >
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={form.data.remittance_amount}
                                    onChange={(event) =>
                                        form.setData(
                                            'remittance_amount',
                                            sanitizeAmountInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="glass-input"
                                />
                            </FormField>
                            <FormField
                                label="Teller Cash On Hand"
                                error={form.errors.cash_on_hand}
                            >
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    value={form.data.cash_on_hand}
                                    onChange={(event) =>
                                        form.setData(
                                            'cash_on_hand',
                                            sanitizeAmountInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                    className="glass-input"
                                />
                            </FormField>
                            <div className="md:col-span-2">
                                <div
                                    className={`flex items-center justify-between rounded-2xl border px-4 py-4 ${
                                        shortAmount > 0
                                            ? 'border-rose-500/30 bg-rose-500/10'
                                            : 'border-emerald-500/30 bg-emerald-500/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`rounded-xl p-2 ${
                                                shortAmount > 0
                                                    ? 'bg-rose-500/15 text-rose-200'
                                                    : 'bg-emerald-500/15 text-emerald-200'
                                            }`}
                                        >
                                            {shortAmount > 0 ? (
                                                <ExclamationTriangleIcon className="h-5 w-5" />
                                            ) : (
                                                <CheckCircleIcon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                                                Calculation Result
                                            </div>
                                            <div
                                                className={`mt-1 text-sm font-semibold ${
                                                    shortAmount > 0
                                                        ? 'text-rose-200'
                                                        : 'text-emerald-200'
                                                }`}
                                            >
                                                {shortAmount > 0
                                                    ? 'Provisional shortage detected'
                                                    : 'Balance clear'}
                                            </div>
                                        </div>
                                    </div>
                                    <div
                                        className={`text-right text-lg font-semibold ${
                                            shortAmount > 0
                                                ? 'text-rose-200'
                                                : 'text-emerald-200'
                                        }`}
                                    >
                                        {formatCurrency(Math.abs(shortAmount))}
                                    </div>
                                </div>
                            </div>
                            <FormField
                                label="Remarks"
                                error={form.errors.remarks}
                                className="md:col-span-2"
                            >
                                <textarea
                                    rows={4}
                                    value={form.data.remarks}
                                    onChange={(event) =>
                                        form.setData('remarks', event.target.value)
                                    }
                                    className="glass-textarea"
                                    placeholder="Enter details about the remittance or shortage..."
                                />
                            </FormField>
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>

            <Modal
                show={paymentModalOpen}
                onClose={closePaymentModal}
                maxWidth="xl"
            >
                <form
                    onSubmit={(event) => {
                        event.preventDefault();

                        paymentForm.post(route('deductions.store'), {
                            preserveScroll: true,
                            preserveState: true,
                            onSuccess: () => closePaymentModal(),
                        });
                    }}
                >
                    <ModalFormShell
                        eyebrow="Post Payment"
                        title="Settle previous shortage"
                        description="Post a payment for this teller without leaving remittance encoding."
                        onClose={closePaymentModal}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={closePaymentModal}
                                    className="glass-button-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentForm.processing}
                                    className="glass-button"
                                >
                                    {paymentForm.processing
                                        ? 'Posting...'
                                        : 'Post Payment'}
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-4 md:col-span-2">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                            Person Name
                                        </div>
                                        <div className="mt-2 text-sm font-semibold text-white">
                                            {selectedRow?.name ?? ''}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                                            Position
                                        </div>
                                        <div className="mt-2 text-sm font-semibold uppercase text-white">
                                            {selectedRow?.teller_position ?? ''}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            Remaining Balance
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-rose-200">
                                            {formatCurrency(
                                                selectedRow?.previous_balance ?? 0,
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <FormField
                                label="Transaction date"
                                error={paymentForm.errors.transaction_date}
                            >
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={paymentForm.data.transaction_date}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'transaction_date',
                                            event.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField
                                label="Payment amount"
                                error={paymentForm.errors.amount}
                            >
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="glass-input"
                                    value={paymentForm.data.amount}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'amount',
                                            sanitizeAmountInput(
                                                event.target.value,
                                            ),
                                        )
                                    }
                                />
                            </FormField>
                            <FormField label="Payment method">
                                <input
                                    className="glass-input"
                                    value="Cash Payment"
                                    readOnly
                                    disabled
                                />
                            </FormField>
                            <FormField
                                label="Notes"
                                error={paymentForm.errors.notes}
                                className="md:col-span-2"
                            >
                                <textarea
                                    className="glass-textarea"
                                    rows={3}
                                    value={paymentForm.data.notes}
                                    onChange={(event) =>
                                        paymentForm.setData(
                                            'notes',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter payment details or reference notes..."
                                />
                            </FormField>
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
