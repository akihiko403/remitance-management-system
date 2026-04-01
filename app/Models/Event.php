<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Event extends Model
{
    use LogsActivity;

    public const ACTIVE_SUMMARY_CACHE_KEY = 'events.active.summary';

    protected $fillable = [
        'code',
        'name',
        'slug',
        'event_date',
        'venue',
        'status',
        'currency',
        'closed_at',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'event_date' => 'date',
            'closed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $event): void {
            if (! blank($event->code)) {
                return;
            }

            $event->code = self::generateNextCode();
        });

        static::saving(function (self $event): void {
            $event->slug = Str::slug($event->name.'-'.$event->code);
        });

        static::saved(fn () => Cache::forget(self::ACTIVE_SUMMARY_CACHE_KEY));
        static::deleted(fn () => Cache::forget(self::ACTIVE_SUMMARY_CACHE_KEY));
    }

    protected static function generateNextCode(): string
    {
        $maxNumeric = static::query()
            ->where('code', 'like', 'EV-%')
            ->get(['code'])
            ->map(function (self $event): int {
                if (! preg_match('/^EV-(\d+)$/', (string) $event->code, $matches)) {
                    return 0;
                }

                return (int) $matches[1];
            })
            ->max();

        $nextNumeric = max($maxNumeric ?: 2026000, 2026000) + 1;

        return sprintf('EV-%06d', $nextNumeric);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('events');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(EventTellerAssignment::class);
    }

    public function people(): BelongsToMany
    {
        return $this->belongsToMany(Person::class, 'event_teller_assignments')
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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', 'active');
    }

    public static function activeSummary(): ?array
    {
        return Cache::remember(self::ACTIVE_SUMMARY_CACHE_KEY, now()->addMinutes(5), function (): ?array {
            /** @var self|null $event */
            $event = self::query()
                ->active()
                ->latest('event_date')
                ->first(['id', 'code', 'name', 'event_date', 'venue']);

            if (! $event) {
                return null;
            }

            return [
                'id' => $event->id,
                'code' => $event->code,
                'name' => $event->name,
                'event_date' => $event->event_date?->format('Y-m-d'),
                'venue' => $event->venue,
            ];
        });
    }
}
