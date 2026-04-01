<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Remittance extends Model
{
    use LogsActivity;

    protected $fillable = [
        'event_id',
        'person_id',
        'event_teller_assignment_id',
        'transaction_date',
        'amount',
        'cash_on_hand',
        'short_amount',
        'reference_number',
        'payment_channel',
        'notes',
        'encoded_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_date' => 'date',
            'amount' => 'decimal:2',
            'cash_on_hand' => 'decimal:2',
            'short_amount' => 'decimal:2',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('remittances');
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

    public function shortage(): HasOne
    {
        return $this->hasOne(Shortage::class);
    }

    public function encoder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'encoded_by');
    }
}
