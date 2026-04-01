<?php

namespace App\Http\Controllers;

use App\Http\Requests\SyncEventAttendanceRequest;
use App\Models\Event;
use App\Models\EventTellerAssignment;
use App\Models\Person;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EventTellerAssignmentController extends Controller
{
    public function index(Event $event): Response
    {
        $this->ensurePermission(Permissions::MANAGE_ASSIGNMENTS);

        $event->loadCount('assignments');
        $event->loadSum('remittances as remittance_total', 'amount');

        $assignments = $event->assignments()
            ->with('person')
            ->withExists(['remittance as has_remittance', 'shortages as has_shortages'])
            ->get()
            ->keyBy('person_id');

        return Inertia::render('Events/Attendance', [
            'event' => [
                'id' => $event->id,
                'code' => $event->code,
                'name' => $event->name,
                'event_date' => $event->event_date?->format('Y-m-d'),
                'event_date_display' => $event->event_date?->format('F d, Y'),
                'venue' => $event->venue,
                'status' => $event->status,
                'remarks' => $event->description,
                'assignments_count' => $event->assignments_count,
                'remittance_total' => (float) ($event->remittance_total ?? 0),
            ],
            'attendees' => $assignments
                ->values()
                ->map(function (EventTellerAssignment $assignment) {
                    return [
                        'person_id' => $assignment->person_id,
                        'person_name' => $assignment->person->full_name,
                        'person_code' => $assignment->person->code,
                        'present' => true,
                        'teller_label' => $assignment->teller_label ?? 'TELLER',
                        'teller_number' => $assignment->teller_number ?? 1,
                        'full_teller_display' => $assignment->full_teller_display ?? '',
                        'encoding_status' => $assignment->has_remittance ? 'Encoded' : 'Not Encoded',
                        'has_history' => (bool) ($assignment->has_remittance || $assignment->has_shortages),
                    ];
                })
                ->values(),
            'availablePeople' => Person::query()
                ->where('is_active', true)
                ->orderBy('last_name')
                ->orderBy('first_name')
                ->get()
                ->map(function (Person $person) use ($assignments) {
                    $assignment = $assignments->get($person->id);

                    return [
                        'person_id' => $person->id,
                        'person_name' => $person->full_name,
                        'person_code' => $person->code,
                        'selected' => (bool) $assignment,
                        'encoding_status' => $assignment?->has_remittance ? 'Encoded' : 'Not Encoded',
                        'has_history' => (bool) ($assignment?->has_remittance || $assignment?->has_shortages),
                    ];
                })
                ->values(),
            'stats' => [
                'present_count' => $assignments->count(),
                'encoded_count' => $assignments->filter(fn (EventTellerAssignment $assignment) => (bool) $assignment->has_remittance)->count(),
                'available_people' => Person::query()->where('is_active', true)->count(),
            ],
        ]);
    }

    public function update(SyncEventAttendanceRequest $request, Event $event): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_ASSIGNMENTS);

        $attendees = collect($request->validated('attendees'))
            ->map(fn (array $attendee) => [
                'person_id' => (int) $attendee['person_id'],
                'present' => (bool) $attendee['present'],
                'teller_label' => $attendee['teller_label'] ?? null,
                'teller_number' => $attendee['teller_number'] ?? null,
            ]);

        $desiredAssignments = $attendees
            ->filter(fn (array $attendee) => $attendee['present'])
            ->mapWithKeys(function (array $attendee) {
                return [
                    $attendee['person_id'] => [
                        'teller_label' => EventTellerAssignment::normalizeTellerLabel($attendee['teller_label']),
                        'teller_number' => max((int) $attendee['teller_number'], 1),
                        'full_teller_display' => EventTellerAssignment::buildFullTellerDisplay(
                            $attendee['teller_label'],
                            $attendee['teller_number'],
                        ),
                    ],
                ];
            });

        $existingAssignments = $event->assignments()
            ->withExists(['remittance as has_remittance', 'shortages as has_shortages'])
            ->get()
            ->keyBy('person_id');

        $assignmentsToRemove = $existingAssignments
            ->keys()
            ->diff($desiredAssignments->keys())
            ->map(fn ($personId) => $existingAssignments->get($personId));

        $blockedRemoval = $assignmentsToRemove->first(
            fn (EventTellerAssignment $assignment) => (bool) ($assignment->has_remittance || $assignment->has_shortages),
        );

        if ($blockedRemoval) {
            return back()->with('error', 'An attendee with remittance or shortage history cannot be removed from this event.');
        }

        DB::transaction(function () use ($desiredAssignments, $event, $existingAssignments, $assignmentsToRemove): void {
            $desiredAssignments->each(function (array $payload, int $personId) use ($event, $existingAssignments): void {
                $assignment = $existingAssignments->get($personId) ?? new EventTellerAssignment([
                    'event_id' => $event->id,
                    'person_id' => $personId,
                    'team' => 'Finance Ops',
                    'is_lead' => false,
                ]);

                $assignment->fill($payload);
                $assignment->save();
            });

            $assignmentsToRemove->each(fn (EventTellerAssignment $assignment) => $assignment->delete());
        });

        return back()->with('success', 'Event attendance and teller assignments updated.');
    }
}
