import FormField from '@/Components/FormField';
import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn, formatCurrency } from '@/lib/utils';
import { Paginated } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import {
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlusIcon,
    TrashIcon,
} from '@heroicons/react/24/solid';
import { FormEvent, useState } from 'react';

type PersonRow = {
    id: number;
    code: string;
    nickname?: string | null;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    suffix?: string | null;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    province?: string | null;
    address?: string | null;
    notes?: string | null;
    is_active: boolean;
    assignments_count: number;
    remittance_total: number;
    shortage_total: number;
    deduction_total: number;
    remaining_balance: number;
};

type Props = {
    people: Paginated<PersonRow>;
    filters: { search?: string; status?: string };
    stats: { total: number; active: number; with_balance: number };
};

const emptyForm = {
    nickname: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    suffix: '',
    phone: '',
    email: '',
    province: '',
    address: '',
    notes: '',
    is_active: true,
};

const stepItems = [
    { title: 'Identity', caption: 'Name and profile basics' },
    { title: 'Contact', caption: 'Reachability and location' },
    { title: 'Review', caption: 'Notes and final status' },
];

export default function PeopleIndex({
    people,
    filters,
    stats: _stats,
}: Props) {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [filterValues, setFilterValues] = useState({
        search: filters.search ?? '',
        status: filters.status ?? '',
    });

    const form = useForm(emptyForm);

    const closeModal = () => {
        setEditingId(null);
        setModalOpen(false);
        setCurrentStep(0);
        form.reset();
        form.clearErrors();
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();

        form.transform((data) => ({
            ...data,
            is_active: data.is_active ? 1 : 0,
        }));

        if (editingId) {
            form.patch(route('people.update', editingId), {
                preserveScroll: true,
                onSuccess: () => closeModal(),
            });
            return;
        }

        form.post(route('people.store'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
        });
    };

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get(route('people.index'), filterValues, {
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
        router.get(route('people.index'), nextFilters, {
            preserveState: true,
            replace: true,
        });
    };

    const startCreate = () => {
        setEditingId(null);
        setCurrentStep(0);
        form.reset();
        form.clearErrors();
        setModalOpen(true);
    };

    const startEdit = (person: PersonRow) => {
        setEditingId(person.id);
        setCurrentStep(0);
        form.setData({
            nickname: person.nickname ?? '',
            first_name: person.first_name,
            middle_name: person.middle_name ?? '',
            last_name: person.last_name,
            suffix: person.suffix ?? '',
            phone: person.phone ?? '',
            email: person.email ?? '',
            province: person.province ?? '',
            address: person.address ?? '',
            notes: person.notes ?? '',
            is_active: person.is_active,
        });
        form.clearErrors();
        setModalOpen(true);
    };

    const initialsFor = (name: string) => {
        const parts = name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2);

        return parts.map((part) => part[0]?.toUpperCase() ?? '').join('');
    };

    const avatarToneFor = (index: number) =>
        [
            'bg-blue-500/18 text-blue-200',
            'bg-violet-500/18 text-violet-200',
            'bg-amber-500/18 text-amber-200',
            'bg-emerald-500/18 text-emerald-200',
        ][index % 4];

    const totalPeople = people.total ?? people.data.length;
    const currentPage = people.current_page ?? 1;
    const perPage = people.per_page ?? (people.data.length || 1);
    const paginationLinks = people.links ?? [];
    const rangeStart = totalPeople === 0 ? 0 : (currentPage - 1) * perPage + 1;
    const rangeEnd = totalPeople === 0 ? 0 : rangeStart + people.data.length - 1;
    const isLastStep = currentStep === stepItems.length - 1;

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Directory"
                    title="People Masterlist"
                    description="Manage teller identities and balances across the organization."
                    actions={
                        <button type="button" className="glass-button" onClick={startCreate}>
                            <PlusIcon className="h-5 w-5" />
                            Add Person
                        </button>
                    }
                />
            }
        >
            <Head title="People Masterlist" />

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
                            placeholder="Search by name, code, or phone..."
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
                                <th>Identity</th>
                                <th>Status</th>
                                <th>Assigned</th>
                                <th>Outstanding Balance</th>
                                <th className="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {people.data.length ? (
                                people.data.map((person, index) => (
                                    <tr key={person.id}>
                                        <td>
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={cn(
                                                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                                        avatarToneFor(index),
                                                    )}
                                                >
                                                    {initialsFor(person.full_name)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        {person.full_name}
                                                    </div>
                                                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-kgbi-silver/50">
                                                        {person.code} • {person.phone || 'No phone'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <StatusBadge
                                                value={person.is_active ? 'active' : 'inactive'}
                                            />
                                        </td>
                                        <td className="font-medium text-slate-300">
                                            {person.assignments_count}{' '}
                                            {person.assignments_count === 1 ? 'Event' : 'Events'}
                                        </td>
                                        <td
                                            className={cn(
                                                'font-semibold tabular-nums',
                                                person.remaining_balance > 0
                                                    ? 'text-rose-300'
                                                    : 'text-slate-500',
                                            )}
                                        >
                                            {formatCurrency(person.remaining_balance)}
                                        </td>
                                        <td>
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(person)}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-200 hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-white"
                                                    aria-label={`Edit ${person.full_name}`}
                                                >
                                                    <PencilSquareIcon className="h-5 w-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${person.full_name}?`)) {
                                                            router.delete(route('people.destroy', person.id), {
                                                                preserveScroll: true,
                                                            });
                                                        }
                                                    }}
                                                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition-all duration-200 hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200"
                                                    aria-label={`Delete ${person.full_name}`}
                                                >
                                                    <TrashIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                                        No people matched the selected filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex flex-col gap-4 border-t border-white/10 bg-[#10192f] px-5 py-4 md:flex-row md:items-center md:justify-between">
                    <div className="text-sm text-slate-400">
                        Showing {rangeStart} to {rangeEnd} of {totalPeople} people
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
                        eyebrow={editingId ? 'Edit Person' : 'New Person'}
                        title={editingId ? 'Update masterlist record' : 'Add masterlist record'}
                        description="Use balanced profile fields so every person record is complete, reusable, and easy to audit across events."
                        onClose={closeModal}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={() =>
                                        currentStep === 0 ? closeModal() : setCurrentStep((step) => step - 1)
                                    }
                                    className="glass-button-secondary"
                                >
                                    {currentStep === 0 ? 'Cancel' : 'Back'}
                                </button>
                                {!isLastStep ? (
                                    <button
                                        type="button"
                                        onClick={() => setCurrentStep((step) => step + 1)}
                                        className="glass-button"
                                    >
                                        Continue
                                    </button>
                                ) : (
                                    <button type="submit" className="glass-button">
                                        {editingId ? 'Save Changes' : 'Create Person'}
                                    </button>
                                )}
                            </>
                        }
                    >
                        <div className="grid gap-3 md:grid-cols-3">
                            {stepItems.map((step, index) => {
                                const isActive = index === currentStep;
                                const isComplete = index < currentStep;

                                return (
                                    <button
                                        key={step.title}
                                        type="button"
                                        onClick={() => setCurrentStep(index)}
                                        className={cn(
                                            'rounded-2xl border px-4 py-3 text-left transition-all duration-200',
                                            isActive
                                                ? 'border-blue-400/40 bg-blue-500/12 shadow-[0_16px_32px_rgba(59,130,246,0.12)]'
                                                : 'border-white/10 bg-white/5 hover:border-blue-400/20 hover:bg-white/[0.06]',
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={cn(
                                                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                                                    isActive || isComplete
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-white/10 text-slate-400',
                                                )}
                                            >
                                                {index + 1}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">
                                                    {step.title}
                                                </div>
                                                <div className="mt-1 text-xs text-slate-400">
                                                    {step.caption}
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {currentStep === 0 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Nickname" error={form.errors.nickname}>
                                    <input
                                        className="glass-input"
                                        value={form.data.nickname}
                                        onChange={(event) => form.setData('nickname', event.target.value)}
                                    />
                                </FormField>
                                <div className="hidden md:block" />
                                <FormField label="First name" error={form.errors.first_name}>
                                    <input
                                        className="glass-input"
                                        value={form.data.first_name}
                                        onChange={(event) => form.setData('first_name', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Middle name" error={form.errors.middle_name}>
                                    <input
                                        className="glass-input"
                                        value={form.data.middle_name}
                                        onChange={(event) => form.setData('middle_name', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Last name" error={form.errors.last_name}>
                                    <input
                                        className="glass-input"
                                        value={form.data.last_name}
                                        onChange={(event) => form.setData('last_name', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Suffix" error={form.errors.suffix}>
                                    <input
                                        className="glass-input"
                                        value={form.data.suffix}
                                        onChange={(event) => form.setData('suffix', event.target.value)}
                                    />
                                </FormField>
                            </div>
                        ) : null}

                        {currentStep === 1 ? (
                            <div className="grid gap-4 md:grid-cols-2">
                                <FormField label="Phone" error={form.errors.phone}>
                                    <input
                                        className="glass-input"
                                        value={form.data.phone}
                                        onChange={(event) => form.setData('phone', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Email" error={form.errors.email}>
                                    <input
                                        type="email"
                                        className="glass-input"
                                        value={form.data.email}
                                        onChange={(event) => form.setData('email', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Province" error={form.errors.province}>
                                    <input
                                        className="glass-input"
                                        value={form.data.province}
                                        onChange={(event) => form.setData('province', event.target.value)}
                                    />
                                </FormField>
                                <div className="hidden md:block" />
                                <FormField label="Address" error={form.errors.address} className="md:col-span-2">
                                    <textarea
                                        className="glass-input min-h-[120px] resize-y"
                                        value={form.data.address}
                                        onChange={(event) => form.setData('address', event.target.value)}
                                    />
                                </FormField>
                            </div>
                        ) : null}

                        {currentStep === 2 ? (
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                            Full Name
                                        </div>
                                        <div className="mt-2 text-base font-semibold text-white">
                                            {[
                                                form.data.first_name,
                                                form.data.middle_name,
                                                form.data.last_name,
                                                form.data.suffix,
                                            ]
                                                .filter(Boolean)
                                                .join(' ') || 'No name entered yet'}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-400">
                                            {form.data.nickname || 'No nickname entered'}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                                        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">
                                            Contact Details
                                        </div>
                                        <div className="mt-2 text-base font-semibold text-white">
                                            {form.data.phone || 'No phone entered'}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-400">
                                            {form.data.email || 'No email entered'}
                                        </div>
                                        <div className="mt-2 text-sm text-slate-400">
                                            {form.data.province || 'No province entered'}
                                        </div>
                                    </div>
                                </div>

                                <FormField label="Address" error={form.errors.address}>
                                    <textarea
                                        className="glass-input min-h-[96px] resize-y"
                                        value={form.data.address}
                                        onChange={(event) => form.setData('address', event.target.value)}
                                    />
                                </FormField>
                                <FormField label="Notes" error={form.errors.notes}>
                                    <textarea
                                        className="glass-input min-h-[96px] resize-y"
                                        value={form.data.notes}
                                        onChange={(event) => form.setData('notes', event.target.value)}
                                    />
                                </FormField>

                                <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-kgbi-silver/80">
                                    <input
                                        type="checkbox"
                                        className="glass-checkbox"
                                        checked={form.data.is_active}
                                        onChange={(event) => form.setData('is_active', event.target.checked)}
                                    />
                                    Active profile
                                </label>
                            </div>
                        ) : null}
                    </ModalFormShell>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
