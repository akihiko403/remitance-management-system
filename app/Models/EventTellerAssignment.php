<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class EventTellerAssignment extends Model
{
    use LogsActivity;

    protected $fillable = [
        'event_id',
        'person_id',
        'teller_label',
        'teller_number',
        'full_teller_display',
        'teller_position',
        'team',
        'is_lead',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'is_lead' => 'boolean',
            'teller_number' => 'integer',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (self $assignment): void {
            $fullDisplay = self::buildFullTellerDisplay(
                $assignment->teller_label,
                $assignment->teller_number,
            );

            $assignment->teller_label = self::normalizeTellerLabel($assignment->teller_label);
            $assignment->teller_number = max((int) $assignment->teller_number, 1);
            $assignment->full_teller_display = $fullDisplay;
            $assignment->teller_position = $fullDisplay;
        });
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('assignments');
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function person(): BelongsTo
    {
        return $this->belongsTo(Person::class);
    }

    public function remittance(): HasOne
    {
        return $this->hasOne(Remittance::class);
    }

    public function remittances(): HasMany
    {
        return $this->hasMany(Remittance::class);
    }

    public function shortages(): HasMany
    {
        return $this->hasMany(Shortage::class);
    }

    protected function tellerPosition(): Attribute
    {
        return Attribute::make(
            get: fn ($value, array $attributes) => $attributes['full_teller_display'] ?? $attributes['teller_position'] ?? null,
        );
    }

    public static function normalizeTellerLabel(?string $label): string
    {
        return Str::upper(trim((string) $label)) ?: 'TELLER';
    }

    public static function buildFullTellerDisplay(?string $label, int|string|null $number): string
    {
        $normalizedLabel = self::normalizeTellerLabel($label);
        $normalizedNumber = max((int) $number, 1);

        return trim(sprintf('%s %d', $normalizedLabel, $normalizedNumber));
    }
}
