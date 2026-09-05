<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Demo Users (Admin & Field Engineers)
        DB::table('users')->insert([
            [
                'name' => 'System Administrator',
                'email' => 'admin@fiberpulse.io',
                'password' => bcrypt(env('DEMO_ADMIN_PASSWORD', 'Password123!')),
                'role' => 'admin',
                'phone' => '+15550192834',
                'status' => 'Aktif',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Operations Lead',
                'email' => 'operations@fiberpulse.io',
                'password' => bcrypt(env('DEMO_ADMIN_PASSWORD', 'Password123!')),
                'role' => 'admin',
                'phone' => '+15550192835',
                'status' => 'Aktif',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Field Technician Alpha',
                'email' => 'field.tech@fiberpulse.io',
                'password' => bcrypt(env('DEMO_TECH_PASSWORD', 'Password123!')),
                'role' => 'teknisi',
                'phone' => '+15550192836',
                'status' => 'Aktif',
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);

        // Seed Realistic GIS ODP Points (Optical Distribution Points) for map telemetry
        if (DB::table('odps')->count() === 0) {
            DB::table('odps')->insert([
                [
                    'name' => 'ODP-CTR-01',
                    'dusun' => 'Central Hub District',
                    'total_ports' => 16,
                    'used_ports' => 6,
                    'status' => 'Aktif',
                    'latitude' => '-6.2088',
                    'longitude' => '106.8456',
                    'address' => 'Metropolitan Backbone Sector 1, Distribution Post #104',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'ODP-WST-02',
                    'dusun' => 'West Suburban Zone',
                    'total_ports' => 8,
                    'used_ports' => 7,
                    'status' => 'Aktif',
                    'latitude' => '-6.2150',
                    'longitude' => '106.8390',
                    'address' => 'Parkway Avenue, Fiber Splitter Enclosure #22',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'ODP-EST-03',
                    'dusun' => 'East Tech Corridor',
                    'total_ports' => 16,
                    'used_ports' => 16,
                    'status' => 'Penuh',
                    'latitude' => '-6.2020',
                    'longitude' => '106.8520',
                    'address' => 'Innovation Blvd Pole #88 (At Capacity)',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'ODP-NTH-04',
                    'dusun' => 'North Residential Haven',
                    'total_ports' => 8,
                    'used_ports' => 2,
                    'status' => 'Aktif',
                    'latitude' => '-6.1950',
                    'longitude' => '106.8410',
                    'address' => 'Green Valley Ring Road Pole #12',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // Seed default AI Knowledge Base (CS AI FAQ & Otak AI)
        $this->call(AiKnowledgeBaseSeeder::class);

        // Seed default Gemini API Keys
        $this->call(ApiKeySeeder::class);
    }
}
