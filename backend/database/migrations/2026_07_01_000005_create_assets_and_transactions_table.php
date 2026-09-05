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
        Schema::create('assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category'); // e.g., Modem ONT, Kabel FO, Router, Aksesoris
            $table->string('brand')->nullable();
            $table->string('stock_type')->default('Unit'); // Unit, Meter, Roll, Pcs
            $table->integer('total_stock')->default(0);
            $table->integer('available_stock')->default(0);
            $table->integer('used_stock')->default(0);
            $table->integer('damaged_stock')->default(0);
            $table->enum('status', ['Tersedia', 'Menipis', 'Habis'])->default('Tersedia');
            $table->timestamps();
        });

        Schema::create('asset_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets')->cascadeOnDelete();
            $table->foreignId('technician_id')->nullable()->constrained('technicians')->nullOnDelete();
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();
            $table->enum('type', ['Masuk', 'Keluar', 'Rusak', 'Kembali'])->default('Keluar');
            $table->integer('quantity')->default(1);
            $table->string('serial_number')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('asset_transactions');
        Schema::dropIfExists('assets');
    }
};
