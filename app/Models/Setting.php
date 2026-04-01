<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Throwable;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class Setting extends Model
{
    use LogsActivity;

    public const APP_SETTINGS_CACHE_KEY = 'settings.app.bundle';

    protected static ?bool $settingsTableExists = null;

    protected $fillable = [
        'key',
        'value',
    ];

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->useLogName('settings');
    }

    public static function getValue(string $key, mixed $default = null): mixed
    {
        try {
            if (! static::settingsTableExists()) {
                return $default;
            }

            return static::query()->where('key', $key)->value('value') ?? $default;
        } catch (Throwable) {
            return $default;
        }
    }

    public static function setValue(string $key, mixed $value): void
    {
        try {
            if (! static::settingsTableExists()) {
                return;
            }

            static::query()->updateOrCreate(['key' => $key], ['value' => $value]);
            Cache::forget(static::APP_SETTINGS_CACHE_KEY);
        } catch (Throwable) {
            return;
        }
    }

    public static function appSettings(array $defaults): array
    {
        try {
            if (! static::settingsTableExists()) {
                return $defaults;
            }

            return Cache::remember(
                static::APP_SETTINGS_CACHE_KEY,
                now()->addMinutes(5),
                function () use ($defaults): array {
                    $values = static::query()
                        ->whereIn('key', array_keys($defaults))
                        ->pluck('value', 'key')
                        ->all();

                    return array_merge($defaults, $values);
                }
            );
        } catch (Throwable) {
            return $defaults;
        }
    }

    protected static function settingsTableExists(): bool
    {
        if (static::$settingsTableExists !== null) {
            return static::$settingsTableExists;
        }

        try {
            return static::$settingsTableExists = Schema::hasTable('settings');
        } catch (Throwable) {
            return static::$settingsTableExists = false;
        }
    }
}
