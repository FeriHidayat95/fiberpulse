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
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'odp_port')) {
                $table->string('odp_port')->nullable();
            }
            if (!Schema::hasColumn('customers', 'redaman_dbm')) {
                $table->string('redaman_dbm')->nullable();
            }
            if (!Schema::hasColumn('customers', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('customers', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
        });

        Schema::table('tasks', function (Blueprint $table) {
            if (!Schema::hasColumn('tasks', 'additional_materials')) {
                $table->json('additional_materials')->nullable();
            }
            if (!Schema::hasColumn('tasks', 'odp_port')) {
                $table->string('odp_port')->nullable();
            }
            if (!Schema::hasColumn('tasks', 'redaman_dbm')) {
                $table->string('redaman_dbm')->nullable();
            }
            if (!Schema::hasColumn('tasks', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('tasks', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['additional_materials', 'odp_port', 'redaman_dbm', 'latitude', 'longitude']);
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropColumn(['odp_port', 'redaman_dbm', 'latitude', 'longitude']);
        });
    }
};
