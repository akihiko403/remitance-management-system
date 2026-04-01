<?php

use App\Models\User;
use App\Support\Permissions;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;

function toastAuthorizedUser(string ...$permissions): User
{
    $user = User::factory()->create();

    foreach ($permissions as $permission) {
        Permission::findOrCreate($permission, 'web');
    }

    $user->givePermissionTo($permissions);

    return $user;
}

test('success flash messages are exposed as normalized toast payloads', function () {
    $user = toastAuthorizedUser(Permissions::MANAGE_EVENTS);

    $this->actingAs($user)
        ->withSession(['success' => 'Event created.'])
        ->get(route('events.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.success', 'Event created.')
            ->has('flash.toasts', 1)
            ->where('flash.toasts.0.type', 'success')
            ->where('flash.toasts.0.title', 'Success')
            ->where('flash.toasts.0.message', 'Event created.'));
});

test('error flash messages are exposed as normalized toast payloads', function () {
    $user = toastAuthorizedUser(Permissions::MANAGE_REMITTANCES);

    $this->actingAs($user)
        ->withSession(['error' => 'No active event is available for remittance encoding.'])
        ->get(route('remittances.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('flash.error', 'No active event is available for remittance encoding.')
            ->has('flash.toasts', 1)
            ->where('flash.toasts.0.type', 'error')
            ->where('flash.toasts.0.title', 'Action Required')
            ->where('flash.toasts.0.message', 'No active event is available for remittance encoding.'));
});
