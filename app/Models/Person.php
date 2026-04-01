<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Person extends Model
{
    use LogsActivity;

    protected $fillable = [
        'code',
        'nickname',
        'first_name',
        'middle_name',
        'last_name',
        'suffix',
        'phone',
        'email',
        'province',
        'address',
        'notes',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('people');
    }

    public function eventAssignments(): HasMany
    {
        return $this->hasMany(EventTellerAssignment::class);
    }

    public function events(): BelongsToMany
    {
        return $this->belongsToMany(Event::class, 'event_teller_assignments')
            ->withPivot(['teller_label', 'teller_number', 'full_teller_display', 'notes'])
            ->withTimestamps();
    }

    public function remittances(): HasMany
    {
        return $this->hasMany(Remittance::class);
    }

    public function shortages(): HasMany
    {
        return $this->hasMany(Shortage::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(Deduction::class);
    }

    protected function fullName(): Attribute
    {
        return Attribute::make(
            get: fn () => collect([
                $this->first_name,
                $this->middle_name,
                $this->last_name,
                $this->suffix,
            ])->filter()->implode(' '),
        );
    }

    protected static function booted(): void
    {
        static::creating(function (self $person): void {
            if (! blank($person->code)) {
                return;
            }

            $person->code = self::generateNextCode();
        });
    }

    protected static function generateNextCode(): string
    {
        $maxNumeric = static::query()
            ->where('code', 'like', 'P-%')
            ->get(['code'])
            ->map(function (self $person): int {
                if (! preg_match('/^P-(\d+)$/', (string) $person->code, $matches)) {
                    return 0;
                }

                return (int) $matches[1];
            })
            ->max();

        $nextNumeric = max($maxNumeric ?: 1000, 1000) + 1;

        return sprintf('P-%04d', $nextNumeric);
    }
}
