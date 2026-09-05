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
        Schema::create('api_keys', function (Blueprint $table) {
            $table->id();
            $table->string('provider')->default('gemini'); // gemini, openai, etc
            $table->string('key');
            $table->boolean('is_active')->default(true);
            $table->integer('error_count')->default(0);
            $table->timestamp('last_used_at')->nullable();
            $table->string('name')->nullable(); // Optional friendly name
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_keys');
    }
};
