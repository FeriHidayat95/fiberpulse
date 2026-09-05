<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check');
        DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type::text = ANY (ARRAY['Pasang Baru'::character varying, 'Perbaikan Gangguan'::character varying, 'Maintenance ODP'::character varying, 'Pencabutan'::character varying, 'Eskalasi Admin'::character varying, 'Pembangunan'::character varying]::text[]))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_type_check');
        DB::statement("ALTER TABLE tasks ADD CONSTRAINT tasks_type_check CHECK (type::text = ANY (ARRAY['Pasang Baru'::character varying, 'Perbaikan Gangguan'::character varying, 'Maintenance ODP'::character varying, 'Pencabutan'::character varying, 'Eskalasi Admin'::character varying]::text[]))");
    }
};
