<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->index(['status', 'event_date'], 'events_status_event_date_index');
        });

        Schema::table('people', function (Blueprint $table) {
            $table->index(['is_active', 'last_name', 'first_name'], 'people_active_last_first_index');
        });

        Schema::table('remittances', function (Blueprint $table) {
            $table->index(['event_id', 'transaction_date'], 'remittances_event_transaction_date_index');
            $table->index(['person_id', 'transaction_date'], 'remittances_person_transaction_date_index');
        });

        Schema::table('shortages', function (Blueprint $table) {
            $table->index(['event_id', 'transaction_date'], 'shortages_event_transaction_date_index');
            $table->index(['person_id', 'transaction_date'], 'shortages_person_transaction_date_index');
        });

        Schema::table('deductions', function (Blueprint $table) {
            $table->index(['event_id', 'transaction_date'], 'deductions_event_transaction_date_index');
            $table->index(['person_id', 'transaction_date'], 'deductions_person_transaction_date_index');
        });
    }

    public function down(): void
    {
        Schema::table('deductions', function (Blueprint $table) {
            $table->dropIndex('deductions_event_transaction_date_index');
            $table->dropIndex('deductions_person_transaction_date_index');
        });

        Schema::table('shortages', function (Blueprint $table) {
            $table->dropIndex('shortages_event_transaction_date_index');
            $table->dropIndex('shortages_person_transaction_date_index');
        });

        Schema::table('remittances', function (Blueprint $table) {
            $table->dropIndex('remittances_event_transaction_date_index');
            $table->dropIndex('remittances_person_transaction_date_index');
        });

        Schema::table('people', function (Blueprint $table) {
            $table->dropIndex('people_active_last_first_index');
        });

        Schema::table('events', function (Blueprint $table) {
            $table->dropIndex('events_status_event_date_index');
        });
    }
};
