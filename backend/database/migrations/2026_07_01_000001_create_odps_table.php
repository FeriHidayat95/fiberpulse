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
        Schema::create('odps', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique(); // e.g., ODP-D1-01
            $table->string('code')->nullable();
            $table->string('dusun'); // e.g., Dusun 1
            $table->integer('total_ports')->default(8);
            $table->integer('used_ports')->default(0);
            $table->enum('status', ['Aktif', 'Penuh', 'Rusak', 'Maintenance'])->default('Aktif');
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->text('address')->nullable();
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('odps');
    }
};
