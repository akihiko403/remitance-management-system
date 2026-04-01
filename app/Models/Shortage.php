<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Shortage extends Model
{
    use LogsActivity;

    protected $fillable = [
        'event_id',
        'person_id',
        'event_teller_assignment_id',
        'remittance_id',
        'transaction_date',
        'amount',
        'reason',
        'notes',
        'encoded_by',
    ];

    protected $appends = [
        'paid_amount',
        'remaining_balance',
        'settlement_status',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('shortages');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(EventTellerAssignment::class, 'event_teller_assignment_id');
    }

    public function remittance(): BelongsTo
    {
        return $this->belongsTo(Remittance::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(Deduction::class);
    }

    public function encoder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }

    protected function paidAmount(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => (float) ($attributes['paid_amount'] ?? $attributes['deductions_sum_amount'] ?? 0),
        );
    }

    protected function remainingBalance(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => max(
                (float) ($attributes['remaining_balance'] ?? ((float) $this->amount - (float) $this->paid_amount)),
                0,
            ),
        );
    }

    protected function settlementStatus(): Attribute
    {
        return Attribute::make(
            get: fn () => match (true) {
                (float) $this->remaining_balance <= 0 => 'settled',
                (float) $this->paid_amount > 0 => 'partial',
                default => 'outstanding',
            },
        );
    }
}
