import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn, formatCurrency } from '@/lib/utils';
import { Paginated } from '@/types';
import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    CalendarDaysIcon as CalendarDaysSolidIcon,
    ChatBubbleLeftRightIcon,
    CalendarDaysIcon,
    MagnifyingGlassIcon,
    MapPinIcon,
    PencilSquareIcon,
    PlusIcon,
    TagIcon,
    TrashIcon,
    UserGroupIcon,
} from '@heroicons/react/24/solid';
import { FormEvent, useState } from 'react';

type EventRow = {
    id: number;
    code: string;
    name: string;
    slug: string;
    event_date: string;
    venue?: string | null;
    status: string;
    remarks?: string | null;
    assignments_count: number;
    remittance_total: number;
    shortage_total: number;
    deduction_total: number;
    balance: number;
};

type Props = {
    events: Paginated<EventRow>;
    filters: { search?: string; status?: string };
    stats: { active: number; inactive: number };
};

const emptyEvent = {
    name: '',
    event_date: '',
    venue: '',
    status: 'inactive',
    currency: 'PHP',
    description: '',
};

export default function EventsIndex({ events, filters, stats: _stats }: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [filterValues, setFilterValues] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
    });

    const form = useForm(emptyEvent);

    const closeModal = () => {
        setEditingId(null);
        setModalOpen(false);
        form.reset();
        form.clearErrors();
    };

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('events.index'), filterValues, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilters = () => {
        const nextFilters = {
            search: '',
            status: '',
        };

        setFilterValues(nextFilters);
        router.get(route('events.index'), nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editingId) {
            form.patch(route('events.update', editingId), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
            return;
        }

        form.post(route('events.store'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const startCreate = () => {
        setEditingId(null);
        form.reset();
        form.setData('status', 'inactive');
        form.clearErrors();
        setModalOpen(true);
    };

    const startEdit = (row: EventRow) => {
        setEditingId(row.id);
        form.setData({
            name: row.name,
            event_date: row.event_date,
            venue: row.venue ?? '',
            status: row.status,
            currency: 'PHP',
            description: row.remarks ?? '',
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const totalEvents = events.total ?? events.data.length;
    const currentPage = events.current_page ?? 1;
    const perPage = events.per_page ?? (events.data.length || 1);
    const paginationLinks = events.links ?? [];
    const rangeStart = totalEvents === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const rangeEnd = totalEvents === 0 ? 0 : rangeStart + events.data.length - 1;
    const modalTitle = editingId ? 'Update Masterlist Event' : 'Add Masterlist Event';
    const modalActionLabel = editingId ? 'Save Changes' : 'Create Event';

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Directory"
                    title="Event Masterlist"
                    description="Manage event records, remittance cycles, and attendance operations from one unified directory."
                    actions={
                        <button type="button" className="glass-button" onClick={startCreate}>
                            <PlusIcon className="h-5 w-5" />
                            Add Event
                        </button>
                    }
                />
            }
        >
            <Head title="Events" />

            <div className="app-surface panel-pad">
                <form
                    onSubmit={applyFilters}
                    className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_180px_120px]"
                >
                    <label className="relative block">
                        <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                        <input
                            value={filterValues.search}
                            onChange={(event) =>
                                setFilterValues((current) => ({
                                    ...current,
                                    search: event.target.value,
                                }))
                            }
                            className="glass-input pl-12"
                            placeholder="Search by code, event name, or venue..."
                        />
                    </label>
                    <select
                        value={filterValues.status}
                        onChange={(event) =>
                            setFilterValues((current) => ({
                                ...current,
                                status: event.target.value,
                            }))
                        }
                        className="glass-select"
                    >
                        <option value="">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    <button
                        type="button"
                        className="glass-button-secondary"
                        onClick={resetFilters}
                    >
                        Reset
                    </button>
                </form>
            </div>

            <div className="table-panel">
                <div className="table-shell">
                    <table>
                        <thead>
                            <tr>
                                <th>Event</th>
                                <th>Status</th>
                                <th>Assigned</th>
                                <th>Total Remittance</th>
                                <th>Open Balance</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {events.data.length ? (
                                events.data.map((event) => (
                                    <tr key={event.id}>
                                        <td>
                                            <div className="space-y-2">
                                                <div className="font-semibold text-white">
                                                    {event.name}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-kgbi-silver/50">
                                                    <span>{event.code}</span>
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <CalendarDaysSolidIcon className="h-3.5 w-3.5" />
                                                        {event.event_date}
                                                    </span>
                                                    <span>{event.venue || 'Venue pending'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge value={event.status} />
                                        </td>
                                        <td className="font-medium text-slate-300">
                                            <div className="inline-flex items-center gap-2">
                                                <UserGroupIcon className="h-4 w-4 text-blue-300" />
                                                <span>
                                                    {event.assignments_count}{' '}
                                                    {event.assignments_count === 1 ? 'Person' : 'People'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="font-semibold tabular-nums text-slate-200">
                                            {formatCurrency(event.remittance_total)}
                                        </td>
                                        <td
                                            className={cn(
                                                'font-semibold tabular-nums',
                                                event.balance > 0 ? 'text-rose-300' : 'text-slate-500',
                                            )}
                                        >
                                            {formatCurrency(event.balance)}
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={route('events.attendance.index', event.id)}
                                                    className="inline-flex h-10 items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/12 px-4 text-sm font-medium text-blue-100 transition-all duration-200 hover:border-blue-300/50 hover:bg-blue-500/20 hover:text-white"
                                                >
                                                    Attendance
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(event)}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-200 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white"
                                                    aria-label={`Edit ${event.name}`}
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${event.name}?`)) {
                                                            router.delete(route('events.destroy', event.id), {
                                                                preserveScroll: true,
                                                            });
                                                        }
                                                    }}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200"
                                                    aria-label={`Delete ${event.name}`}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                        No events matched the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-4 border-t border-white/10 bg-[#10192f] px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-400">
                        Showing {rangeStart} to {rangeEnd} of {totalEvents} events
                    </div>
                    {paginationLinks.length > 3 ? (
                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                            {paginationLinks.map((link, index) =>
                                link.url ? (
                                    <button
                                        key={`${link.label}-${index}`}
                                        type="button"
                                        onClick={() => {
                                            if (!link.url) {
                                                return;
                                            }

                                            router.get(link.url, {}, {
                                                preserveScroll: true,
                                                preserveState: true,
                                            });
                                        }}
                                        className={cn(
                                            'inline-flex min-h-[2.45rem] items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                                            link.active
                                                ? 'border-blue-400/40 bg-blue-500/20 text-blue-100 shadow-[0_12px_24px_rgba(59,130,246,0.18)]'
                                                : 'border-white/10 bg-white/5 text-slate-300 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white',
                                        )}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={`${link.label}-${index}`}
                                        className="inline-flex min-h-[2.45rem] items-center justify-center rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-500"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ),
                            )}
                        </div>
                    ) : null}
                </div>
            </div>

            <Modal show={modalOpen} onClose={closeModal} maxWidth="2xl">
                <form onSubmit={submit} className="flex h-full min-h-0 flex-col">
                    <ModalFormShell
                        eyebrow="System Administration"
                        title={modalTitle}
                        description="Initialize your event profile to synchronize attendance tracking, remittance encoding, and real-time balance monitoring."
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
                                <button type="submit" className="glass-button">
                                    {modalActionLabel}
                                </button>
                            </>
                        }
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                label={
                                    <span className="inline-flex items-center gap-2">
                                        <CalendarDaysIcon className="h-4 w-4" />
                                        Event Date
                                    </span>
                                }
                                error={form.errors.event_date}
                            >
                                <input
                                    type="date"
                                    className="glass-input"
                                    value={form.data.event_date}
                                    onChange={(event) => form.setData('event_date', event.target.value)}
                                />
                            </FormField>
                            <FormField
                                label={
                                    <span className="inline-flex items-center gap-2">
                                        <TagIcon className="h-4 w-4" />
                                        Status
                                    </span>
                                }
                                error={form.errors.status}
                            >
                                <select
                                    className="glass-select"
                                    value={form.data.status}
                                    onChange={(event) => form.setData('status', event.target.value)}
                                >
                                    <option value="inactive">Inactive</option>
                                    <option value="active">Active</option>
                                </select>
                            </FormField>
                            <FormField
                                label={
                                    <span className="inline-flex items-center gap-2">
                                        <PlusIcon className="h-4 w-4" />
                                        Event Name
                                    </span>
                                }
                                error={form.errors.name}
                                className="md:col-span-2"
                            >
                                <input
                                    className="glass-input"
                                    value={form.data.name}
                                    placeholder="e.g., Annual General Assembly 2024"
                                    onChange={(event) => form.setData('name', event.target.value)}
                                />
                            </FormField>
                            <FormField
                                label={
                                    <span className="inline-flex items-center gap-2">
                                        <MapPinIcon className="h-4 w-4" />
                                        Venue
                                    </span>
                                }
                                error={form.errors.venue}
                                className="md:col-span-2"
                            >
                                <input
                                    className="glass-input"
                                    value={form.data.venue}
                                    placeholder="Enter building, hall, or room name"
                                    onChange={(event) => form.setData('venue', event.target.value)}
                                />
                            </FormField>
                            <FormField
                                label={
                                    <span className="inline-flex items-center gap-2">
                                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                        Remarks
                                    </span>
                                }
                                error={form.errors.description}
                                className="md:col-span-2"
                            >
                                <textarea
                                    className="glass-textarea min-h-[120px] resize-none"
                                    value={form.data.description}
                                    placeholder="Add any additional notes or instructions for this event..."
                                    onChange={(event) => form.setData('description', event.target.value)}
                                />
                            </FormField>
                        </div>
                    </ModalFormShell>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
