<?php

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Event;
use App\Models\Person;
use App\Models\Remittance;
use App\Models\Shortage;
use App\Support\BalanceQueries;
use App\Support\Permissions;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $this->ensurePermission(Permissions::VIEW_DASHBOARD);

        $eventCount = Event::query()->count();
        $peopleCount = Person::query()->count();
        $activeEvents = Event::query()->where('status', 'active')->count();
        $remittanceTotal = (float) Remittance::query()->sum('amount');
        $shortageTotal = (float) Shortage::query()->sum('amount');
        $deductionTotal = (float) Deduction::query()->sum('amount');
        $openExposure = round(
            (float) DB::query()
                ->fromSub(BalanceQueries::personBalances(), 'person_balances')
                ->sum('remaining_balance'),
            2
        );

        $events = Event::query()
            ->withCount('assignments')
            ->withSum('remittances as remittance_total', 'amount')
            ->withSum('shortages as shortage_total', 'amount')
            ->withSum('deductions as deduction_total', 'amount')
            ->latest('event_date')
            ->limit(6)
            ->get()
            ->sortBy('event_date')
            ->values();

        $topBalances = DB::query()
            ->fromSub(BalanceQueries::personBalances(), 'person_balances')
            ->where('remaining_balance', '>', 0)
            ->orderByDesc('remaining_balance')
            ->limit(6)
            ->get()
            ->map(fn (object $row) => [
                'id' => $row->person_id,
                'code' => $row->person_code,
                'name' => BalanceQueries::personFullName($row),
                'balance' => round((float) $row->remaining_balance, 2),
            ])
            ->values();

        $recentActivities = Activity::query()
            ->with('causer')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Activity $activity) => [
                'id' => $activity->id,
                'log_name' => $activity->log_name,
                'description' => $activity->description,
                'causer' => $activity->causer?->name ?? 'System',
                'created_at' => $activity->created_at?->toDayDateTimeString(),
            ]);

        return Inertia::render('Dashboard', [
            'stats' => [
                [
                    'label' => 'Masterlist',
                    'value' => $peopleCount,
                    'meta' => 'Total encoded people',
                ],
                [
                    'label' => 'Active Events',
                    'value' => $activeEvents,
                    'meta' => 'Only one can be active at a time',
                ],
                [
                    'label' => 'Total Remittance',
                    'value' => $remittanceTotal,
                    'meta' => 'Captured across all events',
                ],
                [
                    'label' => 'Outstanding Balance',
                    'value' => round($shortageTotal - $deductionTotal, 2),
                    'meta' => 'Running person-level remaining balance',
                ],
            ],
            'chartSeries' => $events->map(fn (Event $event) => [
                'label' => $event->name,
                'event_date' => $event->event_date?->format('M d, Y'),
                'remittance' => (float) ($event->remittance_total ?? 0),
                'shortage' => (float) ($event->shortage_total ?? 0),
                'deduction' => (float) ($event->deduction_total ?? 0),
                'balance' => round((float) ($event->shortage_total ?? 0) - (float) ($event->deduction_total ?? 0), 2),
            ]),
            'eventSummaries' => $events->map(fn (Event $event) => [
                'id' => $event->id,
                'name' => $event->name,
                'code' => $event->code,
                'status' => $event->status,
                'event_date' => $event->event_date?->format('M d, Y'),
                'assignments' => $event->assignments_count,
                'remittance_total' => (float) ($event->remittance_total ?? 0),
                'shortage_total' => (float) ($event->shortage_total ?? 0),
                'deduction_total' => (float) ($event->deduction_total ?? 0),
                'balance' => round((float) ($event->shortage_total ?? 0) - (float) ($event->deduction_total ?? 0), 2),
            ]),
            'topBalances' => $topBalances,
            'recentActivities' => $recentActivities,
            'executiveSummary' => [
                'shortageCollectionRate' => $shortageTotal > 0 ? round(($deductionTotal / $shortageTotal) * 100, 1) : 0,
                'averageRemittancePerEvent' => $eventCount > 0 ? round($remittanceTotal / $eventCount, 2) : 0,
                'openExposure' => $openExposure,
            ],
        ]);
    }
}
