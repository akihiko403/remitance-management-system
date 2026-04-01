<?php

use App\Models\Deduction;
use App\Models\Event;
use App\Models\Person;
use App\Models\Remittance;
use App\Models\Shortage;
use App\Models\User;
use App\Support\Permissions;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function performanceAuthorizedUser(string ...$permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function performanceEvent(array $attributes = []): Event
{
    static $sequence = 1;

    $event = Event::query()->create([
        'code' => $attributes['code'] ?? sprintf('PERF-EV-%04d', $sequence),
        'name' => $attributes['name'] ?? 'Performance Event '.$sequence,
        'event_date' => $attributes['event_date'] ?? now()->addDays($sequence)->toDateString(),
        'venue' => $attributes['venue'] ?? 'Performance Venue',
        'status' => $attributes['status'] ?? 'inactive',
        'description' => $attributes['description'] ?? 'Performance test event',
        'currency' => 'PHP',
    ]);

    $sequence++;

    return $event;
}

function performancePerson(array $attributes = []): Person
{
    static $sequence = 1;

    $person = Person::query()->create([
        'code' => $attributes['code'] ?? sprintf('PERF-P-%04d', $sequence),
        'first_name' => $attributes['first_name'] ?? 'Perf',
        'middle_name' => $attributes['middle_name'] ?? null,
        'last_name' => $attributes['last_name'] ?? 'User '.$sequence,
        'suffix' => $attributes['suffix'] ?? null,
        'phone' => $attributes['phone'] ?? '+63 917 777 00'.$sequence,
        'email' => $attributes['email'] ?? 'perf'.$sequence.'@example.com',
        'is_active' => $attributes['is_active'] ?? true,
    ]);

    $sequence++;

    return $person;
}

function performanceShortage(Event $event, Person $person, float $amount, array $attributes = []): Shortage
{
    return Shortage::query()->create([
        'event_id' => $event->id,
        'person_id' => $person->id,
        'transaction_date' => $attributes['transaction_date'] ?? $event->event_date,
        'amount' => $amount,
        'reason' => $attributes['reason'] ?? 'Performance shortage',
        'notes' => $attributes['notes'] ?? 'Performance test shortage',
    ]);
}

test('people index computes with balance stats without changing the payload', function () {
    $user = performanceAuthorizedUser(Permissions::MANAGE_PEOPLE);

    $withBalance = performancePerson(['first_name' => 'With', 'last_name' => 'Balance']);
    $settled = performancePerson(['first_name' => 'Settled', 'last_name' => 'Person']);

    $event = performanceEvent();

    $withBalanceShortage = performanceShortage($event, $withBalance, 500);
    $settledShortage = performanceShortage($event, $settled, 300);

    Deduction::query()->create([
        'shortage_id' => $settledShortage->id,
        'event_id' => $event->id,
        'person_id' => $settled->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 300,
        'method' => 'Cash Payment',
    ]);

    Deduction::query()->create([
        'shortage_id' => $withBalanceShortage->id,
        'event_id' => $event->id,
        'person_id' => $withBalance->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 100,
        'method' => 'Cash Payment',
    ]);

    $this->actingAs($user)
        ->get(route('people.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('stats.total', 2)
            ->where('stats.active', 2)
            ->where('stats.with_balance', 1));
});

test('outstanding and zero balance reports preserve their totals', function () {
    $user = performanceAuthorizedUser(Permissions::VIEW_REPORTS);

    $event = performanceEvent(['name' => 'Report Event']);
    $outstandingPerson = performancePerson(['first_name' => 'Open', 'last_name' => 'Balance']);
    $settledPerson = performancePerson(['first_name' => 'Zero', 'last_name' => 'Balance']);

    $outstandingShortage = performanceShortage($event, $outstandingPerson, 800);
    $settledShortage = performanceShortage($event, $settledPerson, 450);

    Deduction::query()->create([
        'shortage_id' => $outstandingShortage->id,
        'event_id' => $event->id,
        'person_id' => $outstandingPerson->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 125,
        'method' => 'Cash Payment',
    ]);

    Deduction::query()->create([
        'shortage_id' => $settledShortage->id,
        'event_id' => $event->id,
        'person_id' => $settledPerson->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 450,
        'method' => 'Cash Payment',
    ]);

    $this->actingAs($user)
        ->get(route('reports.outstanding-balances'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('report.rows.0.person_name', $outstandingPerson->full_name)
            ->where('report.rows.0.balance', 675)
            ->where('report.summary.0.value', 1)
            ->where('report.summary.3.value', 675));

    $this->actingAs($user)
        ->get(route('reports.zero-balances'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('report.rows.0.person_name', $settledPerson->full_name)
            ->where('report.rows.0.balance', 0)
            ->where('report.summary.0.value', 1)
            ->where('report.summary.1.value', 450));
});

test('person ledger keeps the running balance order and totals', function () {
    $user = performanceAuthorizedUser(Permissions::VIEW_REPORTS);

    $person = performancePerson(['first_name' => 'Ledger', 'last_name' => 'Target']);
    $event = performanceEvent(['name' => 'Ledger Event', 'event_date' => now()->subDays(3)->toDateString()]);

    performanceShortage($event, $person, 500, ['transaction_date' => now()->subDays(3)->toDateString(), 'reason' => 'Initial shortage']);

    $shortageForDeduction = performanceShortage($event, $person, 100, ['transaction_date' => now()->subDays(2)->toDateString(), 'reason' => 'Follow-up shortage']);

    Deduction::query()->create([
        'shortage_id' => $shortageForDeduction->id,
        'event_id' => $event->id,
        'person_id' => $person->id,
        'transaction_date' => now()->subDay()->toDateString(),
        'amount' => 75,
        'method' => 'Cash Payment',
    ]);

    Remittance::query()->create([
        'event_id' => $event->id,
        'person_id' => $person->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 900,
        'cash_on_hand' => 900,
        'short_amount' => 0,
        'reference_number' => 'REM-LEDGER-001',
    ]);

    $this->actingAs($user)
        ->get(route('reports.person-ledger', ['person_id' => $person->id]))
        ->assertInertia(fn (Assert $page) => $page
            ->where('report.rows.0.type', 'Shortage')
            ->where('report.rows.0.running_balance', 500)
            ->where('report.rows.1.type', 'Shortage')
            ->where('report.rows.1.running_balance', 600)
            ->where('report.rows.2.type', 'Deduction')
            ->where('report.rows.2.running_balance', 525)
            ->where('report.rows.3.type', 'Remittance')
            ->where('report.rows.3.running_balance', 525)
            ->where('report.summary.2.value', 525));
});
