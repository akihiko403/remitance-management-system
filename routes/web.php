<?php

use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DeductionController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\EventTellerAssignmentController;
use App\Http\Controllers\PersonController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\RemittanceController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route(auth()->check() ? 'dashboard' : 'login'));

Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/people', [PersonController::class, 'index'])->name('people.index');
    Route::post('/people', [PersonController::class, 'store'])->name('people.store');
    Route::patch('/people/{person}', [PersonController::class, 'update'])->name('people.update');
    Route::delete('/people/{person}', [PersonController::class, 'destroy'])->name('people.destroy');

    Route::get('/events', [EventController::class, 'index'])->name('events.index');
    Route::post('/events', [EventController::class, 'store'])->name('events.store');
    Route::get('/events/{event}', [EventController::class, 'show'])->name('events.show');
    Route::patch('/events/{event}', [EventController::class, 'update'])->name('events.update');
    Route::delete('/events/{event}', [EventController::class, 'destroy'])->name('events.destroy');
    Route::get('/events/{event}/attendance', [EventTellerAssignmentController::class, 'index'])->name('events.attendance.index');
    Route::put('/events/{event}/attendance', [EventTellerAssignmentController::class, 'update'])->name('events.attendance.update');

    Route::get('/remittances', [RemittanceController::class, 'index'])->name('remittances.index');
    Route::post('/remittances/assignments/{assignment}', [RemittanceController::class, 'upsertForAssignment'])->name('remittances.assignments.upsert');
    Route::post('/remittances', [RemittanceController::class, 'store'])->name('remittances.store');
    Route::patch('/remittances/{remittance}', [RemittanceController::class, 'update'])->name('remittances.update');
    Route::delete('/remittances/{remittance}', [RemittanceController::class, 'destroy'])->name('remittances.destroy');

    Route::get('/deductions', [DeductionController::class, 'index'])->name('deductions.index');
    Route::post('/deductions', [DeductionController::class, 'store'])->name('deductions.store');
    Route::patch('/deductions/{deduction}', [DeductionController::class, 'update'])->name('deductions.update');
    Route::delete('/deductions/{deduction}', [DeductionController::class, 'destroy'])->name('deductions.destroy');

    Route::prefix('/reports')->name('reports.')->group(function () {
        Route::get('/event-shortages', [ReportController::class, 'eventShortages'])->name('event-shortages');
        Route::get('/outstanding-balances', [ReportController::class, 'outstandingBalances'])->name('outstanding-balances');
        Route::get('/zero-balances', [ReportController::class, 'zeroBalances'])->name('zero-balances');
        Route::get('/person-ledger', [ReportController::class, 'personLedger'])->name('person-ledger');
        Route::get('/deduction-history', [ReportController::class, 'deductionHistory'])->name('deduction-history');
        Route::get('/{report}/export/{format}', [ReportController::class, 'export'])->name('export');
    });

    Route::get('/audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

    Route::get('/settings', [SettingController::class, 'index'])->name('settings.index');
    Route::patch('/settings', [SettingController::class, 'update'])->name('settings.update');
    Route::patch('/settings/users/{user}/role', [SettingController::class, 'updateUserRole'])->name('settings.users.update-role');
});

require __DIR__.'/auth.php';
