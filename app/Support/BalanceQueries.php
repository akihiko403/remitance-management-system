<?php

namespace App\Support;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class BalanceQueries
{
    public static function deductionTotalsByShortage(): Builder
    {
        return DB::table('deductions')
            ->selectRaw('shortage_id, SUM(amount) as paid_amount')
            ->groupBy('shortage_id');
    }

    public static function personBalances(): Builder
    {
        $deductionTotals = self::deductionTotalsByShortage();

        return DB::table('shortages')
            ->join('people', 'people.id', '=', 'shortages.person_id')
            ->leftJoinSub($deductionTotals, 'deduction_totals', function ($join): void {
                $join->on('deduction_totals.shortage_id', '=', 'shortages.id');
            })
            ->selectRaw('
                shortages.person_id,
                people.code as person_code,
                people.first_name,
                people.middle_name,
                people.last_name,
                people.suffix,
                COUNT(shortages.id) as shortage_count,
                SUM(shortages.amount) as total_shortage,
                SUM(COALESCE(deduction_totals.paid_amount, 0)) as total_paid,
                SUM(CASE
                    WHEN shortages.amount - COALESCE(deduction_totals.paid_amount, 0) > 0
                        THEN shortages.amount - COALESCE(deduction_totals.paid_amount, 0)
                    ELSE 0
                END) as remaining_balance,
                SUM(CASE
                    WHEN shortages.amount - COALESCE(deduction_totals.paid_amount, 0) > 0
                        THEN 1
                    ELSE 0
                END) as open_shortage_count
            ')
            ->groupBy(
                'shortages.person_id',
                'people.code',
                'people.first_name',
                'people.middle_name',
                'people.last_name',
                'people.suffix',
            );
    }

    public static function latestEventNamesByPerson(): Collection
    {
        $latestDates = DB::table('shortages')
            ->selectRaw('person_id, MAX(transaction_date) as latest_transaction_date')
            ->groupBy('person_id');

        return DB::table('shortages')
            ->joinSub($latestDates, 'latest_dates', function ($join): void {
                $join->on('latest_dates.person_id', '=', 'shortages.person_id')
                    ->on('latest_dates.latest_transaction_date', '=', 'shortages.transaction_date');
            })
            ->join('events', 'events.id', '=', 'shortages.event_id')
            ->selectRaw('shortages.person_id, MAX(events.name) as latest_event_name')
            ->groupBy('shortages.person_id')
            ->pluck('latest_event_name', 'shortages.person_id');
    }

    public static function personFullName(object|array $row): string
    {
        $data = is_array($row) ? $row : get_object_vars($row);

        return collect([
            $data['first_name'] ?? null,
            $data['middle_name'] ?? null,
            $data['last_name'] ?? null,
            $data['suffix'] ?? null,
        ])->filter()->implode(' ');
    }
}
