<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreShortageRequest;
use App\Http\Requests\UpdateShortageRequest;
use App\Models\Deduction;
use App\Models\Event;
use App\Models\EventTellerAssignment;
use App\Models\Person;
use App\Models\Shortage;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShortageController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::MANAGE_SHORTAGES);

        $filters = $request->only(['event_id', 'person_id', 'status']);

        $shortages = Shortage::query()
            ->with(['event', 'person', 'assignment'])
            ->withSum('deductions', 'amount')
            ->when($request->filled('event_id'), fn ($query) => $query->where('event_id', $request->integer('event_id')))
            ->when($request->filled('person_id'), fn ($query) => $query->where('person_id', $request->integer('person_id')))
            ->latest('transaction_date')
            ->get()
            ->map(fn (Shortage $shortage) => [
                'id' => $shortage->id,
                'event_id' => $shortage->event_id,
                'person_id' => $shortage->person_id,
                'event_teller_assignment_id' => $shortage->event_teller_assignment_id,
                'event_name' => $shortage->event->name,
                'person_name' => $shortage->person->full_name,
                'teller_position' => $shortage->assignment?->teller_position,
                'transaction_date' => $shortage->transaction_date?->format('Y-m-d'),
                'amount' => (float) $shortage->amount,
                'paid_amount' => $shortage->paid_amount,
                'remaining_balance' => $shortage->remaining_balance,
                'settlement_status' => $shortage->settlement_status,
                'reason' => $shortage->reason,
                'notes' => $shortage->notes,
            ])
            ->when($request->filled('status'), fn ($collection) => $collection->where('settlement_status', $request->string('status')->value()))
            ->values();

        return Inertia::render('Shortages/Index', [
            'shortages' => [
                'data' => $shortages,
            ],
            'filters' => $filters,
            'stats' => [
                'total_shortage' => (float) Shortage::query()->sum('amount'),
                'total_collected' => (float) Deduction::query()->sum('amount'),
                'outstanding' => round($shortages->sum('remaining_balance'), 2),
            ],
            'events' => Event::query()->latest('event_date')->get(['id', 'name', 'code']),
            'people' => Person::query()->orderBy('last_name')->get()->map(fn (Person $person) => [
                'id' => $person->id,
                'name' => $person->full_name,
                'code' => $person->code,
            ]),
            'assignments' => EventTellerAssignment::query()
                ->with(['event', 'person'])
                ->get()
                ->map(fn (EventTellerAssignment $assignment) => [
                    'id' => $assignment->id,
                    'event_id' => $assignment->event_id,
                    'person_id' => $assignment->person_id,
                    'label' => $assignment->event->code.' - '.$assignment->person->full_name.' / '.$assignment->teller_position,
                ]),
        ]);
    }

    public function store(StoreShortageRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_SHORTAGES);

        $data = $request->validated();

        if (! $this->assignmentMatches($data['event_teller_assignment_id'] ?? null, $data['event_id'], $data['person_id'])) {
            return back()->with('error', 'Selected teller assignment does not match the chosen event and person.');
        }

        Shortage::query()->create([
            ...$data,
            'encoded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Shortage recorded.');
    }

    public function update(UpdateShortageRequest $request, Shortage $shortage): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_SHORTAGES);

        $data = $request->validated();

        if (! $this->assignmentMatches($data['event_teller_assignment_id'] ?? null, $data['event_id'], $data['person_id'])) {
            return back()->with('error', 'Selected teller assignment does not match the chosen event and person.');
        }

        $shortage->update($data);

        return back()->with('success', 'Shortage updated.');
    }

    public function destroy(Shortage $shortage): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_SHORTAGES);

        if ($shortage->deductions()->exists()) {
            return back()->with('error', 'This shortage already has deductions and cannot be deleted.');
        }

        $shortage->delete();

        return back()->with('success', 'Shortage deleted.');
    }

    private function assignmentMatches(?int $assignmentId, int $eventId, int $personId): bool
    {
        if (! $assignmentId) {
            return true;
        }

        return EventTellerAssignment::query()
            ->whereKey($assignmentId)
            ->where('event_id', $eventId)
            ->where('person_id', $personId)
            ->exists();
    }
}
