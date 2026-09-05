<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('asset_transactions', function (Blueprint $table) {
            if (!Schema::hasColumn('asset_transactions', 'year')) {
                $table->string('year', 10)->nullable()->after('serial_number');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asset_transactions', function (Blueprint $table) {
            if (Schema::hasColumn('asset_transactions', 'year')) {
                $table->dropColumn('year');
            }
        });
    }
};