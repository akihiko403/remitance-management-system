<?php

use App\Models\Event;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('status')->default('inactive')->change();
        });

        Schema::table('event_teller_assignments', function (Blueprint $table) {
            $table->string('teller_label')->nullable()->after('person_id');
            $table->unsignedInteger('teller_number')->nullable()->after('teller_label');
            $table->string('full_teller_display')->nullable()->after('teller_number');
        });

        Schema::table('remittances', function (Blueprint $table) {
            $table->date('transaction_date')->nullable()->change();
            $table->decimal('cash_on_hand', 14, 2)->default(0)->after('amount');
            $table->decimal('short_amount', 14, 2)->default(0)->after('cash_on_hand');
            $table->unique(['event_teller_assignment_id'], 'remittances_assignment_unique');
        });

        Schema::table('shortages', function (Blueprint $table) {
            $table->foreignId('remittance_id')->nullable()->after('event_teller_assignment_id')->constrained()->nullOnDelete();
            $table->unique(['remittance_id'], 'shortages_remittance_unique');
        });

        DB::table('event_teller_assignments')
            ->orderBy('id')
            ->get()
            ->each(function (object $assignment): void {
                $legacyPosition = trim((string) ($assignment->teller_position ?? ''));

                if (preg_match('/^(.*?)(?:\s+(\d+))?$/', $legacyPosition, $matches) !== 1) {
                    $tellerLabel = Str::upper($legacyPosition ?: 'TELLER');
                    $tellerNumber = 1;
                } else {
                    $tellerLabel = Str::upper(trim((string) ($matches[1] ?? 'TELLER'))) ?: 'TELLER';
                    $tellerNumber = (int) ($matches[2] ?? 1);
                }

                $fullDisplay = Str::upper(trim($legacyPosition ?: sprintf('%s %d', $tellerLabel, $tellerNumber)));

                DB::table('event_teller_assignments')
                    ->where('id', $assignment->id)
                    ->update([
                        'teller_label' => $tellerLabel,
                        'teller_number' => $tellerNumber,
                        'full_teller_display' => $fullDisplay,
                        'teller_position' => $fullDisplay,
                    ]);
            });

        Schema::table('event_teller_assignments', function (Blueprint $table) {
            $table->string('teller_label')->nullable(false)->change();
            $table->unsignedInteger('teller_number')->nullable(false)->change();
            $table->string('full_teller_display')->nullable(false)->change();
            $table->dropUnique('event_person_position_unique');
            $table->unique(['event_id', 'person_id'], 'event_assignment_person_unique');
            $table->unique(['event_id', 'full_teller_display'], 'event_assignment_display_unique');
        });

        $activeEventId = Event::query()
            ->where('status', 'open')
            ->latest('event_date')
            ->value('id');

        Event::query()->update(['status' => 'inactive']);

        if ($activeEventId) {
            Event::query()->whereKey($activeEventId)->update(['status' => 'active']);
        }
    }

    public function down(): void
    {
        $activeEventId = Event::query()
            ->where('status', 'active')
            ->latest('event_date')
            ->value('id');

        Event::query()->update(['status' => 'archived']);

        if ($activeEventId) {
            Event::query()->whereKey($activeEventId)->update(['status' => 'open']);
        }

        Schema::table('shortages', function (Blueprint $table) {
            $table->dropUnique('shortages_remittance_unique');
            $table->dropConstrainedForeignId('remittance_id');
        });

        Schema::table('remittances', function (Blueprint $table) {
            $table->dropUnique('remittances_assignment_unique');
            $table->dropColumn(['cash_on_hand', 'short_amount']);
            $table->date('transaction_date')->nullable(false)->change();
        });

        Schema::table('event_teller_assignments', function (Blueprint $table) {
            $table->dropUnique('event_assignment_person_unique');
            $table->dropUnique('event_assignment_display_unique');
            $table->unique(['event_id', 'person_id', 'teller_position'], 'event_person_position_unique');
            $table->dropColumn(['teller_label', 'teller_number', 'full_teller_display']);
        });

        Schema::table('events', function (Blueprint $table) {
            $table->string('status')->default('open')->change();
        });
    }
};
