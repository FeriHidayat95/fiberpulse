<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop the old check constraint
        DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check');

        // Add the new check constraint with 'Pencabutan' included
        DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type::text = ANY (ARRAY['Pasang Baru'::character varying, 'Perbaikan Gangguan'::character varying, 'Maintenance ODP'::character varying, 'Pencabutan'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop the new check constraint
        DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check');

        // Restore the old check constraint without 'Pencabutan'
        DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type::text = ANY (ARRAY['Pasang Baru'::character varying, 'Perbaikan Gangguan'::character varying, 'Maintenance ODP'::character varying]::text[]))");
    }
};
