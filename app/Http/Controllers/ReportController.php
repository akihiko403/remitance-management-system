<?php

namespace App\Http\Controllers;

use App\Models\Deduction;
use App\Models\Event;
use App\Models\Person;
use App\Models\Remittance;
use App\Models\Shortage;
use App\Support\BalanceQueries;
use App\Support\Permissions;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class ReportController extends Controller
{
    public function eventShortages(Request $request): Response
    {
        return $this->renderReport('event-shortages', $request);
    }

    public function outstandingBalances(Request $request): Response
    {
        return $this->renderReport('outstanding-balances', $request);
    }

    public function zeroBalances(Request $request): Response
    {
        return $this->renderReport('zero-balances', $request);
    }

    public function personLedger(Request $request): Response
    {
        return $this->renderReport('person-ledger', $request);
    }

    public function deductionHistory(Request $request): Response
    {
        return $this->renderReport('deduction-history', $request);
    }

    public function export(Request $request, string $report, string $format): SymfonyResponse
    {
        $payload = $this->buildReport($report, $request);

        abort_unless(in_array($format, ['pdf', 'xls'], true), 404);

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.export', $payload)->setPaper('a4', 'landscape');

            return $pdf->download(str($report)->slug().'-report.pdf');
        }

        $html = view('reports.export', $payload)->render();

        return response($html)
            ->header('Content-Type', 'application/vnd.ms-excel; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="'.str($report)->slug().'-report.xls"');
    }

    private function renderReport(string $report, Request $request): Response
    {
        $this->ensurePermission(Permissions::VIEW_REPORTS);

        $payload = $this->buildReport($report, $request);

        return Inertia::render('Reports/Index', [
            'report' => $payload,
            'reportSlug' => $report,
            'availableReports' => $this->availableReports(),
            'events' => Event::query()->latest('event_date')->get(['id', 'name', 'code']),
            'people' => Person::query()->orderBy('last_name')->orderBy('first_name')->get(['id', 'code', 'first_name', 'middle_name', 'last_name', 'suffix'])->map(fn (Person $person) => [
                'id' => $person->id,
                'name' => $person->full_name,
                'code' => $person->code,
            ]),
            'exportUrls' => [
                'pdf' => route('reports.export', ['report' => $report, 'format' => 'pdf', ...$request->query()]),
                'xls' => route('reports.export', ['report' => $report, 'format' => 'xls', ...$request->query()]),
            ],
        ]);
    }

    private function buildReport(string $report, Request $request): array
    {
        $filters = [
            'search' => $request->string('search')->value(),
            'event_id' => $request->input('event_id'),
            'person_id' => $request->input('person_id'),
            'date_from' => $request->input('date_from'),
            'date_to' => $request->input('date_to'),
        ];

        return match ($report) {
            'event-shortages' => $this->buildEventShortageReport($filters),
            'outstanding-balances' => $this->buildOutstandingBalanceReport($filters),
            'zero-balances' => $this->buildZeroBalanceReport($filters),
            'person-ledger' => $this->buildPersonLedgerReport($filters),
            'deduction-history' => $this->buildDeductionHistoryReport($filters),
            default => abort(404),
        };
    }

    private function buildEventShortageReport(array $filters): array
    {
        $rows = Event::query()
            ->withSum('shortages as shortage_total', 'amount')
            ->withSum('deductions as deduction_total', 'amount')
            ->when(filled($filters['search']), function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(fn ($subQuery) => $subQuery
                    ->where('code', 'like', $search)
                    ->orWhere('name', 'like', $search)
                    ->orWhere('venue', 'like', $search));
            })
            ->when(filled($filters['event_id']), fn ($query) => $query->whereKey($filters['event_id']))
            ->when(filled($filters['date_from']), fn ($query) => $query->whereDate('event_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to']), fn ($query) => $query->whereDate('event_date', '<=', $filters['date_to']))
            ->orderByDesc('event_date')
            ->get()
            ->map(fn (Event $event) => [
                'event_code' => $event->code,
                'event_name' => $event->name,
                'event_date' => $event->event_date?->format('M d, Y'),
                'status' => $event->status,
                'shortage_total' => round((float) ($event->shortage_total ?? 0), 2),
                'deduction_total' => round((float) ($event->deduction_total ?? 0), 2),
                'balance' => round((float) ($event->shortage_total ?? 0) - (float) ($event->deduction_total ?? 0), 2),
            ]);

        return [
            'title' => 'Event Shortage Report',
            'subtitle' => 'Event-level shortage exposure, collections, and remaining balances.',
            'filters' => $filters,
            'columns' => [
                ['key' => 'event_code', 'label' => 'Event Code'],
                ['key' => 'event_name', 'label' => 'Event'],
                ['key' => 'event_date', 'label' => 'Date'],
                ['key' => 'status', 'label' => 'Status'],
                ['key' => 'shortage_total', 'label' => 'Shortage'],
                ['key' => 'deduction_total', 'label' => 'Collected'],
                ['key' => 'balance', 'label' => 'Balance'],
            ],
            'rows' => $rows,
            'summary' => [
                ['label' => 'Events', 'value' => $rows->count()],
                ['label' => 'Shortage', 'value' => round($rows->sum('shortage_total'), 2)],
                ['label' => 'Collected', 'value' => round($rows->sum('deduction_total'), 2)],
                ['label' => 'Balance', 'value' => round($rows->sum('balance'), 2)],
            ],
        ];
    }

    private function buildOutstandingBalanceReport(array $filters): array
    {
        $rows = DB::query()
            ->fromSub(BalanceQueries::personBalances(), 'person_balances')
            ->when(filled($filters['search']), function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(fn ($subQuery) => $subQuery
                    ->where('person_code', 'like', $search)
                    ->orWhere('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search));
            })
            ->when(filled($filters['person_id']), fn ($query) => $query->where('person_id', $filters['person_id']))
            ->where('remaining_balance', '>', 0)
            ->orderByDesc('remaining_balance')
            ->get()
            ->map(fn (object $row) => [
                'person_code' => $row->person_code,
                'person_name' => BalanceQueries::personFullName($row),
                'shortage_total' => round((float) $row->total_shortage, 2),
                'deduction_total' => round((float) $row->total_paid, 2),
                'balance' => round((float) $row->remaining_balance, 2),
                'events_with_shortage' => (int) $row->shortage_count,
            ])
            ->values();

        return [
            'title' => 'Outstanding Balance Report',
            'subtitle' => 'People with remaining shortage balances across all events.',
            'filters' => $filters,
            'columns' => [
                ['key' => 'person_code', 'label' => 'Person Code'],
                ['key' => 'person_name', 'label' => 'Name'],
                ['key' => 'events_with_shortage', 'label' => 'Shortage Entries'],
                ['key' => 'shortage_total', 'label' => 'Shortage'],
                ['key' => 'deduction_total', 'label' => 'Collected'],
                ['key' => 'balance', 'label' => 'Balance'],
            ],
            'rows' => $rows,
            'summary' => [
                ['label' => 'People', 'value' => $rows->count()],
                ['label' => 'Shortage', 'value' => round($rows->sum('shortage_total'), 2)],
                ['label' => 'Collected', 'value' => round($rows->sum('deduction_total'), 2)],
                ['label' => 'Balance', 'value' => round($rows->sum('balance'), 2)],
            ],
        ];
    }

    private function buildZeroBalanceReport(array $filters): array
    {
        $rows = DB::query()
            ->fromSub(BalanceQueries::personBalances(), 'person_balances')
            ->when(filled($filters['search']), function ($query) use ($filters) {
                $search = '%'.$filters['search'].'%';
                $query->where(fn ($subQuery) => $subQuery
                    ->where('person_code', 'like', $search)
                    ->orWhere('first_name', 'like', $search)
                    ->orWhere('last_name', 'like', $search));
            })
            ->when(filled($filters['person_id']), fn ($query) => $query->where('person_id', $filters['person_id']))
            ->where('total_shortage', '>', 0)
            ->where('remaining_balance', '<=', 0)
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get()
            ->map(fn (object $row) => [
                'person_code' => $row->person_code,
                'person_name' => BalanceQueries::personFullName($row),
                'shortage_total' => round((float) $row->total_shortage, 2),
                'deduction_total' => round((float) $row->total_paid, 2),
                'balance' => round((float) $row->remaining_balance, 2),
                'events_with_shortage' => (int) $row->shortage_count,
            ])
            ->values();

        return [
            'title' => 'Zero Balance Report',
            'subtitle' => 'People whose shortage obligations have been fully settled.',
            'filters' => $filters,
            'columns' => [
                ['key' => 'person_code', 'label' => 'Person Code'],
                ['key' => 'person_name', 'label' => 'Name'],
                ['key' => 'events_with_shortage', 'label' => 'Shortage Entries'],
                ['key' => 'shortage_total', 'label' => 'Shortage'],
                ['key' => 'deduction_total', 'label' => 'Collected'],
                ['key' => 'balance', 'label' => 'Balance'],
            ],
            'rows' => $rows,
            'summary' => [
                ['label' => 'People', 'value' => $rows->count()],
                ['label' => 'Settled Value', 'value' => round($rows->sum('deduction_total'), 2)],
            ],
        ];
    }

    private function buildPersonLedgerReport(array $filters): array
    {
        $personId = $filters['person_id'];
        $person = $personId ? Person::query()->find($personId) : null;
        $shortages = DB::table('shortages')
            ->join('people', 'people.id', '=', 'shortages.person_id')
            ->join('events', 'events.id', '=', 'shortages.event_id')
            ->when($personId, fn ($query) => $query->where('shortages.person_id', $personId))
            ->when(filled($filters['date_from']), fn ($query) => $query->whereDate('shortages.transaction_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to']), fn ($query) => $query->whereDate('shortages.transaction_date', '<=', $filters['date_to']))
            ->selectRaw("
                shortages.transaction_date as date,
                people.first_name,
                people.middle_name,
                people.last_name,
                people.suffix,
                events.name as event_name,
                'Shortage' as type,
                shortages.reason as reference,
                shortages.amount as amount,
                shortages.amount as impact
            ");

        $deductions = DB::table('deductions')
            ->join('people', 'people.id', '=', 'deductions.person_id')
            ->join('events', 'events.id', '=', 'deductions.event_id')
            ->when($personId, fn ($query) => $query->where('deductions.person_id', $personId))
            ->when(filled($filters['date_from']), fn ($query) => $query->whereDate('deductions.transaction_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to']), fn ($query) => $query->whereDate('deductions.transaction_date', '<=', $filters['date_to']))
            ->selectRaw("
                deductions.transaction_date as date,
                people.first_name,
                people.middle_name,
                people.last_name,
                people.suffix,
                events.name as event_name,
                'Deduction' as type,
                deductions.method as reference,
                deductions.amount as amount,
                -deductions.amount as impact
            ");

        $remittances = DB::table('remittances')
            ->join('people', 'people.id', '=', 'remittances.person_id')
            ->join('events', 'events.id', '=', 'remittances.event_id')
            ->when($personId, fn ($query) => $query->where('remittances.person_id', $personId))
            ->when(filled($filters['date_from']), fn ($query) => $query->whereDate('remittances.transaction_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to']), fn ($query) => $query->whereDate('remittances.transaction_date', '<=', $filters['date_to']))
            ->selectRaw("
                remittances.transaction_date as date,
                people.first_name,
                people.middle_name,
                people.last_name,
                people.suffix,
                events.name as event_name,
                'Remittance' as type,
                COALESCE(remittances.reference_number, remittances.payment_channel) as reference,
                remittances.amount as amount,
                0 as impact
            ");

        $transactions = DB::query()
            ->fromSub($shortages->unionAll($deductions)->unionAll($remittances), 'transactions')
            ->orderBy('date')
            ->orderBy('type')
            ->get()
            ->map(function (object $row): array {
                return [
                    'date' => $row->date,
                    'person_name' => BalanceQueries::personFullName($row),
                    'event_name' => $row->event_name,
                    'type' => $row->type,
                    'reference' => $row->reference,
                    'amount' => round((float) $row->amount, 2),
                    'impact' => round((float) $row->impact, 2),
                ];
            })
            ->values();

        $running = 0;

        $rows = $transactions->map(function (array $row) use (&$running, $personId) {
            $running += $row['impact'];

            return [
                'date' => $row['date'],
                'person_name' => $row['person_name'],
                'event_name' => $row['event_name'],
                'type' => $row['type'],
                'reference' => $row['reference'],
                'amount' => $row['amount'],
                'running_balance' => $personId ? round($running, 2) : null,
            ];
        });

        return [
            'title' => 'Person Ledger Report',
            'subtitle' => $person ? 'Chronological shortage and deduction ledger for '.$person->full_name.'.' : 'Filter by person to view running remaining balances.',
            'filters' => $filters,
            'columns' => [
                ['key' => 'date', 'label' => 'Date'],
                ['key' => 'person_name', 'label' => 'Person'],
                ['key' => 'event_name', 'label' => 'Event'],
                ['key' => 'type', 'label' => 'Type'],
                ['key' => 'reference', 'label' => 'Reference'],
                ['key' => 'amount', 'label' => 'Amount'],
                ['key' => 'running_balance', 'label' => 'Running Balance'],
            ],
            'rows' => $rows,
            'summary' => [
                ['label' => 'Transactions', 'value' => $rows->count()],
                ['label' => 'Selected Person', 'value' => $person?->full_name ?? 'All'],
                ['label' => 'Current Balance', 'value' => $personId ? round($running, 2) : 'Filter needed'],
            ],
        ];
    }

    private function buildDeductionHistoryReport(array $filters): array
    {
        $rows = Deduction::query()
            ->with(['event', 'person', 'shortage'])
            ->when(filled($filters['event_id']), fn ($query) => $query->where('event_id', $filters['event_id']))
            ->when(filled($filters['person_id']), fn ($query) => $query->where('person_id', $filters['person_id']))
            ->when(filled($filters['date_from']), fn ($query) => $query->whereDate('transaction_date', '>=', $filters['date_from']))
            ->when(filled($filters['date_to']), fn ($query) => $query->whereDate('transaction_date', '<=', $filters['date_to']))
            ->latest('transaction_date')
            ->get()
            ->map(fn (Deduction $deduction) => [
                'transaction_date' => $deduction->transaction_date?->format('M d, Y'),
                'person_name' => $deduction->person->full_name,
                'event_name' => $deduction->event->name,
                'shortage_reason' => $deduction->shortage->reason,
                'method' => $deduction->method,
                'reference_number' => $deduction->reference_number,
                'amount' => round((float) $deduction->amount, 2),
            ]);

        return [
            'title' => 'Deduction History Report',
            'subtitle' => 'Detailed deduction and payment history by person and event.',
            'filters' => $filters,
            'columns' => [
                ['key' => 'transaction_date', 'label' => 'Date'],
                ['key' => 'person_name', 'label' => 'Person'],
                ['key' => 'event_name', 'label' => 'Event'],
                ['key' => 'shortage_reason', 'label' => 'Shortage Reason'],
                ['key' => 'method', 'label' => 'Method'],
                ['key' => 'reference_number', 'label' => 'Reference'],
                ['key' => 'amount', 'label' => 'Amount'],
            ],
            'rows' => $rows,
            'summary' => [
                ['label' => 'Entries', 'value' => $rows->count()],
                ['label' => 'Total Deducted', 'value' => round($rows->sum('amount'), 2)],
            ],
        ];
    }

    private function availableReports(): Collection
    {
        return collect([
            ['slug' => 'event-shortages', 'label' => 'Event Shortage Report', 'route' => route('reports.event-shortages')],
            ['slug' => 'outstanding-balances', 'label' => 'Outstanding Balance Report', 'route' => route('reports.outstanding-balances')],
            ['slug' => 'zero-balances', 'label' => 'Zero Balance Report', 'route' => route('reports.zero-balances')],
            ['slug' => 'person-ledger', 'label' => 'Person Ledger Report', 'route' => route('reports.person-ledger')],
            ['slug' => 'deduction-history', 'label' => 'Deduction History Report', 'route' => route('reports.deduction-history')],
        ]);
    }
}
