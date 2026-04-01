<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Spatie\Activitylog\Models\Activity;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $request->user()?->forceFill([
            'last_login_at' => now(),
        ])->save();

        Activity::query()->create([
            'log_name' => 'auth',
            'description' => 'logged in',
            'subject_type' => get_class($request->user()),
            'subject_id' => $request->user()?->getKey(),
            'causer_type' => get_class($request->user()),
            'causer_id' => $request->user()?->getKey(),
            'properties' => [
                'ip_address' => $request->ip(),
            ],
        ]);

        return redirect()->intended(route('dashboard', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = $request->user();

        if ($user) {
            Activity::query()->create([
                'log_name' => 'auth',
                'description' => 'logged out',
                'subject_type' => get_class($user),
                'subject_id' => $user->getKey(),
                'causer_type' => get_class($user),
                'causer_id' => $user->getKey(),
                'properties' => [
                    'ip_address' => $request->ip(),
                ],
            ]);
        }

        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
