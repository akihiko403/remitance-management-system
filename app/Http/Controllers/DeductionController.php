<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDeductionRequest;
use App\Http\Requests\UpdateDeductionRequest;
use App\Models\Deduction;
use App\Models\Person;
use App\Models\Shortage;
use App\Support\BalanceQueries;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DeductionController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::MANAGE_DEDUCTIONS);

        $filters = $request->only(['person_id', 'status']);

        $deductions = Deduction::query()
            ->with(['event', 'person', 'shortage'])
            ->when($request->filled('person_id'), fn ($query) => $query->where('person_id', $request->integer('person_id')))
            ->latest('transaction_date')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Deduction $deduction) => [
                'id' => $deduction->id,
                'shortage_id' => $deduction->shortage_id,
                'event_id' => $deduction->event_id,
                'person_id' => $deduction->person_id,
                'event_name' => $deduction->event->name,
                'person_name' => $deduction->person->full_name,
                'shortage_reason' => $deduction->shortage->reason,
                'transaction_date' => $deduction->transaction_date?->format('Y-m-d'),
                'amount' => (float) $deduction->amount,
                'method' => $deduction->method,
                'reference_number' => $deduction->reference_number,
                'notes' => $deduction->notes,
            ]);

        $personBalances = $this->personBalances($request);

        return Inertia::render('Deductions/Index', [
            'deductions' => $deductions,
            'filters' => $filters,
            'stats' => [
                'total_deducted' => (float) Deduction::query()->sum('amount'),
                'people_with_balance' => $personBalances->where('remaining_balance', '>', 0)->count(),
                'outstanding_total' => round($personBalances->sum('remaining_balance'), 2),
            ],
            'people' => Person::query()->orderBy('last_name')->orderBy('first_name')->get(['id', 'code', 'first_name', 'middle_name', 'last_name', 'suffix'])->map(fn (Person $person) => [
                'id' => $person->id,
                'name' => $person->full_name,
                'code' => $person->code,
            ]),
            'personBalances' => $personBalances,
        ]);
    }

    public function store(StoreDeductionRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_DEDUCTIONS);

        $personId = $request->integer('person_id');
        $amount = (float) $request->input('amount');
        $shortages = $this->openShortagesForPerson($personId);
        $totalRemaining = round($shortages->sum(fn (Shortage $shortage) => $shortage->remaining_balance), 2);

        if ($shortages->isEmpty()) {
            return back()->with('error', 'This person has no remaining shortage balance.');
        }

        if ($amount > $totalRemaining) {
            return back()->with('error', 'Deduction amount exceeds the remaining shortage balance.');
        }

        $createdCount = 0;

        DB::transaction(function () use ($request, $shortages, $amount, $personId, &$createdCount) {
            $remainingAmount = $amount;

            foreach ($shortages as $shortage) {
                if ($remainingAmount <= 0) {
                    break;
                }

                $allocation = min($remainingAmount, (float) $shortage->remaining_balance);

                if ($allocation <= 0) {
                    continue;
                }

                Deduction::query()->create([
                    'shortage_id' => $shortage->id,
                    'event_id' => $shortage->event_id,
                    'person_id' => $personId,
                    'transaction_date' => $request->date('transaction_date'),
                    'amount' => $allocation,
                    'method' => 'Cash Payment',
                    'notes' => $request->input('notes'),
                    'encoded_by' => $request->user()?->id,
                ]);

                $remainingAmount -= $allocation;
                $createdCount++;
            }
        });

        return back()->with('success', $createdCount > 1
            ? 'Payment posted and distributed across multiple shortage balances.'
            : 'Payment posted.');
    }

    public function update(UpdateDeductionRequest $request, Deduction $deduction): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_DEDUCTIONS);

        $shortage = Shortage::query()->withSum('deductions', 'amount')->findOrFail($request->integer('shortage_id'));
        $available = $shortage->remaining_balance + (float) $deduction->amount;
        $amount = (float) $request->input('amount');

        if ($amount > $available) {
            return back()->with('error', 'Deduction amount exceeds the remaining shortage balance.');
        }

        $deduction->update([
            ...$request->validated(),
            'event_id' => $shortage->event_id,
            'person_id' => $shortage->person_id,
            'method' => 'Cash Payment',
        ]);

        return back()->with('success', 'Deduction updated.');
    }

    public function destroy(Deduction $deduction): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_DEDUCTIONS);

        $deduction->delete();

        return back()->with('success', 'Deduction deleted.');
    }

    private function openShortagesForPerson(int $personId)
    {
        return Shortage::query()
            ->withSum('deductions', 'amount')
            ->where('person_id', $personId)
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get()
            ->filter(fn (Shortage $shortage) => $shortage->remaining_balance > 0)
            ->values();
    }

    private function personBalances(Request $request): Collection
    {
        $rows = DB::query()
            ->fromSub(BalanceQueries::personBalances(), 'person_balances')
            ->when($request->filled('person_id'), fn ($query) => $query->where('person_id', $request->integer('person_id')))
            ->get();

        $latestEventNames = BalanceQueries::latestEventNamesByPerson();

        return $rows
            ->map(function (object $row) use ($latestEventNames): array {
                $remainingBalance = round((float) $row->remaining_balance, 2);
                $totalShortage = round((float) $row->total_shortage, 2);
                $totalPaid = round((float) $row->total_paid, 2);

                return [
                    'person_id' => (int) $row->person_id,
                    'person_name' => BalanceQueries::personFullName($row),
                    'person_code' => $row->person_code,
                    'shortage_count' => (int) $row->shortage_count,
                    'open_shortage_count' => (int) $row->open_shortage_count,
                    'total_shortage' => $totalShortage,
                    'total_paid' => $totalPaid,
                    'remaining_balance' => $remainingBalance,
                    'status' => match (true) {
                        $remainingBalance <= 0 && $totalShortage > 0 => 'settled',
                        $totalPaid > 0 && $remainingBalance > 0 => 'partial',
                        $remainingBalance > 0 => 'outstanding',
                        default => 'clear',
                    },
                    'latest_event_name' => $latestEventNames->get($row->person_id),
                ];
            })
            ->when(
                $request->filled('status'),
                fn (Collection $collection) => $collection->where('status', $request->string('status')->value()),
            )
            ->sortBy('person_name')
            ->values();
    }
}
