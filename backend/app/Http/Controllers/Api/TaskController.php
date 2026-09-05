<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Technician;
use App\Models\Customer;
use App\Models\Order;
use App\Models\Odp;
use App\Models\Asset;
use App\Models\AssetTransaction;

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Anti-Bom Waktu: Konversi Base64 Image menjadi file fisik di disk /public/media/tasks/
     * Mencegah database PostgreSQL jebol / memory exhaustion.
     */
    private function saveBase64Image($data, $prefix = 'task'): ?string
    {
        if (empty($data) || !is_string($data)) {
            return null;
        }

        // Jika sudah berupa URL biasa, return as is
        if (!str_starts_with($data, 'data:image/')) {
            return $data;
        }

        try {
            $mediaDir = public_path('media/tasks');
            if (!File::exists($mediaDir)) {
                File::makeDirectory($mediaDir, 0755, true);
            }

            // Extract mime type and base64 content
            preg_match('/^data:image\/(\w+);base64,/', $data, $matches);
            $extension = $matches[1] ?? 'jpg';
            if ($extension === 'jpeg') $extension = 'jpg';

            $dataClean = substr($data, strpos($data, ',') + 1);
            $decoded = base64_decode($dataClean);

            if ($decoded === false) {
                return null;
            }

            $filename = $prefix . '-' . time() . '-' . rand(1000, 9999) . '.' . $extension;
            $filePath = $mediaDir . '/' . $filename;

            file_put_contents($filePath, $decoded);

            return '/media/tasks/' . $filename;
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Gagal menyimpan file Base64 ke disk: ' . $e->getMessage());
            return null;
        }
    }

    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['technician', 'odp', 'customer', 'assetTransactions.asset']);

        if ($request->has('technician_id')) {
            $query->where('technician_id', $request->technician_id);
        }

        if ($request->has('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        $tasks = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tasks
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ticket_number' => 'required|string|unique:tasks,ticket_number',
            'type' => 'required|string',
            'title' => 'required|string',
            'description' => 'nullable|string',
            'technician_id' => 'nullable|exists:users,id',
            'odp_id' => 'nullable|exists:odps,id',
            'customer_id' => 'nullable|exists:customers,id',
        ]);

        if (isset($validated['customer_id']) && $validated['customer_id']) {
            $existingTask = Task::where('customer_id', $validated['customer_id'])
                ->whereIn('status', ['Menunggu', 'Pending', 'Dikerjakan', 'Diproses'])
                ->first();
                
            if ($existingTask) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pelanggan ini sudah memiliki tiket aktif #' . $existingTask->ticket_number . ' (Status: ' . $existingTask->status . ')'
                ], 422);
            }
        }

        $task = Task::create([
            'ticket_number' => $validated['ticket_number'],
            'type' => $validated['type'],
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'technician_id' => $validated['technician_id'] ?? null,
            'odp_id' => $validated['odp_id'] ?? null,
            'customer_id' => $validated['customer_id'] ?? null,
            'status' => 'Menunggu',
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        // Auto change technician status to Bertugas
        if ($task->technician_id) {
            $technician = Technician::find($task->technician_id);
            if ($technician) {
                $technician->update(['status' => 'Bertugas']);
            }
            \App\Models\User::where('id', $task->technician_id)->update(['status' => 'Bertugas']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Penugasan teknisi berhasil dibuat',
            'data' => $task
        ], 201);
    }

    public function startTask($id): JsonResponse
    {
        $task = Task::findOrFail($id);
        $task->update([
            'status' => 'Dikerjakan',
            'started_at' => Carbon::now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Tugas dimulai',
            'data' => $task
        ]);
    }

    public function completeTask(Request $request, $id): JsonResponse
    {
        $task = Task::findOrFail($id);
        
        // Validasi Wajib Serial Number Modem pada Pasang Baru
        if ($task->type === 'Pasang Baru' && empty($request->modem_sn)) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi Gagal: Nomor Seri (Serial Number / SN) Modem ONT wajib diisi atau di-scan untuk penugasan Pasang Baru!'
            ], 422);
        }

        // Anti-Bom 1: Konversi seluruh foto dokumentasi Base64 menjadi file fisik di disk
        $savedDocPhotos = [];
        $rawDocPhotos = $request->documentation_photos;
        if (is_array($rawDocPhotos)) {
            foreach ($rawDocPhotos as $idx => $photoItem) {
                $url = is_array($photoItem) ? ($photoItem['url'] ?? null) : $photoItem;
                $cat = is_array($photoItem) ? ($photoItem['category'] ?? 'dokumentasi') : 'dokumentasi';
                $label = is_array($photoItem) ? ($photoItem['label'] ?? ucfirst($cat)) : ucfirst($cat);

                if (!empty($url)) {
                    $savedUrl = $this->saveBase64Image($url, 'doc-' . $task->id . '-' . $cat . '-' . $idx);
                    $savedDocPhotos[] = [
                        'category' => $cat,
                        'label' => $label,
                        'url' => $savedUrl ?? $url
                    ];
                }
            }
        }

        // Anti-Bom 1b: Konversi bukti foto utama Base64 menjadi file fisik di disk
        $savedProofUrl = $this->saveBase64Image($request->proof_photo_url, 'proof-' . $task->id);

        if (!$savedProofUrl && !empty($savedDocPhotos)) {
            $savedProofUrl = $savedDocPhotos[0]['url'] ?? null;
        }

        if (empty($savedDocPhotos) && ($savedProofUrl || $task->proof_photo_url)) {
            $savedDocPhotos[] = [
                'category' => 'bukti_utama',
                'label' => 'Bukti Utama',
                'url' => $savedProofUrl ?? $task->proof_photo_url
            ];
        }

        try {
            // Anti-Bom 3: Database Transaction + Pessimistic Row Lock (Prevent Race Conditions on ODP Ports)
            DB::transaction(function () use ($request, $task, $savedProofUrl, $savedDocPhotos) {
                
                // Validasi ODP Port dengan Atomic Lock
                if ($request->odp_port && $request->odp_id) {
                    $portNumReq = (int) preg_replace('/[^0-9]/', '', $request->odp_port);
                    if ($portNumReq > 0) {
                        $isPortUsed = Customer::where('odp_id', $request->odp_id)
                            ->whereIn('status', ['Aktif', 'Isolir'])
                            ->where('id', '!=', $task->customer_id)
                            ->lockForUpdate()
                            ->get()
                            ->contains(function ($cust) use ($portNumReq) {
                                return (int) preg_replace('/[^0-9]/', '', $cust->odp_port) === $portNumReq;
                            });
                            
                        if ($isPortUsed) {
                            throw new \Exception("Port {$portNumReq} sudah terpakai oleh pelanggan lain di ODP ini!");
                        }
                    }
                }

                // Validasi Keunikan SN Modem pada Pelanggan Aktif
                if (!empty($request->modem_sn) && $task->type !== 'Pencabutan') {
                    $cleanSn = trim($request->modem_sn);
                    $existingWithSn = Customer::where('modem_sn', $cleanSn)
                        ->whereIn('status', ['Aktif', 'Isolir'])
                        ->where('id', '!=', $task->customer_id)
                        ->lockForUpdate()
                        ->first();
                        
                    if ($existingWithSn) {
                        throw new \Exception("Nomor Seri Modem \"{$cleanSn}\" saat ini masih terdaftar aktif pada pelanggan lain ({$existingWithSn->name})! Mohon periksa kembali nomor seri unit.");
                    }
                }

                $updatePayload = [
                    'status' => 'Selesai',
                    'completed_at' => Carbon::now(),
                    'modem_sn' => $request->modem_sn,
                    'kabel_fo_used' => $request->kabel_fo_used,
                    'technician_notes' => $request->technician_notes,
                    'documentation_photos' => !empty($savedDocPhotos) ? $savedDocPhotos : $task->documentation_photos,
                    'proof_photo_url' => $savedProofUrl ?? $task->proof_photo_url,
                    'odp_id' => $request->odp_id ?? $task->odp_id,
                    'odp_port' => $request->odp_port,
                    'redaman_dbm' => $request->redaman_dbm,
                    'additional_materials' => $request->additional_materials,
                    'latitude' => $request->latitude,
                    'longitude' => $request->longitude,
                ];

                $task->update($updatePayload);

                $oldOdpId = null;
                // 1. Update Customer Record
                if ($task->customer_id) {
                    $customer = Customer::lockForUpdate()->find($task->customer_id);
                    if ($customer) {
                        $oldOdpId = $customer->odp_id;
                        $isPencabutan = $task->type === 'Pencabutan';
                        
                        if ($isPencabutan) {
                            $custUpdate = [
                                'status' => 'Non-Aktif',
                                'odp_id' => null,
                                'odp_port' => null,
                                'modem_sn' => null
                            ];
                        } else {
                            $custUpdate = [
                                'status' => 'Aktif',
                                'odp_id' => $request->odp_id ?? $task->odp_id ?? $customer->odp_id,
                            ];
                            if ($request->odp_port) $custUpdate['odp_port'] = $request->odp_port;
                            if ($request->redaman_dbm) $custUpdate['redaman_dbm'] = $request->redaman_dbm;
                            if ($request->latitude) $custUpdate['latitude'] = $request->latitude;
                            if ($request->longitude) $custUpdate['longitude'] = $request->longitude;
                            if ($request->modem_sn) $custUpdate['modem_sn'] = $request->modem_sn;
                        }
                        
                        $customer->update($custUpdate);

                        // Also update any related order
                        Order::where('customer_id', $customer->id)
                            ->whereIn('status', ['Menunggu', 'Proses'])
                            ->update(['status' => 'Selesai']);
                    }
                }

                // 2. Update ODP Used Ports (Auto Recalculate & Release Port)
                $targetOdpId = $request->odp_id ?? $task->odp_id ?? $oldOdpId;
                if ($targetOdpId) {
                    $odp = Odp::lockForUpdate()->find($targetOdpId);
                    if ($odp) {
                        $activeCount = Customer::where('odp_id', $odp->id)->whereIn('status', ['Aktif', 'Isolir'])->count();
                        $odp->update([
                            'used_ports' => $activeCount,
                            'status' => ($activeCount >= $odp->total_ports) ? 'Penuh' : 'Aktif'
                        ]);
                    }
                }

                // 3. Deduct Warehouse Inventory (Assets)
                if ($request->has('additional_materials') && is_array($request->additional_materials)) {
                    foreach ($request->additional_materials as $item) {
                        if (!empty($item['asset_id']) && !empty($item['qty'])) {
                            $assetId = (int) $item['asset_id'];
                            $qty = (int) $item['qty'];
                            $asset = Asset::lockForUpdate()->find($assetId);
                            if ($asset && $qty > 0) {
                                $isCabutan = isset($item['stock_category']) && $item['stock_category'] === 'Cabutan';
                                $newAvailable = $asset->available_stock;
                                $newCabutan = $asset->cabutan_stock ?? 0;
                                
                                if ($isCabutan) {
                                    $newCabutan = max(0, $newCabutan - $qty);
                                } else {
                                    $newAvailable = max(0, $newAvailable - $qty);
                                }
                                
                                $newUsed = ($asset->used_stock ?? 0) + $qty;
                                $status = ($newAvailable == 0 && $newCabutan == 0) ? 'Habis' : (($newAvailable <= 2 && $newCabutan == 0) ? 'Menipis' : 'Tersedia');

                                $asset->update([
                                    'available_stock' => $newAvailable,
                                    'cabutan_stock' => $newCabutan,
                                    'used_stock' => $newUsed,
                                    'status' => $status,
                                ]);

                                $fieldTech = User::whereIn('role', ['teknisi', 'Teknisi'])->first();
                                $defaultTechId = $fieldTech ? $fieldTech->id : null;
                                $resolvedTechId = (!empty($task->technician_id) && $task->technician_id != 1) ? $task->technician_id : $defaultTechId;

                                AssetTransaction::create([
                                    'asset_id' => $assetId,
                                    'type' => 'Keluar',
                                    'quantity' => $qty,
                                    'notes' => 'Terpakai di penugasan #' . ($task->ticket_number ?? $task->id),
                                    'technician_id' => $resolvedTechId,
                                    'task_id' => $task->id,
                                ]);
                            }
                        }
                    }
                }

                // 3b. Update existing asset transactions for this task
                AssetTransaction::where('task_id', $task->id)
                    ->update([
                        'notes' => 'Terpasang otomatis di penugasan #' . ($task->ticket_number ?? $task->id)
                    ]);
                    
                AssetTransaction::where('technician_id', $task->technician_id)
                    ->where('notes', 'like', '%Diambil oleh teknisi%')
                    ->update([
                        'notes' => 'Terpasang otomatis di penugasan #' . ($task->ticket_number ?? $task->id)
                    ]);

                // 4. Record Dismantled Material Held by Technician (Pending Handover to Warehouse)
                if ($request->has('returned_materials') && is_array($request->returned_materials)) {
                    foreach ($request->returned_materials as $item) {
                        if (!empty($item['asset_id']) && !empty($item['qty'])) {
                            $assetId = (int) $item['asset_id'];
                            $qty = (int) $item['qty'];
                            $condition = $item['condition'] ?? 'Baik';
                            $hasAdaptor = !empty($item['has_adaptor']);
                            $sn = $item['serial_number'] ?? null;
                            
                            $asset = Asset::lockForUpdate()->find($assetId);
                            if ($asset && $qty > 0) {
                                $newUsed = max(0, ($asset->used_stock ?? 0) - $qty);
                                $asset->update(['used_stock' => $newUsed]);

                                $fieldTech = User::whereIn('role', ['teknisi', 'Teknisi'])->first();
                                $defaultTechId = $fieldTech ? $fieldTech->id : null;
                                $resolvedTechId = (!empty($task->technician_id) && $task->technician_id != 1) ? $task->technician_id : $defaultTechId;

                                AssetTransaction::create([
                                    'asset_id' => $assetId,
                                    'type' => 'Kembali',
                                    'quantity' => $qty,
                                    'serial_number' => $sn,
                                    'notes' => '[STATUS:DI_TEKNISI] Ditarik dari pelanggan di penugasan #' . ($task->ticket_number ?? $task->id) . ' | Kondisi: ' . $condition . ' | Adaptor: ' . ($hasAdaptor ? 'Lengkap' : 'Tidak'),
                                    'technician_id' => $resolvedTechId,
                                    'task_id' => $task->id,
                                ]);
                            }
                        }
                    }
                }

                // 5. Update Technician Status
                if ($task->technician_id) {
                    $technician = Technician::find($task->technician_id);
                    if ($technician) {
                        $technician->update(['status' => 'Tersedia']);
                    }
                    \App\Models\User::where('id', $task->technician_id)->update(['status' => 'Aktif']);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Tugas berhasil diselesaikan, ODP & Stok Aset otomatis terupdate dengan aman!',
                'data' => $task->fresh(['technician', 'odp', 'customer'])
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyelesaikan tugas: ' . $e->getMessage()
            ], 422);
        }
    }

    public function show($id): JsonResponse
    {
        try {
            $task = Task::with(['technician', 'odp', 'customer', 'assetTransactions.asset'])->find($id);
            if (!$task) {
                return response()->json(['success' => false, 'message' => 'Tugas tidak ditemukan'], 404);
            }
            return response()->json(['success' => true, 'data' => $task]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function reportEscalation(Request $request, $id): JsonResponse
    {
        try {
            $task = Task::findOrFail($id);
            $validated = $request->validate([
                'technician_notes' => 'nullable|string',
                'needed_materials' => 'nullable|array',
                'proof_photo_url' => 'nullable|string'
            ]);

            $savedProof = $this->saveBase64Image($validated['proof_photo_url'] ?? null, 'escalate-' . $task->id);

            $notes = "⚠️ LAPORAN GANGGUAN (MEMBUTUHKAN PERGANTIAN BARANG):\n" . ($validated['technician_notes'] ?? 'Teknisi melaporkan butuh suku cadang/perangkat pengganti.');
            if (!empty($validated['needed_materials'])) {
                $notes .= "\nKebutuhan Material: " . json_encode($validated['needed_materials'], JSON_UNESCAPED_UNICODE);
            }

            $task->update([
                'status' => 'Menunggu',
                'technician_notes' => $notes,
                'proof_photo_url' => $savedProof ?? $task->proof_photo_url,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Laporan kebutuhan pergantian barang berhasil dikirim ke Admin! Status tugas beralih ke Menunggu Persetujuan.',
                'data' => $task
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal eskalasi tugas: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id): JsonResponse
    {
        try {
            $task = Task::find($id);
            if (!$task) {
                return response()->json(['success' => false, 'message' => 'Tugas tidak ditemukan'], 404);
            }

            // Validasi: Perubahan detail hanya diizinkan jika status tugas belum selesai
            if ($task->status === 'Selesai' && !$request->has('force_admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas yang sudah selesai tidak dapat diubah kembali.'
                ], 422);
            }

            $updateData = [];
            if ($request->has('technician_id')) $updateData['technician_id'] = $request->technician_id;
            if ($request->has('odp_id')) $updateData['odp_id'] = $request->odp_id;
            if ($request->has('customer_id')) $updateData['customer_id'] = $request->customer_id;
            if ($request->has('type')) $updateData['type'] = $request->type;
            if ($request->has('priority')) $updateData['priority'] = $request->priority;
            if ($request->has('status')) $updateData['status'] = $request->status;
            if ($request->has('notes')) $updateData['notes'] = $request->notes;
            if ($request->has('problem_description')) $updateData['problem_description'] = $request->problem_description;
            if ($request->has('scheduled_date')) $updateData['scheduled_date'] = $request->scheduled_date;

            if (!empty($updateData)) {
                $task->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data penugasan berhasil diperbarui!',
                'data' => Task::find($id)
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal update penugasan: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id): JsonResponse
    {
        try {
            $task = Task::find($id);
            if (!$task) {
                return response()->json(['success' => false, 'message' => 'Tugas tidak ditemukan atau ID tidak valid'], 404);
            }

            // Validasi: Pembatalan tugas hanya diizinkan jika status belum selesai
            if ($task->status === 'Selesai') {
                return response()->json([
                    'success' => false,
                    'message' => 'Tugas yang sudah selesai tidak dapat dibatalkan.'
                ], 422);
            }
            
            if ($task->customer_id) {
                \App\Models\Order::where('customer_id', $task->customer_id)
                    ->whereIn('status', ['Diproses', 'Proses'])
                    ->update([
                        'status' => 'Menunggu',
                        'assigned_technician_id' => null,
                    ]);
            }
            $task->delete();
            
            return response()->json(['success' => true, 'message' => 'Tugas berhasil dibatalkan']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal membatalkan tugas: ' . $e->getMessage()], 500);
        }
    }
}
