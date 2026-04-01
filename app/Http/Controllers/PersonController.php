<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePersonRequest;
use App\Http\Requests\UpdatePersonRequest;
use App\Models\Deduction;
use App\Models\Person;
use App\Models\Shortage;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PersonController extends Controller
{
    public function index(Request $request): Response
    {
        $this->ensurePermission(Permissions::MANAGE_PEOPLE);

        $filters = $request->only(['search', 'status']);

        $people = Person::query()
            ->withCount('eventAssignments')
            ->withSum('remittances as remittance_total', 'amount')
            ->withSum('shortages as shortage_total', 'amount')
            ->withSum('deductions as deduction_total', 'amount')
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request) {
                $search = '%'.$request->string('search').'%';

                $query->where(function ($subQuery) use ($search) {
                    $subQuery
                        ->where('code', 'like', $search)
                        ->orWhere('first_name', 'like', $search)
                        ->orWhere('last_name', 'like', $search)
                        ->orWhere('nickname', 'like', $search)
                        ->orWhere('phone', 'like', $search);
                });
            })
            ->when($request->filled('status'), fn ($query) => $query->where('is_active', $request->string('status')->value() === 'active'))
            ->orderBy('last_name')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Person $person) => [
                'id' => $person->id,
                'code' => $person->code,
                'nickname' => $person->nickname,
                'first_name' => $person->first_name,
                'middle_name' => $person->middle_name,
                'last_name' => $person->last_name,
                'suffix' => $person->suffix,
                'full_name' => $person->full_name,
                'phone' => $person->phone,
                'email' => $person->email,
                'province' => $person->province,
                'address' => $person->address,
                'notes' => $person->notes,
                'is_active' => $person->is_active,
                'assignments_count' => $person->event_assignments_count,
                'remittance_total' => (float) ($person->remittance_total ?? 0),
                'shortage_total' => (float) ($person->shortage_total ?? 0),
                'deduction_total' => (float) ($person->deduction_total ?? 0),
                'remaining_balance' => round((float) ($person->shortage_total ?? 0) - (float) ($person->deduction_total ?? 0), 2),
            ]);

        $stats = [
            'total' => Person::query()->count(),
            'active' => Person::query()->where('is_active', true)->count(),
            'with_balance' => $this->peopleWithBalanceCount(),
        ];

        return Inertia::render('People/Index', [
            'people' => $people,
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }

    public function store(StorePersonRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_PEOPLE);

        Person::query()->create([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Masterlist person created.');
    }

    public function update(UpdatePersonRequest $request, Person $person): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_PEOPLE);

        $person->update([
            ...$request->validated(),
            'is_active' => $request->boolean('is_active', true),
        ]);

        return back()->with('success', 'Masterlist person updated.');
    }

    public function destroy(Person $person): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_PEOPLE);

        if ($person->eventAssignments()->exists() || $person->remittances()->exists() || $person->shortages()->exists() || $person->deductions()->exists()) {
            return back()->with('error', 'This person already has financial or assignment history and cannot be deleted.');
        }

        $person->delete();

        return back()->with('success', 'Masterlist person removed.');
    }

    private function peopleWithBalanceCount(): int
    {
        $shortageTotals = Shortage::query()
            ->selectRaw('person_id, SUM(amount) as shortage_total')
            ->groupBy('person_id');

        $deductionTotals = Deduction::query()
            ->selectRaw('person_id, SUM(amount) as deduction_total')
            ->groupBy('person_id');

        return DB::query()
            ->fromSub(
                Person::query()
                    ->leftJoinSub($shortageTotals, 'shortage_totals', function ($join): void {
                        $join->on('shortage_totals.person_id', '=', 'people.id');
                    })
                    ->leftJoinSub($deductionTotals, 'deduction_totals', function ($join): void {
                        $join->on('deduction_totals.person_id', '=', 'people.id');
                    })
                    ->selectRaw('people.id, COALESCE(shortage_totals.shortage_total, 0) - COALESCE(deduction_totals.deduction_total, 0) as remaining_balance'),
                'person_balances'
            )
            ->where('remaining_balance', '>', 0)
            ->count();
    }
}
