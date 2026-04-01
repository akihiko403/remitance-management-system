<?php

namespace App\Http\Controllers;

use App\Http\Requests\EncodeActiveEventRemittanceRequest;
use App\Http\Requests\StoreRemittanceRequest;
use App\Http\Requests\UpdateRemittanceRequest;
use App\Models\Event;
use App\Models\EventTellerAssignment;
use App\Models\Remittance;
use App\Models\Shortage;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class RemittanceController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::MANAGE_REMITTANCES);

        $activeEvent = Event::query()
            ->active()
            ->withCount('assignments')
            ->withCount(['remittances as encoded_count'])
            ->withSum('remittances as total_remittance', 'amount')
            ->latest('event_date')
            ->first();

        return Inertia::render('Remittances/Index', [
            'activeEvent' => $activeEvent ? [
                'id' => $activeEvent->id,
                'code' => $activeEvent->code,
                'name' => $activeEvent->name,
                'event_date' => $activeEvent->event_date?->format('F d, Y'),
                'venue' => $activeEvent->venue,
            ] : null,
            'rows' => $activeEvent
                ? EventTellerAssignment::query()
                    ->with([
                        'person' => fn ($query) => $query
                            ->withSum(
                                ['shortages as previous_shortage_total' => fn ($shortageQuery) => $shortageQuery->where('event_id', '!=', $activeEvent->id)],
                                'amount'
                            )
                            ->withSum(
                                ['deductions as previous_deduction_total' => fn ($deductionQuery) => $deductionQuery->where('event_id', '!=', $activeEvent->id)],
                                'amount'
                            ),
                        'remittance',
                    ])
                    ->where('event_id', $activeEvent->id)
                    ->orderBy('full_teller_display')
                    ->get()
                    ->map(fn (EventTellerAssignment $assignment) => [
                        'assignment_id' => $assignment->id,
                        'person_id' => $assignment->person_id,
                        'name' => $assignment->person->full_name,
                        'teller_position' => $assignment->full_teller_display,
                        'event_name' => $activeEvent->name,
                        'encoding_status' => $assignment->remittance ? 'Encoded' : 'Not Encoded',
                        'remittance' => $assignment->remittance ? [
                            'id' => $assignment->remittance->id,
                            'remittance_amount' => (float) $assignment->remittance->amount,
                            'cash_on_hand' => (float) $assignment->remittance->cash_on_hand,
                            'short_amount' => (float) $assignment->remittance->short_amount,
                            'remarks' => $assignment->remittance->notes,
                        ] : null,
                        'previous_balance' => round(
                            max(
                                (float) ($assignment->person->previous_shortage_total ?? 0) -
                                (float) ($assignment->person->previous_deduction_total ?? 0),
                                0
                            ),
                            2
                        ),
                    ])
                    ->values()
                : [],
            'stats' => $activeEvent ? [
                'assigned_count' => (int) $activeEvent->assignments_count,
                'encoded_count' => (int) $activeEvent->encoded_count,
                'total_remittance' => (float) ($activeEvent->total_remittance ?? 0),
            ] : [
                'assigned_count' => 0,
                'encoded_count' => 0,
                'total_remittance' => 0,
            ],
        ]);
    }

    public function upsertForAssignment(
        EncodeActiveEventRemittanceRequest $request,
        EventTellerAssignment $assignment,
    ): RedirectResponse {
        $this->ensurePermission(Permissions::MANAGE_REMITTANCES);

        $activeEvent = Event::query()->active()->latest('event_date')->first();

        if (! $activeEvent) {
            return back()->with('error', 'No active event is available for remittance encoding.');
        }

        if ($assignment->event_id !== $activeEvent->id) {
            return back()->with('error', 'The selected assignment does not belong to the current active event.');
        }

        $remittanceAmount = round((float) $request->input('remittance_amount'), 2);
        $cashOnHand = round((float) $request->input('cash_on_hand'), 2);
        $shortAmount = round(max($remittanceAmount - $cashOnHand, 0), 2);

        DB::transaction(function () use ($activeEvent, $assignment, $request, $remittanceAmount, $cashOnHand, $shortAmount): void {
            $existingRemittance = $assignment->remittance;

            $remittance = Remittance::query()->updateOrCreate(
                ['event_teller_assignment_id' => $assignment->id],
                [
                    'event_id' => $activeEvent->id,
                    'person_id' => $assignment->person_id,
                    'transaction_date' => $existingRemittance?->transaction_date ?? $activeEvent->event_date,
                    'amount' => $remittanceAmount,
                    'cash_on_hand' => $cashOnHand,
                    'short_amount' => $shortAmount,
                    'notes' => $request->input('remarks'),
                    'encoded_by' => $request->user()?->id,
                ],
            );

            $this->syncShortageLedger($remittance, $assignment, $shortAmount);
        });

        return back()->with('success', 'Remittance saved.');
    }

    public function store(StoreRemittanceRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_REMITTANCES);

        $data = $request->validated();

        if (! $this->assignmentMatches($data['event_teller_assignment_id'] ?? null, $data['event_id'], $data['person_id'])) {
            return back()->with('error', 'Selected teller assignment does not match the chosen event and person.');
        }

        Remittance::query()->create([
            ...$data,
            'encoded_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Remittance recorded.');
    }

    public function update(UpdateRemittanceRequest $request, Remittance $remittance): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_REMITTANCES);

        $data = $request->validated();

        if (! $this->assignmentMatches($data['event_teller_assignment_id'] ?? null, $data['event_id'], $data['person_id'])) {
            return back()->with('error', 'Selected teller assignment does not match the chosen event and person.');
        }

        $remittance->update($data);

        return back()->with('success', 'Remittance updated.');
    }

    public function destroy(Remittance $remittance): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_REMITTANCES);

        $remittance->delete();

        return back()->with('success', 'Remittance deleted.');
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

    private function syncShortageLedger(Remittance $remittance, EventTellerAssignment $assignment, float $shortAmount): void
    {
        $shortage = Shortage::query()->firstWhere('remittance_id', $remittance->id);

        if ($shortAmount > 0) {
            Shortage::query()->updateOrCreate(
                ['remittance_id' => $remittance->id],
                [
                    'event_id' => $remittance->event_id,
                    'person_id' => $remittance->person_id,
                    'event_teller_assignment_id' => $assignment->id,
                    'transaction_date' => $remittance->transaction_date,
                    'amount' => $shortAmount,
                    'reason' => 'Auto-computed from remittance encoding',
                    'notes' => $remittance->notes,
                    'encoded_by' => $remittance->encoded_by,
                ],
            );

            return;
        }

        if (! $shortage) {
            return;
        }

        if ($shortage->deductions()->exists()) {
            $shortage->update([
                'amount' => 0,
                'notes' => $remittance->notes,
            ]);

            return;
        }

        $shortage->delete();
    }
}
