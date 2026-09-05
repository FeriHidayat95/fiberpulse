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
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_number')->unique();
            $table->enum('type', ['Pasang Baru', 'Perbaikan Gangguan', 'Maintenance ODP'])->default('Pasang Baru');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('technician_id')->nullable()->constrained('technicians')->nullOnDelete();
            $table->foreignId('odp_id')->nullable()->constrained('odps')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->enum('status', ['Menunggu', 'Dikerjakan', 'Selesai', 'Batal'])->default('Menunggu');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('proof_photo_url')->nullable();
            $table->string('modem_sn')->nullable();
            $table->string('kabel_fo_used')->nullable(); // e.g. 15 Meter
            $table->text('technician_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
