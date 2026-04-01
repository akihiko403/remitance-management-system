<?php

use App\Models\Deduction;
use App\Models\Event;
use App\Models\EventTellerAssignment;
use App\Models\Person;
use App\Models\Remittance;
use App\Models\Shortage;
use App\Models\User;
use App\Support\Permissions;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function authorizedUser(string ...$permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function makeEvent(array $attributes = []): Event
{
    static $sequence = 1;

    $event = Event::query()->create([
        'code' => $attributes['code'] ?? sprintf('EV-%04d', $sequence),
        'name' => $attributes['name'] ?? 'Event '.$sequence,
        'event_date' => $attributes['event_date'] ?? now()->addDays($sequence)->toDateString(),
        'venue' => $attributes['venue'] ?? 'Test Venue',
        'status' => $attributes['status'] ?? 'inactive',
        'description' => $attributes['description'] ?? 'Test remarks',
        'currency' => 'PHP',
    ]);

    $sequence++;

    return $event;
}

function makePerson(array $attributes = []): Person
{
    static $sequence = 1;

    $person = Person::query()->create([
        'code' => $attributes['code'] ?? sprintf('P-%04d', $sequence),
        'first_name' => $attributes['first_name'] ?? 'Person',
        'last_name' => $attributes['last_name'] ?? (string) $sequence,
        'phone' => $attributes['phone'] ?? '+63 917 000 00'.$sequence,
        'email' => $attributes['email'] ?? 'person'.$sequence.'@example.com',
        'is_active' => $attributes['is_active'] ?? true,
    ]);

    $sequence++;

    return $person;
}

function makeAssignment(Event $event, Person $person, string $label = 'TELLER', int $number = 1): EventTellerAssignment
{
    return EventTellerAssignment::query()->create([
        'event_id' => $event->id,
        'person_id' => $person->id,
        'teller_label' => $label,
        'teller_number' => $number,
        'full_teller_display' => sprintf('%s %d', $label, $number),
        'team' => 'Finance Ops',
        'is_lead' => false,
    ]);
}

test('setting an event active automatically inactivates the others', function () {
    $user = authorizedUser(Permissions::MANAGE_EVENTS);

    $first = makeEvent(['status' => 'active']);
    $second = makeEvent(['status' => 'inactive']);

    $this->actingAs($user)->patch(route('events.update', $second), [
        'code' => $second->code,
        'name' => $second->name,
        'event_date' => $second->event_date->format('Y-m-d'),
        'venue' => $second->venue,
        'status' => 'active',
        'description' => 'Updated event',
    ])->assertRedirect();

    expect($first->fresh()->status)->toBe('inactive');
    expect($second->fresh()->status)->toBe('active');
});

test('attendance update rejects duplicate teller designations in the same event', function () {
    $user = authorizedUser(Permissions::MANAGE_ASSIGNMENTS);

    $event = makeEvent();
    $firstPerson = makePerson();
    $secondPerson = makePerson();

    $this->actingAs($user)->put(route('events.attendance.update', $event), [
        'attendees' => [
            [
                'person_id' => $firstPerson->id,
                'present' => true,
                'teller_label' => 'TELLER',
                'teller_number' => 1,
            ],
            [
                'person_id' => $secondPerson->id,
                'present' => true,
                'teller_label' => 'TELLER',
                'teller_number' => 1,
            ],
        ],
    ])->assertSessionHasErrors(['attendees.1.full_teller_display']);
});

test('attendance update rejects duplicate people in the same event payload', function () {
    $user = authorizedUser(Permissions::MANAGE_ASSIGNMENTS);

    $event = makeEvent();
    $person = makePerson();

    $this->actingAs($user)->put(route('events.attendance.update', $event), [
        'attendees' => [
            [
                'person_id' => $person->id,
                'present' => true,
                'teller_label' => 'TELLER',
                'teller_number' => 1,
            ],
            [
                'person_id' => $person->id,
                'present' => true,
                'teller_label' => 'VIP',
                'teller_number' => 1,
            ],
        ],
    ])->assertSessionHasErrors(['attendees.1.person_id']);
});

test('remittance page only shows assigned people from the current active event', function () {
    $user = authorizedUser(Permissions::MANAGE_REMITTANCES);

    $activeEvent = makeEvent(['status' => 'active', 'name' => 'Active Event']);
    $inactiveEvent = makeEvent(['status' => 'inactive', 'name' => 'Inactive Event']);

    $activePerson = makePerson(['first_name' => 'Active', 'last_name' => 'Person']);
    $inactivePerson = makePerson(['first_name' => 'Inactive', 'last_name' => 'Person']);
    makePerson(['first_name' => 'Unassigned', 'last_name' => 'Person']);

    makeAssignment($activeEvent, $activePerson, 'TELLER', 1);
    makeAssignment($inactiveEvent, $inactivePerson, 'TELLER', 2);

    $this->actingAs($user)
        ->get(route('remittances.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeEvent.id', $activeEvent->id)
            ->has('rows', 1)
            ->where('rows.0.name', $activePerson->full_name)
            ->where('rows.0.event_name', 'Active Event'));
});

test('encoding remittance creates a linked shortage ledger entry when the short amount is positive', function () {
    $user = authorizedUser(Permissions::MANAGE_REMITTANCES);

    $event = makeEvent(['status' => 'active']);
    $person = makePerson();
    $assignment = makeAssignment($event, $person, 'TELLER', 5);

    $this->actingAs($user)->post(route('remittances.assignments.upsert', $assignment), [
        'remittance_amount' => 100,
        'cash_on_hand' => 80,
        'remarks' => 'Positive shortage',
    ])->assertRedirect();

    $remittance = Remittance::query()->first();
    $shortage = Shortage::query()->first();

    expect($remittance)->not->toBeNull();
    expect((float) $remittance->amount)->toBe(100.0);
    expect((float) $remittance->cash_on_hand)->toBe(80.0);
    expect((float) $remittance->short_amount)->toBe(20.0);

    expect($shortage)->not->toBeNull();
    expect($shortage->remittance_id)->toBe($remittance->id);
    expect((float) $shortage->amount)->toBe(20.0);
    expect($shortage->reason)->toBe('Auto-computed from remittance encoding');
});

test('encoding remittance updates the same record and removes shortage when the short amount becomes zero', function () {
    $user = authorizedUser(Permissions::MANAGE_REMITTANCES);

    $event = makeEvent(['status' => 'active']);
    $person = makePerson();
    $assignment = makeAssignment($event, $person);

    $this->actingAs($user)->post(route('remittances.assignments.upsert', $assignment), [
        'remittance_amount' => 200,
        'cash_on_hand' => 150,
        'remarks' => 'Initial encode',
    ])->assertRedirect();

    $this->actingAs($user)->post(route('remittances.assignments.upsert', $assignment), [
        'remittance_amount' => 220,
        'cash_on_hand' => 220,
        'remarks' => 'Balanced update',
    ])->assertRedirect();

    expect(Remittance::query()->count())->toBe(1);
    expect((float) Remittance::query()->first()->amount)->toBe(220.0);
    expect((float) Remittance::query()->first()->short_amount)->toBe(0.0);
    expect(Shortage::query()->count())->toBe(0);
});

test('linked shortage is kept at zero when deductions already exist', function () {
    $user = authorizedUser(Permissions::MANAGE_REMITTANCES);

    $event = makeEvent(['status' => 'active']);
    $person = makePerson();
    $assignment = makeAssignment($event, $person);

    $this->actingAs($user)->post(route('remittances.assignments.upsert', $assignment), [
        'remittance_amount' => 300,
        'cash_on_hand' => 250,
        'remarks' => 'Needs shortage',
    ])->assertRedirect();

    $shortage = Shortage::query()->firstOrFail();

    Deduction::query()->create([
        'shortage_id' => $shortage->id,
        'event_id' => $event->id,
        'person_id' => $person->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 10,
        'method' => 'Cash Payment',
        'reference_number' => 'DED-0001',
    ]);

    $this->actingAs($user)->post(route('remittances.assignments.upsert', $assignment), [
        'remittance_amount' => 300,
        'cash_on_hand' => 300,
        'remarks' => 'Balanced after deduction',
    ])->assertRedirect();

    expect(Shortage::query()->count())->toBe(1);
    expect((float) Shortage::query()->first()->amount)->toBe(0.0);
});

test('remittance page shows an empty-state payload when there is no active event', function () {
    $user = authorizedUser(Permissions::MANAGE_REMITTANCES);

    makeEvent(['status' => 'inactive']);

    $this->actingAs($user)
        ->get(route('remittances.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('activeEvent', null)
            ->where('stats.assigned_count', 0)
            ->where('stats.encoded_count', 0)
            ->where('rows', []));
});
