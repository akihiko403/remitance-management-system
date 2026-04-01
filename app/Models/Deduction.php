<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Deduction extends Model
{
    use LogsActivity;

    protected $fillable = [
        'shortage_id',
        'event_id',
        'person_id',
        'transaction_date',
        'amount',
        'method',
        'reference_number',
        'notes',
        'encoded_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (Deduction $deduction) {
            if (filled($deduction->reference_number)) {
                return;
            }

            $deduction->reference_number = $deduction->generateReferenceNumber();
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('deductions');
    }

    public function shortage(): BelongsTo
    {
        return $this->belongsTo(Shortage::class);
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function encoder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }

    public function generateReferenceNumber(): string
    {
        return 'PAY-'.now()->format('YmdHis').'-'.Str::upper(Str::random(6));
    }
}
