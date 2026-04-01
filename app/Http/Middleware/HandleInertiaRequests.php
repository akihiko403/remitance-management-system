<?php

namespace App\Http\Middleware;

use App\Models\Event;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $settings = Setting::appSettings([
            'organization_name' => 'Fightline Operations',
            'system_name' => 'Remittance Platform',
        ]);
        $activeEvent = Event::activeSummary();
        $success = $request->session()->get('success');
        $error = $request->session()->get('error');
        $sessionToasts = $request->session()->get('toasts', []);

        if ($user) {
            $user->loadMissing('roles', 'permissions', 'roles.permissions');
        }

        $normalizedToasts = collect($sessionToasts)
            ->filter(fn ($toast) => is_array($toast) && filled($toast['message'] ?? null))
            ->map(fn (array $toast) => [
                'id' => $toast['id'] ?? Str::uuid()->toString(),
                'type' => $toast['type'] ?? 'info',
                'title' => $toast['title'] ?? null,
                'message' => $toast['message'],
                'duration' => $toast['duration'] ?? null,
            ])
            ->values()
            ->all();

        return [
            ...parent::share($request),
            'app' => [
                'name' => config('app.name'),
                'brandName' => 'Fightline',
                'organization' => $settings['organization_name'],
                'systemName' => $settings['system_name'],
                'tagline' => 'Precision Betting. Trusted Results.',
                'primaryLogoUrl' => asset('fightline/logo-with-text.svg'),
                'wordmarkWhiteUrl' => asset('fightline/logo-with-text-white.svg'),
                'cleanWordmarkWhiteUrl' => asset('fightline/logo-without-tagline-white.svg'),
                'compactLogoUrl' => asset('fightline/logo-only-white.svg'),
                'compactLogoColorUrl' => asset('fightline/logo-only.svg'),
                'appIconUrl' => asset('fightline/icon-192x192.png'),
                'appIconLargeUrl' => asset('fightline/icon-512x512.png'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'role_names' => $user->role_names,
                    'permissions' => $user->getAllPermissions()->pluck('name')->values(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $success,
                'error' => fn () => $error,
                'toasts' => fn () => [
                    ...$normalizedToasts,
                    ...($success ? [[
                        'id' => 'flash-success-'.md5($success),
                        'type' => 'success',
                        'title' => 'Success',
                        'message' => $success,
                    ]] : []),
                    ...($error ? [[
                        'id' => 'flash-error-'.md5($error),
                        'type' => 'error',
                        'title' => 'Action Required',
                        'message' => $error,
                        'duration' => 6500,
                    ]] : []),
                ],
            ],
            'activeEvent' => $activeEvent,
        ];
    }
}
