<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Asset;
use App\Models\Task;
use App\Models\Technician;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AssetLifecycleTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_asset_lifecycle_masuk_keluar_rusak()
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $this->actingAs($admin);

        // ==========================================
        // 1. ASET MASUK & TAMBAH STOK
        // ==========================================
        
        // A. Tambah Asset Consumable
        $resConsumable = $this->postJson('/api/assets', [
            'name' => 'Kabel FO Uji Coba',
            'category' => 'Consumable',
            'brand' => 'Belden',
            'total_stock' => 1000,
            'stock_type' => 'Meter'
        ]);
        $resConsumable->assertStatus(201);
        $consumable = Asset::where('name', 'Kabel FO Uji Coba')->first();
        $this->assertEquals(1000, $consumable->available_stock);

        // B. Tambah Asset Serial
        $resSerial = $this->postJson('/api/assets', [
            'name' => 'Router ZTE',
            'category' => 'Serial',
            'brand' => 'ZTE',
            'total_stock' => 1,
            'serial_number' => 'SN-ZTE-001',
            'stock_type' => 'Unit'
        ]);
        $resSerial->assertStatus(201);
        $serial = Asset::where('name', 'Router ZTE')->first();
        $this->assertEquals(1, $serial->available_stock);

        // C. Edit Asset
        $resEdit = $this->putJson('/api/assets/' . $serial->id, [
            'name' => 'Router ZTE V2'
        ]);
        $resEdit->assertStatus(200);
        $this->assertDatabaseHas('assets', ['id' => $serial->id, 'name' => 'Router ZTE V2']);

        // ==========================================
        // 2. ASET KELUAR (TUGAS TEKNISI)
        // ==========================================
        
        // Buat Teknisi
        $technician = Technician::create([
            'name' => 'Teknisi Handal',
            'phone' => '08123456789',
            'status' => 'Tersedia'
        ]);

        // Buat Tugas
        $task = Task::create([
            'ticket_number' => 'T-001',
            'type' => 'Pasang Baru',
            'title' => 'Pasang Internet',
            'technician_id' => $technician->id,
            'status' => 'Menunggu'
        ]);

        // Teknisi Take Asset (Kabel)
        $resTakeKabel = $this->postJson('/api/assets/take', [
            'asset_id' => $consumable->id,
            'technician_id' => $technician->id,
            'task_id' => $task->id,
            'quantity' => 150
        ]);
        $resTakeKabel->assertStatus(200);

        // Teknisi Take Asset (Router)
        $resTakeRouter = $this->postJson('/api/assets/take', [
            'asset_id' => $serial->id,
            'technician_id' => $technician->id,
            'task_id' => $task->id,
            'quantity' => 1,
            'serial_number' => 'SN-ZTE-001'
        ]);
        $resTakeRouter->assertStatus(200);

        // ==========================================
        // 3. SINKRONISASI ASET GUDANG
        // ==========================================
        
        $consumable->refresh();
        $serial->refresh();

        // Kabel harusnya sisa 850, terpakai 150
        $this->assertEquals(850, $consumable->available_stock);
        $this->assertEquals(150, $consumable->used_stock);

        // Router harusnya sisa 0, terpakai 1, status Habis
        $this->assertEquals(0, $serial->available_stock);
        $this->assertEquals(1, $serial->used_stock);
        $this->assertEquals('Habis', $serial->status);

        // Verifikasi Transaction Terbentuk untuk Keluarnya Aset
        $this->assertDatabaseHas('asset_transactions', [
            'asset_id' => $consumable->id,
            'type' => 'Keluar',
            'quantity' => 150
        ]);

        // ==========================================
        // 4. MONITORING RUSAK (REPORT DAMAGED)
        // ==========================================
        
        // Teknisi melapor router rusak di lapangan
        $resReport = $this->postJson('/api/assets/report-damaged', [
            'asset_id' => $serial->id,
            'quantity' => 1,
            'notes' => 'Mati total saat dipasang'
        ]);
        $resReport->assertStatus(200);

        $serial->refresh();
        // Cek sinkronisasi: status aset serial harusnya jadi "Rusak" atau minimal stock rusaknya bertambah
        $this->assertEquals(1, $serial->damaged_stock);
        
        $this->assertDatabaseHas('asset_transactions', [
            'asset_id' => $serial->id,
            'type' => 'Rusak',
            'quantity' => 1
        ]);
        
        // ==========================================
        // 5. HAPUS ASET
        // ==========================================
        $resDelete = $this->deleteJson('/api/assets/' . $consumable->id);
        $resDelete->assertStatus(200);
        $this->assertDatabaseMissing('assets', ['id' => $consumable->id]);
    }
}
