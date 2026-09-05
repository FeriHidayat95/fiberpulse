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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('phone');
            $table->text('address');
            $table->string('dusun');
            $table->string('package_speed'); // e.g., 20 Mbps, 50 Mbps
            $table->enum('status', ['Aktif', 'Non-Aktif', 'Isolir', 'Menunggu Pasang'])->default('Menunggu Pasang');
            $table->foreignId('odp_id')->nullable()->constrained('odps')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->string('type')->default('Pasang Baru');
            $table->string('package_speed');
            $table->enum('status', ['Menunggu', 'Proses', 'Selesai', 'Batal'])->default('Menunggu');
            $table->foreignId('assigned_technician_id')->nullable()->constrained('technicians')->nullOnDelete();
            $table->foreignId('odp_id')->nullable()->constrained('odps')->nullOnDelete();
            $table->date('request_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
        Schema::dropIfExists('customers');
    }
};
