<?php

namespace App\Http\Controllers;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    /**
     * @throws AuthorizationException
     */
    protected function ensurePermission(string $permission): void
    {
        $user = Auth::user();

        if (! $user || ! $user->can($permission)) {
            throw new AuthorizationException("This action requires the [{$permission}] permission.");
        }
    }
}
