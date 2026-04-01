import FormField from '@/Components/FormField';
import MetricCard from '@/Components/MetricCard';
import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import PageHeader from '@/Components/PageHeader';
import Pagination from '@/Components/Pagination';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatCurrency } from '@/lib/utils';
import { Paginated } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEvent, useMemo, useState } from 'react';

type PersonOption = { id: number; name?: string; code?: string };

type DeductionRow = {
    id: number;
    shortage_id: number;
    event_id: number;
    person_id: number;
    event_name: string;
    person_name: string;
    shortage_reason?: string | null;
    transaction_date: string;
    amount: number;
    method: string;
    reference_number?: string | null;
    notes?: string | null;
};

type PersonBalanceRow = {
    person_id: number;
    person_name: string;
    person_code?: string | null;
    shortage_count: number;
    open_shortage_count: number;
    total_shortage: number;
    total_paid: number;
    remaining_balance: number;
    status: string;
    latest_event_name?: string | null;
};

type Props = {
    deductions: Paginated<DeductionRow>;
    filters: { person_id?: string; status?: string };
    stats: { total_deducted: number; people_with_balance: number; outstanding_total: number };
    people: PersonOption[];
    personBalances: PersonBalanceRow[];
};

const createFormDefaults = {
    person_id: '',
    transaction_date: '',
    amount: '',
    notes: '',
};

const editFormDefaults = {
    shortage_id: '',
    transaction_date: '',
    amount: '',
    notes: '',
};

export default function DeductionsIndex({
    deductions,
    filters,
    stats,
    people,
    personBalances,
}: Props) {
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedBalance, setSelectedBalance] = useState<PersonBalanceRow | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [filterValues, setFilterValues] = useState({
        person_id: filters.person_id ?? '',
        status: filters.status ?? '',
    });

    const createForm = useForm(createFormDefaults);
    const editForm = useForm(editFormDefaults);

    const selectedPreview = useMemo(() => {
        if (selectedBalance) {
            return selectedBalance;
        }

        if (!createForm.data.person_id) {
            return null;
        }

        return (
            personBalances.find(
                (row) => String(row.person_id) === String(createForm.data.person_id),
            ) ?? null
        );
    }, [createForm.data.person_id, personBalances, selectedBalance]);

    const openCreateModal = (row?: PersonBalanceRow) => {
        setSelectedBalance(row ?? null);
        createForm.setData({
            ...createFormDefaults,
            person_id: row ? String(row.person_id) : '',
            transaction_date: new Date().toISOString().slice(0, 10),
        });
        createForm.clearErrors();
        setCreateModalOpen(true);
    };

    const closeCreateModal = () => {
        setSelectedBalance(null);
        setCreateModalOpen(false);
        createForm.reset();
        createForm.clearErrors();
    };

    const openHistoryModal = (row: DeductionRow) => {
        setEditingId(row.id);
        editForm.setData({
            shortage_id: String(row.shortage_id),
            transaction_date: row.transaction_date,
            amount: String(row.amount),
            notes: row.notes ?? '',
        });
        editForm.clearErrors();
        setHistoryModalOpen(true);
    };

    const closeHistoryModal = () => {
        setEditingId(null);
        setHistoryModalOpen(false);
        editForm.reset();
        editForm.clearErrors();
    };

    const submitCreate = (event: FormEvent) => {
        event.preventDefault();

        createForm.transform((data) => ({
            person_id: data.person_id,
            transaction_date: data.transaction_date,
            amount: data.amount,
            notes: data.notes,
        }));

        createForm.post(route('deductions.store'), {
            preserveScroll: true,
            onSuccess: () => closeCreateModal(),
        });
    };

    const submitEdit = (event: FormEvent) => {
        event.preventDefault();

        if (!editingId) {
            return;
        }

        editForm.patch(route('deductions.update', editingId), {
            preserveScroll: true,
            onSuccess: () => closeHistoryModal(),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Deductions"
                    title="Consolidated shortage settlements"
                    description="Review every person with shortage exposure, see their total remaining balance, and post partial payments that are automatically distributed until fully settled."
                    actions={
                        <button
                            type="button"
                            className="glass-button"
                            onClick={() => openCreateModal()}
                        >
                            New Payment
                        </button>
                    }
                />
            }
        >
            <Head title="Deductions" />

            <div className="grid gap-5 md:grid-cols-3">
                <MetricCard label="Total Deducted" value={stats.total_deducted} currency />
                <MetricCard label="People With Balance" value={stats.people_with_balance} />
                <MetricCard label="Outstanding Balance" value={stats.outstanding_total} currency />
            </div>

            <div className="filter-bar">
                <form
                    onSubmit={(event) => {
                        event.preventDefault();
                        router.get(route('deductions.index'), filterValues, {
                            preserveState: true,
                            replace: true,
                        });
                    }}
                    className="filter-grid lg:grid-cols-3"
                >
                    <select
                        className="glass-select"
                        value={filterValues.person_id}
                        onChange={(event) =>
                            setFilterValues((current) => ({
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
                    <select
                        className="glass-select"
                        value={filterValues.status}
                        onChange={(event) =>
                            setFilterValues((current) => ({
                                ...current,
                                status: event.target.value,
                            }))
                        }
                    >
                        <option value="">All statuses</option>
                        <option value="outstanding">Outstanding</option>
                        <option value="partial">Partial</option>
                        <option value="settled">Settled</option>
                        <option value="clear">Clear</option>
                    </select>
                    <button type="submit" className="glass-button">
                        Apply Filters
                    </button>
                </form>
            </div>

            <div className="table-panel">
                <div className="table-panel-header">
                    <div className="section-eyebrow">People Balances</div>
                    <div className="section-title">Consolidated shortage balances per person</div>
                </div>
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Latest Event</th>
                                <th>Total Shortage</th>
                                <th>Total Paid</th>
                                <th>Remaining</th>
                                <th>Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {personBalances.map((row) => (
                                <tr key={row.person_id}>
                                    <td>
                                        <div className="font-semibold text-white">{row.person_name}</div>
                                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            {row.person_code} | {row.open_shortage_count} open of {row.shortage_count}
                                        </div>
                                    </td>
                                    <td>{row.latest_event_name ?? 'No shortage event'}</td>
                                    <td className="table-number">{formatCurrency(row.total_shortage)}</td>
                                    <td className="table-number">{formatCurrency(row.total_paid)}</td>
                                    <td className="table-number">{formatCurrency(row.remaining_balance)}</td>
                                    <td>
                                        <StatusBadge value={row.status} />
                                    </td>
                                    <td>
                                        <div className="action-group justify-end">
                                            <button
                                                type="button"
                                                className="glass-button px-3 py-2 text-xs"
                                                disabled={row.remaining_balance <= 0}
                                                onClick={() => openCreateModal(row)}
                                            >
                                                Post Payment
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {personBalances.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center text-sm text-kgbi-silver/60">
                                        No person balances matched the current filters.
                                    </td>
                                </tr>
                            ) : null}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="table-panel">
                <div className="table-panel-header">
                    <div className="section-eyebrow">Payment History</div>
                    <div className="section-title">Deduction and settlement entries</div>
                </div>
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Person</th>
                                <th>Event</th>
                                <th>Method</th>
                                <th>Amount</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {deductions.data.map((row) => (
                                <tr key={row.id}>
                                    <td>{row.transaction_date}</td>
                                    <td>
                                        {row.person_name}
                                        <div className="mt-1 text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            {row.shortage_reason || 'No reason'}
                                        </div>
                                    </td>
                                    <td>{row.event_name}</td>
                                    <td>{row.method}</td>
                                    <td className="table-number">{formatCurrency(row.amount)}</td>
                                    <td>
                                        <div className="action-group justify-end">
                                            <button
                                                type="button"
                                                onClick={() => openHistoryModal(row)}
                                                className="glass-button-secondary px-3 py-2 text-xs"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (window.confirm('Delete this payment entry?')) {
                                                        router.delete(route('deductions.destroy', row.id), {
                                                            preserveScroll: true,
                                                        });
                                                    }
                                                }}
                                                className="glass-button-danger px-3 py-2 text-xs"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination links={deductions.links} />

            <Modal show={createModalOpen} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate}>
                    <ModalFormShell
                        eyebrow="New Payment"
                        title="Consolidated shortage payment"
                        description="Post a payment against one person. The system automatically spreads the amount across that person's oldest open shortages until the payment is fully consumed."
                        onClose={closeCreateModal}
                        footer={
                            <>
                                <button type="button" onClick={closeCreateModal} className="glass-button-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="glass-button">
                                    Post Payment
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Person" error={createForm.errors.person_id} className="md:col-span-2">
                                <select
                                    className="glass-select"
                                    value={createForm.data.person_id}
                                    onChange={(event) => createForm.setData('person_id', event.target.value)}
                                >
                                    <option value="">Select person</option>
                                    {personBalances
                                        .filter((row) => row.remaining_balance > 0)
                                        .map((row) => (
                                            <option key={row.person_id} value={row.person_id}>
                                                {row.person_name} - Remaining {formatCurrency(row.remaining_balance)}
                                            </option>
                                        ))}
                                </select>
                            </FormField>
                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 md:col-span-2">
                                <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-kgbi-silver/55">
                                    Consolidated Balance
                                </div>
                                <div className="mt-3 grid gap-4 md:grid-cols-3">
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            Total Shortage
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-white">
                                            {formatCurrency(selectedPreview?.total_shortage ?? 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            Total Paid
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-white">
                                            {formatCurrency(selectedPreview?.total_paid ?? 0)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-xs uppercase tracking-[0.2em] text-kgbi-silver/50">
                                            Remaining Balance
                                        </div>
                                        <div className="mt-2 text-lg font-semibold text-white">
                                            {formatCurrency(selectedPreview?.remaining_balance ?? 0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <FormField label="Transaction date" error={createForm.errors.transaction_date}>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={createForm.data.transaction_date}
                                    onChange={(event) =>
                                        createForm.setData('transaction_date', event.target.value)
                                    }
                                />
                            </FormField>
                            <FormField label="Payment amount" error={createForm.errors.amount}>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    className="glass-input"
                                    value={createForm.data.amount}
                                    onChange={(event) => createForm.setData('amount', event.target.value)}
                                />
                            </FormField>
                            <FormField label="Payment method">
                                <input className="glass-input" value="Cash Payment" readOnly disabled />
                            </FormField>
                            <FormField label="Notes" error={createForm.errors.notes} className="md:col-span-2">
                                <textarea
                                    className="glass-input min-h-28"
                                    value={createForm.data.notes}
                                    onChange={(event) => createForm.setData('notes', event.target.value)}
                                />
                            </FormField>
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>

            <Modal show={historyModalOpen} onClose={closeHistoryModal} maxWidth="2xl">
                <form onSubmit={submitEdit}>
                    <ModalFormShell
                        eyebrow="Edit Payment"
                        title="Deduction history entry"
                        description="Adjust a single posted payment entry while preserving the shortage history it belongs to."
                        onClose={closeHistoryModal}
                        footer={
                            <>
                                <button type="button" onClick={closeHistoryModal} className="glass-button-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="glass-button">
                                    Save Changes
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField label="Source shortage" error={editForm.errors.shortage_id} className="md:col-span-2">
                                <input className="glass-input" value={editForm.data.shortage_id} disabled readOnly />
                            </FormField>
                            <FormField label="Transaction date" error={editForm.errors.transaction_date}>
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={editForm.data.transaction_date}
                                    onChange={(event) => editForm.setData('transaction_date', event.target.value)}
                                />
                            </FormField>
                            <FormField label="Amount" error={editForm.errors.amount}>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    className="glass-input"
                                    value={editForm.data.amount}
                                    onChange={(event) => editForm.setData('amount', event.target.value)}
                                />
                            </FormField>
                            <FormField label="Method">
                                <input className="glass-input" value="Cash Payment" readOnly disabled />
                            </FormField>
                            <FormField label="Notes" error={editForm.errors.notes} className="md:col-span-2">
                                <textarea
                                    className="glass-input min-h-28"
                                    value={editForm.data.notes}
                                    onChange={(event) => editForm.setData('notes', event.target.value)}
                                />
                            </FormField>
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
