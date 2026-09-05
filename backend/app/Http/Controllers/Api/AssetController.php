<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Asset;
use App\Models\AssetTransaction;
use App\Models\Task;
use App\Models\Technician;
use App\Models\User;
use App\Models\Customer;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class AssetController extends Controller
{
    public function index()
    {
        try {
            $assets = Asset::orderBy('id', 'desc')->get();
            return response()->json([
                'success' => true,
                'data' => $assets
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve asset data: ' . $e->getMessage()
            ], 500);
        }
    }

    public function getAssetItems($id)
    {
        try {
            $items = AssetTransaction::with(['technician', 'task.customer'])
                ->where('asset_id', $id)
                ->whereNotNull('serial_number')
                ->where('serial_number', '!=', '')
                ->orderBy('id', 'desc')
                ->get()
                ->map(function($tx) {
                    $notes = $tx->notes ?? '';
                    
                    // 1. Year
                    $year = $tx->year;
                    if (!$year && preg_match('/Tahun[^\d]*(\d{4})/i', $notes, $m)) {
                        $year = $m[1];
                    }
                    if (!$year && $tx->created_at) {
                        $year = date('Y', strtotime($tx->created_at));
                    }
                    if (!$year) {
                        $year = '2026';
                    }
                    
                    // 2. Condition
                    $condition = 'Baru';
                    if (preg_match('/\[KONDISI:\s*([^\]]+)\]/i', $notes, $cm)) {
                        $c = strtoupper(trim($cm[1]));
                        if (str_contains($c, 'RUSAK')) {
                            $condition = 'Rusak';
                        } elseif (str_contains($c, 'CABUTAN') || str_contains($c, 'RTS') || str_contains($c, 'BEKAS')) {
                            $condition = 'Cabutan (RTS)';
                        } else {
                            $condition = 'Baru';
                        }
                    } elseif ($tx->type === 'Rusak' || str_contains(strtolower($notes), 'rusak')) {
                        $condition = 'Rusak';
                    } elseif ($tx->type === 'Cabutan' || str_contains(strtolower($notes), 'cabutan')) {
                        $condition = 'Cabutan (RTS)';
                    }
                    
                    // 3. Location / Keberadaan
                    $location = null;
                    if (preg_match('/\[LOKASI:\s*([^\]]+)\]/i', $notes, $lm)) {
                        $location = trim($lm[1]);
                    }
                    if (!$location) {
                        $isTaskCompleted = $tx->task && in_array($tx->task->status, ['Selesai', 'Completed', 'Terpasang']);
                        $isExplicitlyInstalled = str_contains(strtolower($notes), 'terpasang') || str_contains(strtolower($notes), '[status:terpasang]');
                        $isInstalled = $isTaskCompleted || ($tx->type === 'Keluar' && $isExplicitlyInstalled);
                        $isCarriedByTech = $tx->type === 'Keluar' && !$isInstalled;
                        $techName = $tx->technician ? $tx->technician->name : 'Teknisi Lapangan';

                        $location = $isInstalled 
                            ? ($tx->task?->customer?->address ?? 'Lokasi Pelanggan') 
                            : ($isCarriedByTech ? "Dibawa Teknisi ({$techName})" : 'Gudang Utama');
                    }

                    // 4. Status
                    $statusLabel = null;
                    if (preg_match('/\[STATUS:\s*([^\]]+)\]/i', $notes, $sm)) {
                        $statusLabel = trim($sm[1]);
                    }
                    if (!$statusLabel) {
                        $isTaskCompleted = $tx->task && in_array($tx->task->status, ['Selesai', 'Completed', 'Terpasang']);
                        $isExplicitlyInstalled = str_contains(strtolower($notes), 'terpasang') || str_contains(strtolower($notes), '[status:terpasang]');
                        $isInstalled = $isTaskCompleted || ($tx->type === 'Keluar' && $isExplicitlyInstalled);
                        $isCarriedByTech = $tx->type === 'Keluar' && !$isInstalled;

                        if ($isInstalled) {
                            $statusLabel = 'Terpasang di Pelanggan';
                        } elseif ($isCarriedByTech) {
                            $statusLabel = 'Dibawa Teknisi';
                        } elseif ($condition === 'Rusak') {
                            $statusLabel = 'Rusak';
                        } else {
                            $statusLabel = 'Ready di Gudang';
                        }
                    }
                    
                    return [
                        'id' => $tx->id,
                        'serial_number' => $tx->serial_number,
                        'sn' => $tx->serial_number,
                        'year' => (string)$year,
                        'tahun' => (string)$year,
                        'status' => $statusLabel,
                        'mac_address' => '-',
                        'location' => $location,
                        'keberadaan' => $location,
                        'created_at' => $tx->created_at ? $tx->created_at->toISOString() : now()->toISOString(),
                        'condition' => $condition,
                        'kondisi' => $condition
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $items
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load serialized items: ' . $e->getMessage()
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'category' => 'nullable|string|max:100',
                'brand' => 'nullable|string|max:100',
                'serial_numbers' => 'nullable|array',
                'stock_type' => 'nullable|string|max:50',
                'total_stock' => 'nullable|integer|min:0',
                'year' => 'nullable|string|max:20',
                'notes' => 'nullable|string',
                'created_at' => 'nullable|string',
            ]);

            $entryDate = $request->input('created_at') ?? ($request->input('tanggalMasuk') ?? ($request->input('tanggal_masuk') ?? null));
            $parsedDate = now();
            if (!empty($entryDate)) {
                try {
                    $parsedDate = \Carbon\Carbon::parse($entryDate);
                } catch (\Exception $e) {
                    $parsedDate = now();
                }
            }

            $year = $request->input('year') ?? ($request->input('tahunPembuatan') ?? ($request->input('tahun') ?? null));
            if (!$year && !empty($request->notes) && preg_match('/Tahun[^\d]*(\d{4})/i', $request->notes, $m)) {
                $year = $m[1];
            }
            if (!$year) {
                $year = $parsedDate ? $parsedDate->format('Y') : date('Y');
            }

            $totalStock = isset($validated['total_stock']) ? (int)$validated['total_stock'] : 0;
            $cleanSerials = [];
            if (!empty($validated['serial_numbers']) && is_array($validated['serial_numbers'])) {
                foreach ($validated['serial_numbers'] as $sn) {
                    $c = trim($sn);
                    if (!empty($c)) {
                        $cleanSerials[] = $c;
                    }
                }
            }

            // 1. Check if there are duplicate serial numbers in the input payload
            if (!empty($cleanSerials)) {
                $duplicatesInBatch = array_diff_assoc($cleanSerials, array_unique($cleanSerials));
                if (!empty($duplicatesInBatch)) {
                    $dupVal = reset($duplicatesInBatch);
                    return response()->json([
                        'success' => false,
                        'message' => "Serial Number '{$dupVal}' terduplikasi dalam daftar input yang sama!"
                    ], 422);
                }

                // 2. Check if any serial number already exists in the database
                $existingTx = AssetTransaction::whereIn('serial_number', $cleanSerials)
                    ->with('asset')
                    ->first();

                if ($existingTx) {
                    $assetName = $existingTx->asset ? $existingTx->asset->name : 'Aset Gudang';
                    return response()->json([
                        'success' => false,
                        'message' => "Serial Number '{$existingTx->serial_number}' sudah terdaftar dalam sistem (pada: {$assetName})! Serial Number harus unik dan tidak boleh duplikat."
                    ], 422);
                }

                if (Schema::hasColumn('assets', 'serial_number')) {
                    $existingAssetSn = Asset::whereIn('serial_number', $cleanSerials)->first();
                    if ($existingAssetSn) {
                        return response()->json([
                            'success' => false,
                            'message' => "Serial Number '{$existingAssetSn->serial_number}' sudah digunakan pada aset {$existingAssetSn->name}!"
                        ], 422);
                    }
                }
            }

            $cleanName = trim($validated['name']);
            $existingAsset = null;
            if (!empty($cleanName)) {
                $existingAsset = Asset::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($cleanName)])->first();
            }

            if ($existingAsset) {
                $newTotal = $existingAsset->total_stock + $totalStock;
                $newAvailable = $existingAsset->available_stock + $totalStock;
                $status = $newAvailable <= 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');

                $existingAsset->update([
                    'total_stock' => $newTotal,
                    'available_stock' => $newAvailable,
                    'status' => $status,
                ]);
                
                $asset = $existingAsset;
            } else {
                $status = $totalStock <= 0 ? 'Habis' : ($totalStock <= 2 ? 'Menipis' : 'Tersedia');
                
                $asset = Asset::create([
                    'name' => $cleanName,
                    'category' => $validated['category'] ?? 'General',
                    'brand' => $validated['brand'] ?? 'General',
                    'stock_type' => $validated['stock_type'] ?? 'Unit',
                    'total_stock' => $totalStock,
                    'available_stock' => $totalStock,
                    'used_stock' => 0,
                    'damaged_stock' => 0,
                    'status' => $status,
                    'created_at' => $parsedDate,
                    'updated_at' => $parsedDate,
                ]);
            }

            if (!empty($cleanSerials)) {
                foreach ($cleanSerials as $cleanSn) {
                    AssetTransaction::create([
                        'asset_id' => $asset->id,
                        'type' => 'Masuk',
                        'quantity' => 1,
                        'serial_number' => $cleanSn,
                        'year' => (string)$year,
                        'notes' => "Restock barang masuk (SN: {$cleanSn}, Tahun Pembuatan: {$year})",
                        'created_at' => $parsedDate,
                        'updated_at' => $parsedDate,
                    ]);
                }
            } elseif ($totalStock > 0) {
                AssetTransaction::create([
                    'asset_id' => $asset->id,
                    'type' => 'Masuk',
                    'quantity' => $totalStock,
                    'year' => (string)$year,
                    'notes' => $existingAsset ? "Penambahan stok aset gudang (Tahun: {$year})" : "Stok awal gudang masuk (Tahun: {$year})",
                    'created_at' => $parsedDate,
                    'updated_at' => $parsedDate,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => $existingAsset ? 'Stok aset berhasil ditambahkan!' : 'Aset baru berhasil didaftarkan ke katalog!',
                'data' => $asset->fresh()
            ], ($existingAsset ? 200 : 201));

        } catch (\Illuminate\Validation\ValidationException $ve) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal: ' . implode(', ', array_map(fn($e) => implode(', ', $e), $ve->errors())),
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan pada database: ' . $e->getMessage()
            ], 500);
        }
    }

    public function addStock(Request $request)
    {
        return $this->store($request);
    }

    public function takeAsset(Request $request)
    {
        try {
            $validated = $request->validate([
                'asset_id' => 'required|integer',
                'technician_id' => 'nullable|integer',
                'task_id' => 'nullable|integer',
                'quantity' => 'required|integer|min:1',
                'serial_number' => 'nullable|string',
            ]);

            $asset = Asset::find($validated['asset_id']);
            if (!$asset || $asset->available_stock < $validated['quantity']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Stok aset tidak mencukupi atau aset tidak ditemukan!'
                ], 400);
            }

            $newAvailable = max(0, $asset->available_stock - $validated['quantity']);
            $newUsed = ($asset->used_stock ?? 0) + $validated['quantity'];
            $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');

            $asset->update([
                'available_stock' => $newAvailable,
                'used_stock' => $newUsed,
                'status' => $status,
            ]);

            $fieldTech = User::whereIn('role', ['teknisi', 'Teknisi'])->first();
            $defaultTechId = $fieldTech ? $fieldTech->id : null;
            $finalTechId = (!empty($validated['technician_id']) && $validated['technician_id'] != 1) ? $validated['technician_id'] : $defaultTechId;

            AssetTransaction::create([
                'asset_id' => $asset->id,
                'type' => 'Keluar',
                'quantity' => $validated['quantity'],
                'notes' => 'Diambil oleh teknisi untuk penugasan lapangan',
                'technician_id' => $finalTechId,
                'task_id' => $validated['task_id'] ?? null,
                'serial_number' => $validated['serial_number'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Aset berhasil diambil oleh teknisi!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to check out asset: ' . $e->getMessage()
            ], 500);
        }
    }

    public function reportDamaged(Request $request)
    {
        try {
            $validated = $request->validate([
                'asset_id' => 'required|integer',
                'technician_id' => 'nullable|integer',
                'quantity' => 'required|integer|min:1',
                'notes' => 'nullable|string'
            ]);

            $asset = Asset::find($validated['asset_id']);
            if (!$asset) {
                return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan!'], 404);
            }

            $newDamaged = ($asset->damaged_stock ?? 0) + $validated['quantity'];
            $newAvailable = max(0, $asset->available_stock - $validated['quantity']);
            $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');

            $asset->update([
                'available_stock' => $newAvailable,
                'damaged_stock' => $newDamaged,
                'status' => $status,
            ]);

            AssetTransaction::create([
                'asset_id' => $asset->id,
                'type' => 'Rusak',
                'quantity' => $validated['quantity'],
                'notes' => $validated['notes'] ?? 'Dilaporkan rusak/faulty dari lapangan',
                'technician_id' => $validated['technician_id'] ?? 1,
                'serial_number' => $asset->serial_number ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Laporan aset rusak berhasil dicatat!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to record damaged asset: ' . $e->getMessage()
            ], 500);
        }
    }

    public function scrapDamaged(Request $request)
    {
        try {
            $validated = $request->validate([
                'asset_id' => 'required|integer',
                'quantity' => 'required|integer|min:1',
                'notes' => 'nullable|string',
                'photo_url' => 'nullable|string'
            ]);

            $asset = Asset::find($validated['asset_id']);
            if (!$asset) {
                return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan!'], 404);
            }

            $currentDamaged = $asset->damaged_stock ?? 0;
            $qtyToScrap = min($currentDamaged, $validated['quantity']);

            if ($qtyToScrap <= 0) {
                return response()->json(['success' => false, 'message' => 'No damaged inventory available for disposal.'], 422);
            }

            $newDamaged = max(0, $currentDamaged - $qtyToScrap);
            $newTotal = max(0, ($asset->total_stock ?? 0) - $qtyToScrap);

            $asset->update([
                'damaged_stock' => $newDamaged,
                'total_stock' => $newTotal,
            ]);

            AssetTransaction::create([
                'asset_id' => $asset->id,
                'type' => 'Rusak',
                'quantity' => $qtyToScrap,
                'notes' => 'Berita Acara Pemusnahan Aset Rusak (>90 Hari): ' . ($validated['notes'] ?? 'Audit logistik berkala'),
                'technician_id' => $request->user_id ?? 1,
            ]);

            return response()->json([
                'success' => true,
                'message' => "Berhasil memusnahkan {$qtyToScrap} unit aset rusak sesuai Berita Acara Audit!"
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process asset disposal: ' . $e->getMessage()
            ], 500);
        }
    }

    public function uploadAssetPhoto(Request $request)
    {
        try {
            $assetId = $request->input('asset_id');
            $category = $request->input('category', 'kerusakan');
            $notes = $request->input('notes', 'Foto bukti inspeksi logistik');
            $photoBase64 = $request->input('photo') ?? ($request->input('photo_url') ?? $request->input('photo_base64'));

            $savedUrl = null;
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                $filename = 'asset-' . ($assetId ?? 'gen') . '-' . time() . '-' . rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
                $destPath = public_path('media/assets');
                if (!file_exists($destPath)) {
                    mkdir($destPath, 0755, true);
                }
                $file->move($destPath, $filename);
                $savedUrl = '/media/assets/' . $filename;
            } elseif (!empty($photoBase64) && str_starts_with($photoBase64, 'data:image')) {
                $destPath = public_path('media/assets');
                if (!file_exists($destPath)) {
                    mkdir($destPath, 0755, true);
                }
                preg_match('/data:image\/([a-zA-Z0-9]+);base64,/', $photoBase64, $matches);
                $ext = $matches[1] ?? 'jpg';
                if ($ext === 'jpeg') $ext = 'jpg';
                $cleanData = preg_replace('/data:image\/[a-zA-Z0-9]+;base64,/', '', $photoBase64);
                $decoded = base64_decode($cleanData);
                if ($decoded !== false) {
                    $filename = 'asset-' . ($assetId ?? 'gen') . '-' . time() . '-' . rand(1000, 9999) . '.' . $ext;
                    file_put_contents($destPath . '/' . $filename, $decoded);
                    $savedUrl = '/media/assets/' . $filename;
                }
            }

            if (!$savedUrl && !empty($photoBase64)) {
                $savedUrl = $photoBase64;
            }

            if ($assetId) {
                AssetTransaction::create([
                    'asset_id' => $assetId,
                    'type' => 'Rusak',
                    'quantity' => 1,
                    'notes' => "[FOTO: {$savedUrl}] [KATEGORI: {$category}] " . $notes,
                    'technician_id' => 1,
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Foto bukti berhasil disimpan!',
                'photo_url' => $savedUrl
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload verification photo: ' . $e->getMessage()
            ], 500);
        }
    }

    public function transactions(Request $request)
    {
        try {
            $query = AssetTransaction::with(['asset', 'technician', 'task.customer'])->orderBy('id', 'desc');
            
            if ($request->has('asset_id') && !empty($request->asset_id)) {
                $query->where('asset_id', $request->asset_id);
            }
            
            if ($request->has('type') && !empty($request->type)) {
                if ($request->type === 'Rusak') {
                    $query->where(function($q) {
                        $q->where('type', 'Rusak')
                          ->orWhere('notes', 'like', '%rusak%')
                          ->orWhere('notes', 'like', '%Rusak%');
                    });
                } else {
                    $query->where('type', $request->type);
                }
            }
            
            $transactions = $query->get();
            $activeTechIds = Task::whereNotIn('status', ['Selesai', 'Completed', 'Terpasang'])->pluck('technician_id')->unique()->toArray();

            $result = $transactions->map(function($tx) use ($activeTechIds) {
                $asset = $tx->asset;
                $task = $tx->task;
                
                // Fallback check task from notes if task relation is null
                if (!$task && !empty($tx->notes) && preg_match('/#(TK-[A-Za-z0-9\-]+)/', $tx->notes, $matches)) {
                    $task = Task::where('ticket_number', $matches[1])->first();
                }

                // Strictly resolve to a technician account (never an admin)
                $assignedTech = null;
                if ($task && $task->technician_id) {
                    $assignedTech = User::where('id', $task->technician_id)->whereIn('role', ['teknisi', 'Teknisi'])->first();
                }

                if (!$assignedTech && $tx->technician_id) {
                    $assignedTech = User::where('id', $tx->technician_id)->whereIn('role', ['teknisi', 'Teknisi'])->first();
                }

                // Fallback to the active field technician if assigned was admin or missing
                if (!$assignedTech) {
                    $assignedTech = User::whereIn('role', ['teknisi', 'Teknisi'])->first();
                }

                $techName = $assignedTech ? $assignedTech->name : 'Teknisi Lapangan';
                $techId = $assignedTech ? $assignedTech->id : null;
                $techEmail = $assignedTech ? $assignedTech->email : null;
                $techPhone = $assignedTech ? ($assignedTech->phone ?? null) : null;

                // Sync database if technician_id was wrongly pointing to an admin
                if ($assignedTech && $tx->technician_id !== $assignedTech->id) {
                    $tx->update(['technician_id' => $assignedTech->id]);
                }

                $customer = null;
                if ($task && $task->customer) {
                    $customer = $task->customer;
                }
                
                if (!$customer && $task && $task->customer_id) {
                    $customer = \App\Models\Customer::find($task->customer_id);
                }

                if (!$customer && !empty($tx->serial_number) && Schema::hasColumn('customers', 'modem_sn')) {
                    $customer = \App\Models\Customer::where('modem_sn', $tx->serial_number)->first();
                }

                if (!$customer && $task && !empty($task->title)) {
                    $possibleName = trim(preg_replace('/^(Penugasan\s+)?(Pasang Baru|Perbaikan|Pemeliharaan|Pencabutan|Pembangunan)(\s*-\s*)?/i', '', $task->title));
                    if (!empty($possibleName)) {
                        $customer = \App\Models\Customer::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($possibleName)])->first();
                    }
                }

                if (!$customer && !empty($tx->notes) && preg_match('/(?:pelanggan|customer|lokasi)\s*[:\-]?\s*([A-Za-z0-9\s]+)/i', $tx->notes, $matchCust)) {
                    $candName = trim($matchCust[1]);
                    $customer = \App\Models\Customer::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($candName)])->first();
                }

                $customerName = $customer ? $customer->name : ($task->customer_name ?? ($task && $task->title ? $task->title : '-'));
                if ($customerName === '-' && !empty($tx->notes) && str_contains($tx->notes, 'Otomatis')) {
                    $customerName = 'Pelanggan Operasional';
                }

                $isInstalled = false;
                if ($task) {
                    if (in_array($task->status, ['Selesai', 'Completed', 'Terpasang'])) {
                        $isInstalled = true;
                    } else {
                        $isInstalled = false;
                    }
                } elseif (!empty($tx->notes) && (str_contains(strtolower($tx->notes), '[status:terpasang]') || str_contains(strtolower($tx->notes), 'terpasang resmi di pelanggan'))) {
                    $isInstalled = true;
                } else {
                    $isInstalled = false;
                }

                $year = $tx->year ?? (preg_match('/Tahun[^\d]*(\d{4})/i', $tx->notes ?? '', $m) ? $m[1] : (date('Y', strtotime($tx->created_at))));
                $txArray = $tx->toArray();
                $txArray['year'] = (string)$year;
                $txArray['tahun'] = (string)$year;
                $txArray['serial_number'] = $tx->serial_number ?? ($asset ? ($asset->serial_number ?? null) : null);
                $txArray['sn'] = $txArray['serial_number'];
                $txArray['asset_name'] = $asset ? ($asset->name ?? 'Aset Gudang') : 'Aset Gudang';
                $txArray['asset_brand'] = $asset ? ($asset->brand ?? 'General') : 'General';
                $txArray['asset_category'] = $asset ? ($asset->category ?? 'Consumable') : 'Consumable';
                $txArray['asset_type'] = $asset ? ($asset->stock_type ?? 'Unit') : 'Unit';
                $txArray['asset_unit'] = $txArray['asset_type'];
                $txArray['asset_serial'] = $txArray['serial_number'];
                $txArray['technician_name'] = $techName;
                $txArray['technician_id'] = $techId;
                $txArray['technician_email'] = $techEmail;
                $txArray['technician_phone'] = $techPhone;
                $txArray['technician'] = $assignedTech ? $assignedTech->toArray() : null;
                $txArray['customer_name'] = $customerName;
                $txArray['customer_id'] = $customer ? $customer->id : ($task ? $task->customer_id : null);
                $txArray['customer'] = $customer ? $customer->toArray() : null;
                $txArray['status_label'] = $isInstalled ? 'Terpasang' : 'Dibawa Teknisi';
                $txArray['status'] = $txArray['status_label'];
                
                $photoUrl = null;
                if ($task && !empty($task->proof_photo_url) && !str_starts_with($task->proof_photo_url, 'blob:')) {
                    $photoUrl = $task->proof_photo_url;
                }
                
                if (empty($photoUrl)) {
                    if ($tx->technician_id != null && $tx->type === 'Masuk') {
                        $photos = [
                            '/lampiran-ont.svg',
                            '/lampiran-fo.svg',
                            '/lampiran-router.svg'
                        ];
                        $photoUrl = $photos[$tx->id % 3];
                    } elseif ($tx->type === 'Keluar' && $isInstalled) {
                        $photoUrl = '/lampiran-fo.svg';
                    }
                }
                $txArray['photo_url'] = $photoUrl;
                
                return $txArray;
            });

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve transaction history: ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $asset = Asset::find($id);
            if (!$asset) {
                return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
            }
            return response()->json(['success' => true, 'data' => $asset]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $asset = Asset::find($id);
            if (!$asset) {
                return response()->json(['success' => false, 'message' => 'Aset tidak ditemukan'], 404);
            }

            $updateData = [];
            if ($request->has('name')) {
                $newName = trim($request->name);
                $duplicate = Asset::whereRaw('LOWER(TRIM(name)) = ?', [strtolower($newName)])
                    ->where('id', '!=', $id)
                    ->first();
                if ($duplicate) {
                    return response()->json([
                        'success' => false,
                        'message' => "Nama aset '{$newName}' sudah terdaftar dalam katalog pada ID #{$duplicate->id} (huruf besar/kecil dianggap sama)."
                    ], 422);
                }
                $updateData['name'] = $newName;
            }
            if ($request->has('category')) $updateData['category'] = $request->category;
            if ($request->has('brand') && Schema::hasColumn('assets', 'brand')) $updateData['brand'] = $request->brand;
            if ($request->has('serial_number') && Schema::hasColumn('assets', 'serial_number')) $updateData['serial_number'] = $request->serial_number;
            if ($request->has('stock_type') && Schema::hasColumn('assets', 'stock_type')) $updateData['stock_type'] = $request->stock_type;
            if ($request->has('total_stock')) $updateData['total_stock'] = (int) $request->total_stock;
            if ($request->has('available_stock')) $updateData['available_stock'] = (int) $request->available_stock;
            if ($request->has('used_stock')) $updateData['used_stock'] = (int) $request->used_stock;
            if ($request->has('damaged_stock')) $updateData['damaged_stock'] = (int) $request->damaged_stock;
            if ($request->has('status')) $updateData['status'] = $request->status;

            if (!empty($updateData)) {
                $asset->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Asset details successfully updated.',
                'data' => $asset->fresh()
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update asset: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            Asset::destroy($id);
            return response()->json(['success' => true, 'message' => 'Asset successfully deleted.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete asset: ' . $e->getMessage()], 500);
        }
    }

    public function updateTransaction(Request $request, $id)
    {
        try {
            $tx = AssetTransaction::find($id);
            if (!$tx) return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);

            $newQty = (int) $request->quantity;
            if ($newQty < 0) return response()->json(['success' => false, 'message' => 'Quantity tidak valid'], 400);

            $diff = $newQty - $tx->quantity;

            if ($diff != 0) {
                $asset = $tx->asset;
                if ($asset) {
                    if ($tx->type === 'Masuk') {
                        $newTotal = $asset->total_stock + $diff;
                        $newAvailable = $asset->available_stock + $diff;
                        $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');
                        $asset->update([
                            'total_stock' => max(0, $newTotal),
                            'available_stock' => max(0, $newAvailable),
                            'status' => $status
                        ]);
                    } elseif ($tx->type === 'Keluar') {
                        $newAvailable = $asset->available_stock - $diff;
                        $newUsed = $asset->used_stock + $diff;
                        $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');
                        $asset->update([
                            'available_stock' => max(0, $newAvailable),
                            'used_stock' => max(0, $newUsed),
                            'status' => $status
                        ]);
                    }
                }
                
                $tx->update(['quantity' => $newQty]);
            }

            return response()->json(['success' => true, 'message' => 'Transaksi berhasil diupdate']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update transaction: ' . $e->getMessage()], 500);
        }
    }

    public function destroyTransaction($id)
    {
        try {
            $tx = AssetTransaction::find($id);
            if (!$tx) return response()->json(['success' => false, 'message' => 'Transaksi tidak ditemukan'], 404);

            $asset = $tx->asset;
            if ($asset) {
                if ($tx->type === 'Masuk') {
                    $newTotal = $asset->total_stock - $tx->quantity;
                    $newAvailable = $asset->available_stock - $tx->quantity;
                    $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');
                    $asset->update([
                        'total_stock' => max(0, $newTotal),
                        'available_stock' => max(0, $newAvailable),
                        'status' => $status
                    ]);
                } elseif ($tx->type === 'Keluar') {
                    $newAvailable = $asset->available_stock + $tx->quantity;
                    $newUsed = $asset->used_stock - $tx->quantity;
                    $status = $newAvailable == 0 ? 'Habis' : ($newAvailable <= 2 ? 'Menipis' : 'Tersedia');
                    $asset->update([
                        'available_stock' => max(0, $newAvailable),
                        'used_stock' => max(0, $newUsed),
                        'status' => $status
                    ]);
                }
            }

            $tx->delete();
            return response()->json(['success' => true, 'message' => 'Transaksi berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete transaction: ' . $e->getMessage()], 500);
        }
    }

    public function checkSerial(Request $request)
    {
        $sn = trim($request->input('sn') ?? ($request->input('serial_number') ?? ''));
        if (empty($sn)) {
            return response()->json(['available' => true, 'exists' => false]);
        }

        $existingTx = AssetTransaction::where('serial_number', $sn)->with('asset')->first();
        if ($existingTx) {
            $assetName = $existingTx->asset ? $existingTx->asset->name : 'Aset Gudang';
            return response()->json([
                'available' => false,
                'exists' => true,
                'message' => "Serial Number '{$sn}' sudah terdaftar dalam sistem (pada: {$assetName})."
            ]);
        }

        if (Schema::hasColumn('assets', 'serial_number')) {
            $existingAsset = Asset::where('serial_number', $sn)->first();
            if ($existingAsset) {
                return response()->json([
                    'available' => false,
                    'exists' => true,
                    'message' => "Serial Number '{$sn}' sudah digunakan pada aset {$existingAsset->name}."
                ]);
            }
        }

        return response()->json([
            'available' => true,
            'exists' => false,
            'message' => "Serial Number '{$sn}' valid dan dapat digunakan."
        ]);
    }

    public function updateSerial(Request $request, $id = null)
    {
        try {
            $targetId = $id ?? $request->input('id');
            $oldSn = $request->input('old_sn');
            $newSn = $request->input('serial_number') ?? ($request->input('sn') ?? $request->input('new_sn'));
            $newYear = $request->input('year') ?? ($request->input('tahun') ?? null);
            $status = $request->input('status');

            if (!empty($newSn)) {
                $cleanNewSn = trim($newSn);
                $existingOtherTx = AssetTransaction::where('serial_number', $cleanNewSn)
                    ->when($targetId, function($q) use ($targetId) {
                        return $q->where('id', '!=', $targetId);
                    })
                    ->when(!$targetId && !empty($oldSn), function($q) use ($oldSn) {
                        return $q->where('serial_number', '!=', $oldSn);
                    })
                    ->first();

                if ($existingOtherTx) {
                    return response()->json([
                        'success' => false,
                        'message' => "Serial Number '{$cleanNewSn}' sudah digunakan oleh unit lain! Serial harus unik."
                    ], 422);
                }
            }
            
            $tx = null;
            if ($targetId) {
                $tx = AssetTransaction::find($targetId);
            }
            if (!$tx && !empty($oldSn)) {
                $tx = AssetTransaction::where('serial_number', $oldSn)->first();
            }
            
            $newCondition = $request->input('condition') ?? ($request->input('kondisi') ?? null);
            $newLocation = $request->input('location') ?? ($request->input('keberadaan') ?? null);
            $newStatus = $request->input('status');

            if ($tx) {
                if (!empty($newSn)) {
                    $tx->serial_number = trim($newSn);
                }
                if (!empty($newYear)) {
                    if (Schema::hasColumn('asset_transactions', 'year')) {
                        $tx->year = trim($newYear);
                    }
                    $tx->notes = preg_replace('/Tahun[^\d]*\d{4}/i', 'Tahun Pembuatan: ' . trim($newYear), $tx->notes ?? '');
                    if (!str_contains($tx->notes ?? '', 'Tahun Pembuatan:')) {
                        $tx->notes = trim(($tx->notes ?? '') . ' Tahun Pembuatan: ' . trim($newYear));
                    }
                }
                if (!empty($newCondition)) {
                    $cTrim = trim($newCondition);
                    $notes = $tx->notes ?? '';
                    $notes = preg_replace('/\[KONDISI:[^\]]+\]/i', '', $notes);
                    $notes = preg_replace('/Kondisi:[^\r\n,;]+/i', '', $notes);

                    if (str_contains(strtolower($cTrim), 'rusak')) {
                        $notes = trim($notes . ' [KONDISI: RUSAK] Kondisi: Rusak');
                    } elseif (str_contains(strtolower($cTrim), 'cabutan') || str_contains(strtolower($cTrim), 'bekas')) {
                        $notes = trim($notes . ' [KONDISI: CABUTAN] Kondisi: Cabutan (RTS)');
                    } else {
                        $notes = trim($notes . ' [KONDISI: BARU] Kondisi: Baru (Ready)');
                    }
                    $tx->notes = trim($notes);
                }
                if (!empty($newLocation)) {
                    $tx->notes = preg_replace('/\[LOKASI:[^\]]+\]/i', '', $tx->notes ?? '');
                    $tx->notes = trim(($tx->notes ?? '') . " [LOKASI: {$newLocation}]");
                }
                if (!empty($newStatus)) {
                    $tx->notes = preg_replace('/\[STATUS:[^\]]+\]/i', '', $tx->notes ?? '');
                    $tx->notes = trim(($tx->notes ?? '') . " [STATUS: {$newStatus}]");
                }
                $tx->save();

                // Recalculate parent asset stock counts
                if ($tx->asset_id) {
                    $parentAsset = Asset::find($tx->asset_id);
                    if ($parentAsset) {
                        $allTxs = AssetTransaction::where('asset_id', $parentAsset->id)->get();
                        $damaged = 0;
                        $cabutan = 0;
                        foreach ($allTxs as $t) {
                            $n = strtolower($t->notes ?? '');
                            $isDamaged = $t->type === 'Rusak' || str_contains($n, 'rusak') || str_contains($n, '[kondisi: rusak]');
                            $isCabutan = str_contains($n, 'cabutan') || str_contains($n, '[kondisi: cabutan]') || $t->type === 'Cabutan';
                            $qty = ($t->quantity ?: 1);

                            if ($isDamaged) {
                                $damaged += $qty;
                            } elseif ($isCabutan) {
                                $cabutan += $qty;
                            }
                        }
                        $parentAsset->damaged_stock = $damaged;
                        $parentAsset->cabutan_stock = $cabutan;
                        $parentAsset->available_stock = max(0, $parentAsset->total_stock - $damaged - $cabutan);
                        $parentAsset->save();
                    }
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Serial number, manufacture year, and condition updated successfully.',
                    'data' => $tx
                ]);
            }

            $assetQuery = Asset::query();
            if (!empty($oldSn)) {
                $assetQuery->where('serial_number', $oldSn);
            } elseif ($targetId) {
                $assetQuery->where('id', $targetId);
            }

            $asset = $assetQuery->first();
            if ($asset) {
                $updateData = [];
                if ($newSn !== null && Schema::hasColumn('assets', 'serial_number')) {
                    $updateData['serial_number'] = $newSn;
                }
                if ($status !== null && Schema::hasColumn('assets', 'status')) {
                    $updateData['status'] = $status;
                }
                if (!empty($updateData)) {
                    $asset->update($updateData);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Serial number dan status berhasil diperbarui',
                    'data' => $asset->fresh()
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Serialized item record not found.'], 404);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update serialized item: ' . $e->getMessage()], 500);
        }
    }

    public function getPendingHandovers()
    {
        try {
            $handovers = AssetTransaction::with(['asset', 'technician', 'task.customer'])
                ->where(function($q) {
                    $q->where('notes', 'like', '%[STATUS:DI_TEKNISI]%')
                      ->orWhere('notes', 'like', '%Pengembalian eks pencabutan%')
                      ->orWhere('notes', 'like', '%STATUS_HANDOVER:PENDING%');
                })
                ->where('notes', 'not like', '%[STATUS:DITERIMA_GUDANG]%')
                ->where('notes', 'not like', '%Diterima resmi di rak gudang%')
                ->orderBy('id', 'desc')
                ->get();

            $data = $handovers->map(function ($tx) {
                $isDamaged = str_contains(strtolower($tx->notes ?? ''), 'rusak');
                $hasAdaptor = !str_contains(strtolower($tx->notes ?? ''), 'adaptor: tidak');
                return [
                    'id' => $tx->id,
                    'asset_id' => $tx->asset_id,
                    'asset_name' => $tx->asset->name ?? 'Modem ONT',
                    'asset_brand' => $tx->asset->brand ?? 'ZTE',
                    'technician_id' => $tx->technician_id,
                    'technician_name' => $tx->technician->name ?? 'Teknisi Lapangan',
                    'customer_name' => $tx->task->customer->name ?? $tx->task->title ?? 'Pelanggan',
                    'customer_dusun' => $tx->task->customer->dusun ?? $tx->task->customer->address ?? 'Subang',
                    'ticket_number' => $tx->task->ticket_number ?? ('TK-' . $tx->task_id),
                    'serial_number' => $tx->serial_number ?? 'ZTE-F670L-CABUTAN',
                    'quantity' => $tx->quantity ?? 1,
                    'condition' => $isDamaged ? 'Rusak' : 'Baik',
                    'has_adaptor' => $hasAdaptor,
                    'pulled_at' => $tx->created_at ? $tx->created_at->format('Y-m-d H:i') : now()->format('Y-m-d H:i'),
                    'status' => 'Dipegang Teknisi'
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load asset handover list: ' . $e->getMessage()
            ], 500);
        }
    }

    public function receiveHandover(Request $request)
    {
        try {
            $validated = $request->validate([
                'transaction_id' => 'required|integer',
                'condition' => 'required|string|in:Baik,Rusak',
                'notes' => 'nullable|string'
            ]);

            $tx = AssetTransaction::with('asset')->findOrFail($validated['transaction_id']);
            $asset = $tx->asset;

            if (!$asset) {
                return response()->json(['success' => false, 'message' => 'Aset master tidak ditemukan!'], 404);
            }

            $qty = $tx->quantity > 0 ? $tx->quantity : 1;
            $condition = $validated['condition'];

            $newCabutan = $asset->cabutan_stock ?? 0;
            $newDamaged = $asset->damaged_stock ?? 0;

            if ($condition === 'Baik') {
                $newCabutan += $qty;
            } else {
                $newDamaged += $qty;
            }

            $asset->update([
                'cabutan_stock' => $newCabutan,
                'damaged_stock' => $newDamaged,
                'status' => 'Tersedia'
            ]);

            $tx->update([
                'notes' => '[STATUS:DITERIMA_GUDANG] Diterima resmi di rak gudang oleh Admin Logistik pada ' . now()->format('d/m/Y H:i') . ' (Kondisi: ' . $condition . '). ' . ($validated['notes'] ?? '')
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Perangkat berhasil diverifikasi dan masuk ke Stok ' . ($condition === 'Baik' ? 'Cabutan (RTS)' : 'Rusak') . ' Gudang!'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process asset handover: ' . $e->getMessage()
            ], 500);
        }
    }
}
