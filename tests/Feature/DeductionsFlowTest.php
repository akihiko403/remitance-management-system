<?php

use App\Models\Deduction;
use App\Models\Event;
use App\Models\Person;
use App\Models\Shortage;
use App\Models\User;
use App\Support\Permissions;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function deductionAuthorizedUser(string ...$permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    return $user;
}

function deductionEvent(array $attributes = []): Event
{
    static $sequence = 1;

    $event = Event::query()->create([
        'code' => $attributes['code'] ?? sprintf('DED-EV-%04d', $sequence),
        'name' => $attributes['name'] ?? 'Deduction Event '.$sequence,
        'event_date' => $attributes['event_date'] ?? now()->addDays($sequence)->toDateString(),
        'venue' => $attributes['venue'] ?? 'Settlement Venue',
        'status' => $attributes['status'] ?? 'inactive',
        'description' => $attributes['description'] ?? 'Deduction testing event',
        'currency' => 'PHP',
    ]);

    $sequence++;

    return $event;
}

function deductionPerson(array $attributes = []): Person
{
    static $sequence = 1;

    $person = Person::query()->create([
        'code' => $attributes['code'] ?? sprintf('DED-P-%04d', $sequence),
        'first_name' => $attributes['first_name'] ?? 'Deduction',
        'last_name' => $attributes['last_name'] ?? 'Person '.$sequence,
        'phone' => $attributes['phone'] ?? '+63 917 555 00'.$sequence,
        'email' => $attributes['email'] ?? 'deduction'.$sequence.'@example.com',
        'is_active' => $attributes['is_active'] ?? true,
    ]);

    $sequence++;

    return $person;
}

function deductionShortage(Event $event, Person $person, float $amount, array $attributes = []): Shortage
{
    return Shortage::query()->create([
        'event_id' => $event->id,
        'person_id' => $person->id,
        'transaction_date' => $attributes['transaction_date'] ?? $event->event_date,
        'amount' => $amount,
        'reason' => $attributes['reason'] ?? 'Auto shortage',
        'notes' => $attributes['notes'] ?? 'Test shortage',
    ]);
}

test('deductions page lists consolidated balances per person', function () {
    $user = deductionAuthorizedUser(Permissions::MANAGE_DEDUCTIONS);

    $person = deductionPerson(['first_name' => 'Kyle', 'last_name' => 'Biwab']);
    $secondPerson = deductionPerson(['first_name' => 'Jane', 'last_name' => 'Doe']);

    $firstEvent = deductionEvent(['name' => 'Mindanao Breeders Cup']);
    $secondEvent = deductionEvent(['name' => 'Luzon Breeders Cup']);

    $firstShortage = deductionShortage($firstEvent, $person, 1000, ['transaction_date' => now()->subDays(2)->toDateString()]);
    $secondShortage = deductionShortage($secondEvent, $person, 500, ['transaction_date' => now()->subDay()->toDateString()]);
    deductionShortage($secondEvent, $secondPerson, 300);

    Deduction::query()->create([
        'shortage_id' => $firstShortage->id,
        'event_id' => $firstEvent->id,
        'person_id' => $person->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 250,
        'method' => 'Salary Deduction',
    ]);

    Deduction::query()->create([
        'shortage_id' => $secondShortage->id,
        'event_id' => $secondEvent->id,
        'person_id' => $person->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 100,
        'method' => 'Cash Payment',
    ]);

    $this->actingAs($user)
        ->get(route('deductions.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->has('personBalances', 2)
            ->where('personBalances.0.person_name', $secondPerson->full_name)
            ->where('personBalances.0.remaining_balance', 300)
            ->where('personBalances.1.person_name', $person->full_name)
            ->where('personBalances.1.total_shortage', 1500)
            ->where('personBalances.1.total_paid', 350)
            ->where('personBalances.1.remaining_balance', 1150)
            ->where('personBalances.1.status', 'partial'));
});

test('creating a person payment distributes the amount across open shortages', function () {
    $user = deductionAuthorizedUser(Permissions::MANAGE_DEDUCTIONS);

    $person = deductionPerson(['first_name' => 'Partial', 'last_name' => 'Payment']);
    $firstEvent = deductionEvent(['event_date' => now()->subDays(2)->toDateString()]);
    $secondEvent = deductionEvent(['event_date' => now()->subDay()->toDateString()]);

    $olderShortage = deductionShortage($firstEvent, $person, 100, ['transaction_date' => now()->subDays(2)->toDateString()]);
    $newerShortage = deductionShortage($secondEvent, $person, 80, ['transaction_date' => now()->subDay()->toDateString()]);

    $this->actingAs($user)->post(route('deductions.store'), [
        'person_id' => $person->id,
        'transaction_date' => now()->toDateString(),
        'amount' => 150,
        'method' => 'Installment',
        'notes' => 'Partial settlement',
    ])->assertRedirect();

    expect(Deduction::query()->count())->toBe(2);

    $olderDeduction = Deduction::query()->where('shortage_id', $olderShortage->id)->first();
    $newerDeduction = Deduction::query()->where('shortage_id', $newerShortage->id)->first();

    expect((float) $olderDeduction->amount)->toBe(100.0);
    expect((float) $newerDeduction->amount)->toBe(50.0);
    expect($olderDeduction->reference_number)->toStartWith('PAY-');
    expect($newerDeduction->reference_number)->toStartWith('PAY-');

    $olderShortage->loadSum('deductions', 'amount');
    $newerShortage->loadSum('deductions', 'amount');

    expect((float) $olderShortage->remaining_balance)->toBe(0.0);
    expect((float) $newerShortage->remaining_balance)->toBe(30.0);
});
