<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'modem_sn')) {
                $table->string('modem_sn')->nullable();
            }
            if (!Schema::hasColumn('customers', 'nik')) {
                $table->string('nik')->nullable();
            }
            if (!Schema::hasColumn('customers', 'package')) {
                $table->string('package')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table) {
            if (Schema::hasColumn('customers', 'modem_sn')) {
                $table->dropColumn('modem_sn');
            }
            if (Schema::hasColumn('customers', 'nik')) {
                $table->dropColumn('nik');
            }
            if (Schema::hasColumn('customers', 'package')) {
                $table->dropColumn('package');
            }
        });
    }
};