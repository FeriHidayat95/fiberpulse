<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Odp;
use App\Events\OdpUpdated;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OdpController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Odp::query();

        if ($request->has('dusun') && $request->dusun !== 'Semua') {
            $query->where('dusun', $request->dusun);
        }

        if ($request->has('status') && $request->status !== 'Semua') {
            $query->where('status', $request->status);
        }

        $odps = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $odps
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:odps,name',
            'dusun' => 'required|string',
            'total_ports' => 'integer',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
        ], [
            'latitude.required' => 'Field Latitude wajib diisi.',
            'longitude.required' => 'Field Longitude wajib diisi.',
        ]);

        $odp = Odp::create($validated);

        broadcast(new OdpUpdated($odp));

        return response()->json([
            'success' => true,
            'message' => 'ODP berhasil ditambahkan',
            'data' => $odp
        ], 201);
    }

    public function show($id): JsonResponse
    {
        $odp = Odp::with(['customers', 'tasks'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $odp
        ]);
    }

    public function update(Request $request, $id): JsonResponse
    {
        $odp = Odp::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|required|string|unique:odps,name,' . $id,
            'dusun' => 'sometimes|required|string',
            'total_ports' => 'sometimes|integer',
            'latitude' => 'sometimes|required|numeric',
            'longitude' => 'sometimes|required|numeric',
            'address' => 'nullable|string',
            'description' => 'nullable|string',
            'status' => 'sometimes|string',
        ], [
            'latitude.required' => 'Field Latitude wajib diisi.',
            'longitude.required' => 'Field Longitude wajib diisi.',
        ]);

        $odp->update($validated);

        broadcast(new OdpUpdated($odp));

        return response()->json([
            'success' => true,
            'message' => 'ODP distribution point updated successfully.',
            'data' => $odp
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $odp = Odp::findOrFail($id);

        // Integrity guard: Prevent deletion if active subscribers are connected to this ODP
        $activeCustomersCount = \App\Models\Customer::where('odp_id', $odp->id)
            ->whereIn('status', ['Aktif', 'Isolir'])
            ->count();

        if ($activeCustomersCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "ODP \"{$odp->name}\" tidak dapat dihapus karena masih memiliki {$activeCustomersCount} pelanggan aktif/isolir terhubung! Silakan migrasikan pelanggan ke ODP lain terlebih dahulu."
            ], 422);
        }

        // Guard: Check for ongoing field tasks assigned to this ODP
        $activeTasksCount = \App\Models\Task::where('odp_id', $odp->id)
            ->whereIn('status', ['Menunggu', 'Pending', 'Dikerjakan', 'Diproses'])
            ->count();

        if ($activeTasksCount > 0) {
            return response()->json([
                'success' => false,
                'message' => "ODP \"{$odp->name}\" tidak dapat dihapus karena masih terdapat {$activeTasksCount} tiket tugas teknisi yang aktif!"
            ], 422);
        }

        $odp->delete();

        broadcast(new OdpUpdated(null)); // Broadcast deletion event to websocket channel

        return response()->json([
            'success' => true,
            'message' => "ODP \"{$odp->name}\" berhasil dihapus dengan aman."
        ]);
    }

    public function ports($id): JsonResponse
    {
        $odp = Odp::findOrFail($id);
        $activeCustomers = \App\Models\Customer::where('odp_id', $id)
            ->whereNotNull('odp_port')
            ->whereIn('status', ['Aktif', 'Isolir'])
            ->get();
            
        $usedPorts = [];
        foreach ($activeCustomers as $cust) {
            // Strip out non-numeric chars in case it's saved as "Port 3"
            $portNum = preg_replace('/[^0-9]/', '', $cust->odp_port);
            if ($portNum) {
                $usedPorts[(int)$portNum] = [
                    'customer_name' => $cust->name,
                    'status' => $cust->status
                ];
            }
        }

        $ports = [];
        for ($i = 1; $i <= $odp->total_ports; $i++) {
            if (isset($usedPorts[$i])) {
                $ports[] = [
                    'port_number' => $i,
                    'is_used' => true,
                    'customer_name' => $usedPorts[$i]['customer_name'],
                    'label' => "Port {$i} - Terpakai ({$usedPorts[$i]['customer_name']})"
                ];
            } else {
                $ports[] = [
                    'port_number' => $i,
                    'is_used' => false,
                    'label' => "Port {$i} - KOSONG"
                ];
            }
        }

        return response()->json([
            'success' => true,
            'data' => $ports
        ]);
    }
}
