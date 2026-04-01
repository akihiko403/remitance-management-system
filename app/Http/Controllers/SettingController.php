<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateSettingRequest;
use App\Models\Setting;
use App\Models\User;
use App\Support\Permissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function index(): Response
    {
        $this->ensurePermission(Permissions::MANAGE_SETTINGS);

        $settings = Setting::appSettings([
            'organization_name' => 'Fightline Operations',
            'system_name' => 'Remittance Platform',
            'support_email' => null,
            'support_phone' => null,
            'finance_note' => null,
        ]);

        return Inertia::render('Settings/Index', [
            'settings' => [
                ...$settings,
                'primary_logo_path' => asset('fightline/logo-with-text.svg'),
                'dark_wordmark_path' => asset('fightline/logo-with-text-white.svg'),
                'clean_wordmark_path' => asset('fightline/logo-without-tagline-white.svg'),
                'compact_logo_path' => asset('fightline/logo-only-white.svg'),
                'icon_path' => asset('fightline/icon-512x512.png'),
            ],
            'users' => User::query()
                ->with('roles')
                ->orderBy('name')
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'roles' => $user->role_names,
                    'is_active' => $user->is_active,
                    'last_login_at' => $user->last_login_at?->diffForHumans(),
                ]),
            'roles' => collect(array_keys(Permissions::roleMatrix()))->values(),
            'roleMatrix' => Permissions::roleMatrix(),
        ]);
    }

    public function update(UpdateSettingRequest $request): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_SETTINGS);

        foreach ($request->validated() as $key => $value) {
            Setting::setValue($key, $value);
        }

        return back()->with('success', 'System settings updated.');
    }

    public function updateUserRole(Request $request, User $user): RedirectResponse
    {
        $this->ensurePermission(Permissions::MANAGE_USERS);

        $validated = $request->validate([
            'role' => ['required', 'in:'.implode(',', array_keys(Permissions::roleMatrix()))],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $user->syncRoles([$validated['role']]);
        $user->update([
            'is_active' => (bool) ($validated['is_active'] ?? true),
        ]);

        return back()->with('success', 'User access updated.');
    }
}
