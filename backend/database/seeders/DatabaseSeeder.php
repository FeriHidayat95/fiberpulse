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

        // Seed Field Technicians
        if (DB::table('technicians')->count() === 0) {
            DB::table('technicians')->insert([
                [
                    'id' => 1,
                    'name' => 'Alex Rivera',
                    'phone' => '+15550192836',
                    'email' => 'alex.rivera@fiberpulse.io',
                    'status' => 'Tersedia',
                    'current_lat' => -6.2088,
                    'current_lng' => 106.8456,
                    'completed_tasks_count' => 14,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 2,
                    'name' => 'David Chen',
                    'phone' => '+15550192837',
                    'email' => 'david.chen@fiberpulse.io',
                    'status' => 'Bertugas',
                    'current_lat' => -6.2150,
                    'current_lng' => 106.8390,
                    'completed_tasks_count' => 9,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // Seed Subscribers & Customers
        if (DB::table('customers')->count() === 0) {
            DB::table('customers')->insert([
                [
                    'id' => 1,
                    'name' => 'Sarah Jenkins',
                    'phone' => '+15551234001',
                    'address' => '742 Evergreen Terrace, Central District',
                    'dusun' => 'Central Hub District',
                    'package_speed' => '150 Mbps',
                    'status' => 'Aktif',
                    'odp_id' => 1,
                    'created_at' => Carbon::now()->subMonths(2),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 2,
                    'name' => 'Marcus Vance',
                    'phone' => '+15551234002',
                    'address' => '104 West Elm Boulevard, Apt 4B',
                    'dusun' => 'West Suburban Zone',
                    'package_speed' => '50 Mbps',
                    'status' => 'Aktif',
                    'odp_id' => 2,
                    'created_at' => Carbon::now()->subMonth(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 3,
                    'name' => 'Elena Rostova',
                    'phone' => '+15551234003',
                    'address' => '88 Tech Park Way, Suite 12',
                    'dusun' => 'East Tech Corridor',
                    'package_speed' => '1 Gbps Dedicated',
                    'status' => 'Aktif',
                    'odp_id' => 3,
                    'created_at' => Carbon::now()->subDays(15),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'id' => 4,
                    'name' => 'Liam Gallagher',
                    'phone' => '+15551234004',
                    'address' => '12 Meadowview Court',
                    'dusun' => 'North Residential Haven',
                    'package_speed' => '150 Mbps',
                    'status' => 'Menunggu Pasang',
                    'odp_id' => 4,
                    'created_at' => Carbon::now()->subDays(2),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // Seed Work Orders
        if (DB::table('orders')->count() === 0) {
            DB::table('orders')->insert([
                [
                    'order_number' => 'ORD-2026-001',
                    'customer_id' => 4,
                    'type' => 'Pasang Baru',
                    'package_speed' => '150 Mbps',
                    'status' => 'Proses',
                    'assigned_technician_id' => 2,
                    'odp_id' => 4,
                    'request_date' => Carbon::now()->toDateString(),
                    'notes' => 'New fiber subscriber onboarding. Drop cable run approximately 45 meters.',
                    'created_at' => Carbon::now()->subDay(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // Seed Field Tasks
        if (DB::table('tasks')->count() === 0) {
            DB::table('tasks')->insert([
                [
                    'ticket_number' => 'TCK-2026-0891',
                    'type' => 'Pasang Baru',
                    'title' => 'FTTH Installation: Liam Gallagher (150 Mbps)',
                    'description' => 'Route optical drop cable from ODP-NTH-04 port 3 to customer premises.',
                    'technician_id' => 2,
                    'odp_id' => 4,
                    'customer_id' => 4,
                    'status' => 'Dikerjakan',
                    'started_at' => Carbon::now()->subHours(2),
                    'completed_at' => null,
                    'proof_photo_url' => null,
                    'modem_sn' => 'ONT-HW-20260901',
                    'kabel_fo_used' => '45 Meter',
                    'technician_notes' => 'Optical signal test at splitter: -19.4 dBm (Passed). Pulling drop cable.',
                    'created_at' => Carbon::now()->subHours(3),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'ticket_number' => 'TCK-2026-0890',
                    'type' => 'Perbaikan Gangguan',
                    'title' => 'Loss of Signal (LOS) Inspection at West Elm Blvd',
                    'description' => 'Customer reported red flashing LOS. Cleaned bulkhead connector at ODP-WST-02 port 7.',
                    'technician_id' => 1,
                    'odp_id' => 2,
                    'customer_id' => 2,
                    'status' => 'Selesai',
                    'started_at' => Carbon::now()->subDays(1)->setHour(9),
                    'completed_at' => Carbon::now()->subDays(1)->setHour(11),
                    'proof_photo_url' => null,
                    'modem_sn' => 'ONT-ZX-992011',
                    'kabel_fo_used' => 'Patch Cord 2m',
                    'technician_notes' => 'Bulkhead cleaned, Rx calibrated to -20.8 dBm. Service restored.',
                    'created_at' => Carbon::now()->subDays(1)->setHour(8),
                    'updated_at' => Carbon::now()->subDays(1)->setHour(11),
                ],
            ]);
        }

        // Seed Assets & Inventory
        if (DB::table('assets')->count() === 0) {
            DB::table('assets')->insert([
                [
                    'name' => 'Dual-Band Wi-Fi 6 GPON ONT Router',
                    'category' => 'Modem ONT',
                    'brand' => 'Huawei HG8245H5 / ZTE F670L',
                    'stock_type' => 'Unit',
                    'total_stock' => 150,
                    'available_stock' => 112,
                    'used_stock' => 35,
                    'damaged_stock' => 3,
                    'status' => 'Tersedia',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => '1-Core Pre-Connectorized Drop Cable 1000m',
                    'category' => 'Kabel FO',
                    'brand' => 'FiberHome G.657A2',
                    'stock_type' => 'Roll',
                    'total_stock' => 25,
                    'available_stock' => 18,
                    'used_stock' => 7,
                    'damaged_stock' => 0,
                    'status' => 'Tersedia',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'PLC Optical Splitter 1:8 SC/UPC',
                    'category' => 'Aksesoris',
                    'brand' => 'Corning Optical',
                    'stock_type' => 'Pcs',
                    'total_stock' => 60,
                    'available_stock' => 48,
                    'used_stock' => 12,
                    'damaged_stock' => 0,
                    'status' => 'Tersedia',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
                [
                    'name' => 'SC/UPC Fast Connector Box (100 Pcs)',
                    'category' => 'Aksesoris',
                    'brand' => 'Fujikura',
                    'stock_type' => 'Unit',
                    'total_stock' => 40,
                    'available_stock' => 31,
                    'used_stock' => 9,
                    'damaged_stock' => 0,
                    'status' => 'Tersedia',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ],
            ]);
        }

        // Seed default AI Knowledge Base & API Keys
        $this->call(AiKnowledgeBaseSeeder::class);
        $this->call(ApiKeySeeder::class);
    }
}
