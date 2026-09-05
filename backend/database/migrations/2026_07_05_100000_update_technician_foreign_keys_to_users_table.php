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
        // Drop old foreign keys
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['assigned_technician_id']);
        });

        Schema::table('asset_transactions', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
        });

        // Add new foreign keys pointing to users table
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('technician_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->foreign('assigned_technician_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('asset_transactions', function (Blueprint $table) {
            $table->foreign('technician_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
            $table->foreign('technician_id')->references('id')->on('technicians')->nullOnDelete();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['assigned_technician_id']);
            $table->foreign('assigned_technician_id')->references('id')->on('technicians')->nullOnDelete();
        });

        Schema::table('asset_transactions', function (Blueprint $table) {
            $table->dropForeign(['technician_id']);
            $table->foreign('technician_id')->references('id')->on('technicians')->nullOnDelete();
        });
    }
};
