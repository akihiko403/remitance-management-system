import Modal from '@/Components/Modal';
import ModalFormShell from '@/Components/ModalFormShell';
import PageHeader from '@/Components/PageHeader';
import StatusBadge from '@/Components/StatusBadge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { cn } from '@/lib/utils';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    CheckCircleIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    TrashIcon,
    UserGroupIcon,
    XMarkIcon,
} from '@heroicons/react/24/solid';
import { useMemo, useState } from 'react';

type AttendeeRow = {
    person_id: number;
    person_name: string;
    person_code: string;
    present: boolean;
    teller_label: string;
    teller_number: number;
    full_teller_display: string;
    encoding_status: string;
    has_history: boolean;
};

type AvailablePersonRow = {
    person_id: number;
    person_name: string;
    person_code: string;
    selected: boolean;
    encoding_status: string;
    has_history: boolean;
};

type Props = {
    event: {
        id: number;
        code: string;
        name: string;
        event_date: string;
        event_date_display: string;
        venue?: string | null;
        status: string;
        remarks?: string | null;
        assignments_count: number;
        remittance_total: number;
    };
    attendees: AttendeeRow[];
    availablePeople: AvailablePersonRow[];
    stats: {
        present_count: number;
        encoded_count: number;
        available_people: number;
    };
};

function normalizeTellerNumber(value: string | number) {
    const numericValue =
        typeof value === 'number' ? value : Number.parseInt(value, 10);

    return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 1;
}

function buildFullDisplay(label: string, number: string | number) {
    const normalizedLabel = label.trim().toUpperCase();
    const normalizedNumber = normalizeTellerNumber(number);

    if (!normalizedLabel) {
        return '';
    }

    return `${normalizedLabel} ${normalizedNumber}`;
}

export default function EventAttendance({
    event,
    attendees: initialAttendees,
    availablePeople,
    stats,
}: Props) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerSearch, setPickerSearch] = useState('');
    const [pendingSelection, setPendingSelection] = useState<number[]>([]);

    const form = useForm({
        attendees: initialAttendees.map((person) => ({
            person_id: person.person_id,
            present: true,
            teller_label: person.teller_label,
            teller_number: String(person.teller_number),
        })),
    });

    const selectedPersonIds = useMemo(
        () => new Set(form.data.attendees.map((attendee) => attendee.person_id)),
        [form.data.attendees],
    );

    const selectedRows = useMemo(
        () =>
            form.data.attendees.map((attendee) => {
                const existing = initialAttendees.find((row) => row.person_id === attendee.person_id);
                const person = availablePeople.find((row) => row.person_id === attendee.person_id);
                const personName = existing?.person_name ?? person?.person_name ?? `Person #${attendee.person_id}`;
                const personCode = existing?.person_code ?? person?.person_code ?? '';

                return {
                    person_id: attendee.person_id,
                    person_name: personName,
                    person_code: personCode,
                    teller_label: attendee.teller_label,
                    teller_number: normalizeTellerNumber(attendee.teller_number),
                    encoding_status: existing?.encoding_status ?? person?.encoding_status ?? 'Not Encoded',
                    has_history: existing?.has_history ?? false,
                };
            }),
        [availablePeople, form.data.attendees, initialAttendees],
    );

    const filteredPeople = useMemo(() => {
        const search = pickerSearch.trim().toLowerCase();

        return availablePeople.filter((person) => {
            if (!search) {
                return true;
            }

            return (
                person.person_name.toLowerCase().includes(search) ||
                person.person_code.toLowerCase().includes(search)
            );
        });
    }, [availablePeople, pickerSearch]);

    const livePresentCount = form.data.attendees.length;

    const updateAttendee = (
        index: number,
        field: 'teller_label' | 'teller_number',
        value: string | number,
    ) => {
        const attendees = [...form.data.attendees];
        attendees[index] = {
            ...attendees[index],
            [field]: value,
        };
        form.setData('attendees', attendees);
    };

    const removeAttendee = (personId: number) => {
        const existing = initialAttendees.find((row) => row.person_id === personId);

        if (existing?.has_history) {
            window.alert('This attendee already has remittance or shortage history and cannot be removed.');
            return;
        }

        form.setData(
            'attendees',
            form.data.attendees.filter((attendee) => attendee.person_id !== personId),
        );
    };

    const openPicker = () => {
        setPendingSelection([]);
        setPickerSearch('');
        setPickerOpen(true);
    };

    const closePicker = () => {
        setPendingSelection([]);
        setPickerSearch('');
        setPickerOpen(false);
    };

    const confirmSelection = () => {
        if (!pendingSelection.length) {
            closePicker();
            return;
        }

        const additions = pendingSelection
            .filter((personId) => !selectedPersonIds.has(personId))
            .map((personId) => ({
                person_id: personId,
                present: true,
                teller_label: 'TELLER',
                teller_number: '1',
            }));

        form.setData('attendees', [...form.data.attendees, ...additions]);
        closePicker();
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

    return (
        <AuthenticatedLayout
            header={
                <PageHeader
                    eyebrow="Directory"
                    title="Attendance Masterlist"
                    actions={
                        <div className="flex w-full flex-wrap items-center justify-start gap-3 lg:w-auto lg:flex-nowrap lg:justify-end">
                            <Link href={route('events.index')} className="glass-button-secondary">
                                Back to Events
                            </Link>
                            <Link
                                href={route('remittances.index')}
                                className="glass-button-secondary"
                            >
                                Open Remittance
                            </Link>
                            <button type="button" onClick={openPicker} className="glass-button-secondary">
                                <PlusIcon className="h-5 w-5" />
                                Select People
                            </button>
                            <button type="submit" form="attendance-form" className="glass-button">
                                Save Attendance
                            </button>
                        </div>
                    }
                />
            }
        >
            <Head title={`Attendance - ${event.name}`} />

            <form
                id="attendance-form"
                onSubmit={(formEvent) => {
                    formEvent.preventDefault();
                    form.transform((data) => ({
                        attendees: data.attendees.map((attendee) => ({
                            ...attendee,
                            teller_number: normalizeTellerNumber(attendee.teller_number),
                        })),
                    }));
                    form.put(route('events.attendance.update', event.id), {
                        preserveScroll: true,
                    });
                }}
            >
                {Object.values(form.errors).length ? (
                    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
                        {Object.values(form.errors)[0]}
                    </div>
                ) : null}

                <div className="table-panel">
                    <div className="table-shell">
                        <table>
                            <thead>
                                <tr>
                                    <th>Identity</th>
                                    <th>Teller Label</th>
                                    <th>Teller Number</th>
                                    <th>Full Display</th>
                                    <th>Encoding</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedRows.length ? (
                                    selectedRows.map((person, index) => {
                                        const attendee = form.data.attendees[index];
                                        const fullDisplay = buildFullDisplay(
                                            String(attendee.teller_label ?? ''),
                                            Number(attendee.teller_number ?? 1),
                                        );

                                        return (
                                            <tr key={person.person_id}>
                                                <td>
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                                                                avatarToneFor(index),
                                                            )}
                                                        >
                                                            {initialsFor(person.person_name)}
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-white">
                                                                {person.person_name}
                                                            </div>
                                                            <div className="mt-1 text-xs uppercase tracking-[0.16em] text-kgbi-silver/50">
                                                                {person.person_code}
                                                                {person.has_history ? ' | Has history' : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <input
                                                        className="glass-input h-11 min-w-[9rem] px-3 py-2 text-sm"
                                                        value={attendee.teller_label}
                                                        onChange={(event) =>
                                                            updateAttendee(
                                                                index,
                                                                'teller_label',
                                                                event.target.value,
                                                            )
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        pattern="[0-9]*"
                                                        className="glass-input h-11 min-w-[7rem] px-3 py-2 text-sm"
                                                        value={attendee.teller_number}
                                                        onChange={(event) =>
                                                            updateAttendee(index, 'teller_number', event.target.value.replace(/\D/g, ''))
                                                        }
                                                    />
                                                </td>
                                                <td>
                                                    <div className="inline-flex items-center gap-2 rounded-xl border border-blue-400/30 bg-blue-500/10 px-3 py-2 text-sm font-semibold text-blue-100">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        {fullDisplay || 'Unassigned'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <StatusBadge value={person.encoding_status} />
                                                </td>
                                                <td>
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeAttendee(person.person_id)}
                                                            disabled={person.has_history}
                                                            className={cn(
                                                                'inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200',
                                                                person.has_history
                                                                    ? 'cursor-not-allowed border-white/10 bg-white/5 text-slate-600'
                                                                    : 'border-white/10 bg-white/5 text-slate-400 hover:border-rose-400/35 hover:bg-rose-500/10 hover:text-rose-200',
                                                            )}
                                                            aria-label={`Remove ${person.person_name}`}
                                                        >
                                                            <TrashIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            No attendees selected yet. Use `Select People` to add active people to this event.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-col gap-4 border-t border-white/10 bg-[#10192f] px-5 py-4 md:flex-row md:items-center md:justify-between">
                        <div className="text-sm text-slate-400">
                            Showing {selectedRows.length} selected attendees for {event.name}
                        </div>
                        <div className="text-sm text-slate-300">
                            {livePresentCount} selected | {stats.encoded_count} already encoded | {stats.available_people} active people available
                        </div>
                    </div>
                </div>
            </form>

            <Modal show={pickerOpen} onClose={closePicker} maxWidth="2xl">
                <div className="flex h-full min-h-0 flex-col">
                    <ModalFormShell
                        eyebrow="Attendance Picker"
                        title="Select Event Attendees"
                        description="Search active people and add them to this event. Already selected attendees stay locked in the picker."
                        onClose={closePicker}
                        footer={
                            <>
                                <button
                                    type="button"
                                    onClick={closePicker}
                                    className="glass-button-secondary"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmSelection}
                                    className="glass-button"
                                >
                                    Add Selected People
                                </button>
                            </>
                        }
                    >
                        <label className="relative block">
                            <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                            <input
                                value={pickerSearch}
                                onChange={(event) => setPickerSearch(event.target.value)}
                                className="glass-input pl-12"
                                placeholder="Search by person name or code..."
                            />
                        </label>

                        <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
                            {filteredPeople.length ? (
                                filteredPeople.map((person) => {
                                    const isAlreadySelected = selectedPersonIds.has(person.person_id);
                                    const isPending = pendingSelection.includes(person.person_id);

                                    return (
                                        <label
                                            key={person.person_id}
                                            className={cn(
                                                'flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-4 transition-all duration-200',
                                                isAlreadySelected
                                                    ? 'border-white/10 bg-white/5 opacity-60'
                                                    : isPending
                                                      ? 'border-blue-400/35 bg-blue-500/10'
                                                      : 'border-white/10 bg-white/5 hover:border-blue-400/25 hover:bg-white/[0.06]',
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500/18 text-sm font-bold text-blue-200">
                                                    {initialsFor(person.person_name)}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-white">
                                                        {person.person_name}
                                                    </div>
                                                    <div className="mt-1 text-xs uppercase tracking-[0.16em] text-kgbi-silver/50">
                                                        {person.person_code}
                                                        {person.has_history ? ' | Has history' : ''}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {isAlreadySelected ? (
                                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                                                        <CheckCircleIcon className="h-4 w-4 text-blue-300" />
                                                        Selected
                                                    </span>
                                                ) : null}
                                                <input
                                                    type="checkbox"
                                                    className="glass-checkbox"
                                                    checked={isAlreadySelected || isPending}
                                                    disabled={isAlreadySelected}
                                                    onChange={(event) => {
                                                        if (event.target.checked) {
                                                            setPendingSelection((current) => [
                                                                ...current,
                                                                person.person_id,
                                                            ]);
                                                            return;
                                                        }

                                                        setPendingSelection((current) =>
                                                            current.filter((id) => id !== person.person_id),
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </label>
                                    );
                                })
                            ) : (
                                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-10 text-center text-sm text-slate-400">
                                    No active people matched your search.
                                </div>
                            )}
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                            <span className="font-semibold text-white">{pendingSelection.length}</span> people ready to add
                        </div>
                    </ModalFormShell>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
