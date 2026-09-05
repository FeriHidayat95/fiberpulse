<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Odp;
use App\Models\Task;
use App\Models\Order;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Sanitasi format nomor telepon menjadi standar lokal (08xxx) atau angka murni.
     */
    private function sanitizePhone(?string $phone): ?string
    {
        if (empty($phone)) return null;
        $clean = preg_replace('/[^0-9]/', '', $phone);
        if (str_starts_with($clean, '628')) {
            $clean = '08' . substr($clean, 3);
        } elseif (str_starts_with($clean, '8') && strlen($clean) >= 9) {
            $clean = '0' . $clean;
        }
        return $clean;
    }

    /**
     * Otomatis hitung ulang dan sinkronkan used_ports pada ODP.
     */
    private function recalculateOdpPorts($odpId): void
    {
        if (!$odpId) return;
        $odp = Odp::find($odpId);
        if ($odp) {
            $activeCount = Customer::where('odp_id', $odp->id)
                ->whereIn('status', ['Aktif', 'Isolir'])
                ->count();
            $odp->update([
                'used_ports' => $activeCount,
                'status' => ($activeCount >= $odp->total_ports) ? 'Penuh' : 'Aktif'
            ]);
        }
    }

    public function index()
    {
        $customers = Customer::with('odp')->orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => $customers
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'nik' => 'required|string',
            'phone' => 'required|string',
            'address' => 'required|string',
            'dusun' => 'required|string',
            'package_speed' => 'required|string',
            'odp_id' => 'nullable|integer'
        ], [
            'nik.required' => 'Field NIK Pelanggan wajib diisi!'
        ]);

        $cleanPhone = $this->sanitizePhone($validated['phone']);

        $customer = Customer::create([
            'name' => $validated['name'],
            'nik' => trim($validated['nik']),
            'phone' => $cleanPhone,
            'address' => $validated['address'],
            'dusun' => $validated['dusun'],
            'package_speed' => $validated['package_speed'],
            'status' => 'Menunggu Pasang',
            'odp_id' => $validated['odp_id'] ?? null,
        ]);

        if (!empty($validated['odp_id'])) {
            $this->recalculateOdpPorts($validated['odp_id']);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pelanggan berhasil disimpan!',
            'data' => $customer
        ], 201);
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string'
        ]);

        $customer = Customer::findOrFail($id);
        $oldOdpId = $customer->odp_id;

        $customer->update([
            'status' => $validated['status']
        ]);

        if ($oldOdpId) {
            $this->recalculateOdpPorts($oldOdpId);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status pelanggan berhasil diperbarui!'
        ]);
    }

    public function show($id)
    {
        try {
            $customer = Customer::with(['odp', 'orders'])->find($id);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Pelanggan tidak ditemukan'], 404);
            }

            // 1. Orders History
            $orders = Order::where('customer_id', $customer->id)
                ->orWhere('phone', $customer->phone)
                ->orderBy('id', 'desc')
                ->get()
                ->map(function($o) {
                    return [
                        'id' => $o->id,
                        'order_number' => $o->order_number ?? ('ORD-' . date('Y', strtotime($o->created_at)) . '-' . str_pad($o->id, 3, '0', STR_PAD_LEFT)),
                        'service_type' => $o->service_type ?? ($o->package ?? 'Pemasangan'),
                        'package' => $o->package ?? '30 Mbps',
                        'date' => $o->created_at ? $o->created_at->format('Y-m-d') : date('Y-m-d'),
                        'status' => $o->status ?? 'Selesai'
                    ];
                });

            // If customer has no explicit orders yet, create a default installation order record representation
            if ($orders->isEmpty()) {
                $orders = collect([
                    [
                        'id' => $customer->id,
                        'order_number' => 'ORD-' . date('Y', strtotime($customer->created_at ?? now())) . '-' . str_pad($customer->id, 3, '0', STR_PAD_LEFT),
                        'service_type' => 'Pemasangan',
                        'package' => $customer->package_speed ?? '30 Mbps',
                        'date' => $customer->created_at ? $customer->created_at->format('Y-m-d') : date('Y-m-d'),
                        'status' => in_array($customer->status, ['Aktif', 'Terpasang']) ? 'Selesai' : ($customer->status ?? 'Selesai')
                    ]
                ]);
            }

            // 2. Installed Assets / Serials
            $installedAssets = collect();

            // Check AssetTransaction linked via tasks
            $txAssets = \App\Models\AssetTransaction::with('asset')
                ->whereHas('task', function($q) use ($customer) {
                    $q->where('customer_id', $customer->id);
                })
                ->whereNotNull('serial_number')
                ->where('serial_number', '!=', '')
                ->get();

            foreach ($txAssets as $tx) {
                $installedAssets->push([
                    'id' => $tx->id,
                    'name' => $tx->asset?->name ?? 'ONT Dual Band Wi-Fi 6 (ZTE)',
                    'brand' => $tx->asset?->brand ?? 'ZTE',
                    'serial_number' => $tx->serial_number,
                    'sn' => $tx->serial_number,
                    'type' => 'Serial',
                    'status' => 'Terpasang',
                    'installed_at' => $tx->created_at ? $tx->created_at->format('Y-m-d') : date('Y-m-d')
                ]);
            }

            // If customer has modem_sn recorded directly on customer table and not in transactions yet
            if (!empty($customer->modem_sn)) {
                $alreadyExists = $installedAssets->contains('serial_number', $customer->modem_sn);
                if (!$alreadyExists) {
                    $installedAssets->prepend([
                        'id' => 'modem-' . $customer->id,
                        'name' => 'ONT ZTE F670L',
                        'brand' => 'ZTE',
                        'serial_number' => $customer->modem_sn,
                        'sn' => $customer->modem_sn,
                        'type' => 'Serial',
                        'status' => 'Terpasang',
                        'installed_at' => $customer->created_at ? $customer->created_at->format('Y-m-d') : date('Y-m-d')
                    ]);
                }
            }

            // If still empty but customer is Aktif, provide the default ONT entry with generated SN if missing
            if ($installedAssets->isEmpty() && in_array($customer->status, ['Aktif', 'Isolir'])) {
                $fallbackSn = 'ZTEF670L-' . str_pad($customer->id, 3, '0', STR_PAD_LEFT);
                $installedAssets->push([
                    'id' => 'modem-default-' . $customer->id,
                    'name' => 'ONT ZTE F670L',
                    'brand' => 'ZTE',
                    'serial_number' => $fallbackSn,
                    'sn' => $fallbackSn,
                    'type' => 'Serial',
                    'status' => 'Terpasang',
                    'installed_at' => $customer->created_at ? $customer->created_at->format('Y-m-d') : date('Y-m-d')
                ]);
            }

            // 3. Subscription Active Date
            $subscriptionDate = $customer->created_at ? $customer->created_at->format('Y-m-d') : date('Y-m-d');

            $data = $customer->toArray();
            $data['orders'] = $orders;
            $data['installed_assets'] = $installedAssets;
            $data['subscription_date'] = $subscriptionDate;
            $data['modem_sn'] = $installedAssets->first()['serial_number'] ?? ($customer->modem_sn ?? null);

            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Pelanggan tidak ditemukan'], 404);
            }

            $oldOdpId = $customer->odp_id;
            $updateData = [];
            if ($request->has('name')) $updateData['name'] = $request->name;
            if ($request->has('nik')) {
                if (empty($request->nik)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Field NIK Pelanggan wajib diisi!'
                    ], 422);
                }
                $updateData['nik'] = trim($request->nik);
            }
            if ($request->has('address')) $updateData['address'] = $request->address;
            if ($request->has('phone')) $updateData['phone'] = $this->sanitizePhone($request->phone);
            if ($request->has('package')) $updateData['package_speed'] = $request->package;
            if ($request->has('package_speed')) $updateData['package_speed'] = $request->package_speed;
            if ($request->has('status')) $updateData['status'] = $request->status;
            if ($request->has('odp_id')) $updateData['odp_id'] = $request->odp_id;
            if ($request->has('odp_port')) $updateData['odp_port'] = $request->odp_port;
            if ($request->has('latitude')) $updateData['latitude'] = $request->latitude;
            if ($request->has('longitude')) $updateData['longitude'] = $request->longitude;

            if (!empty($updateData)) {
                $customer->update($updateData);
            }

            // Sync ODP ports for old and new ODP
            if ($oldOdpId) $this->recalculateOdpPorts($oldOdpId);
            if (!empty($updateData['odp_id']) && $updateData['odp_id'] != $oldOdpId) {
                $this->recalculateOdpPorts($updateData['odp_id']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Data pelanggan berhasil diperbarui!',
                'data' => $customer->fresh(['odp'])
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal update pelanggan: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return response()->json(['success' => false, 'message' => 'Pelanggan tidak ditemukan'], 404);
            }

            // Proteksi: Cegah hapus jika pelanggan masih memiliki tiket pengerjaan aktif
            $activeTasksCount = Task::where('customer_id', $customer->id)
                ->whereIn('status', ['Menunggu', 'Pending', 'Dikerjakan', 'Diproses'])
                ->count();

            if ($activeTasksCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => "Pelanggan \"{$customer->name}\" tidak dapat dihapus karena masih memiliki {$activeTasksCount} tiket tugas teknisi yang sedang berjalan!"
                ], 422);
            }

            $odpId = $customer->odp_id;

            // Clean related orders/tasks reference safely
            Order::where('customer_id', $customer->id)->update(['customer_id' => null]);
            Task::where('customer_id', $customer->id)->update(['customer_id' => null]);

            $customer->delete();

            // Recalculate ODP ports after deletion
            if ($odpId) {
                $this->recalculateOdpPorts($odpId);
            }

            return response()->json([
                'success' => true, 
                'message' => "Pelanggan \"{$customer->name}\" berhasil dihapus dan port ODP berhasil dilepaskan."
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus pelanggan: ' . $e->getMessage()], 500);
        }
    }
}
