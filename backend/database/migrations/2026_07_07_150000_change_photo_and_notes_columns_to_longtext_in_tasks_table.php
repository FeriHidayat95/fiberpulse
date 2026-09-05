<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE tasks ALTER COLUMN proof_photo_url TYPE TEXT');
        DB::statement('ALTER TABLE tasks ALTER COLUMN technician_notes TYPE TEXT');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE tasks ALTER COLUMN proof_photo_url TYPE VARCHAR(255)');
        DB::statement('ALTER TABLE tasks ALTER COLUMN technician_notes TYPE TEXT');
    }
};
