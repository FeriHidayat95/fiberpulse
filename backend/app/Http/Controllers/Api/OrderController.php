<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\Customer;
use App\Models\Task;
use App\Models\Technician;
use App\Models\Odp;
use Illuminate\Support\Facades\Schema;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::with(['customer', 'technician', 'odp'])
            ->orderBy('id', 'desc')
            ->get()
            ->map(function ($order) {
                // Flatten relationships for frontend compatibility
                $order->customer_name = $order->customer->name ?? null;
                $order->customer_phone = $order->customer->phone ?? null;
                $order->customer_address = $order->customer->address ?? null;
                $order->technician_name = $order->technician->name ?? null;
                $order->odp_name = $order->odp->name ?? null;
                return $order;
            });

        return response()->json([
            'success' => true,
            'data' => $orders
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|integer',
            'customer_name' => 'required_without:customer_id|string|nullable',
            'nik' => 'required_without:customer_id|string|nullable',
            'phone' => 'required_without:customer_id|string|nullable',
            'address' => 'required_without:customer_id|string|nullable',
            'dusun' => 'required_without:customer_id|string|nullable',
            'package_speed' => 'required|string',
            'type' => 'nullable|string',
            'notes' => 'nullable|string'
        ], [
            'nik.required_without' => 'Field NIK Pelanggan wajib diisi!'
        ]);

        if (!empty($validated['customer_id'])) {
            $custId = $validated['customer_id'];
        } else {
            $cleanPhone = preg_replace('/[^0-9]/', '', $validated['phone']);
            if (str_starts_with($cleanPhone, '628')) {
                $cleanPhone = '08' . substr($cleanPhone, 3);
            } elseif (str_starts_with($cleanPhone, '8') && strlen($cleanPhone) >= 9) {
                $cleanPhone = '0' . $cleanPhone;
            }

            // Create customer first
            $customer = Customer::create([
                'name' => $validated['customer_name'],
                'nik' => trim($request->input('nik') ?? $validated['nik'] ?? ''),
                'phone' => $cleanPhone,
                'address' => $validated['address'],
                'dusun' => $validated['dusun'],
                'package_speed' => $validated['package_speed'],
                'status' => 'Menunggu Pasang'
            ]);
            $custId = $customer->id;
        }

        $order = Order::create([
            'order_number' => 'ORD-' . strtoupper(uniqid()),
            'customer_id' => $custId,
            'type' => $request->input('type', 'Pasang Baru'),
            'package_speed' => $validated['package_speed'],
            'status' => 'Menunggu',
            'request_date' => now()->toDateString(),
            'notes' => $validated['notes'] ?? 'Pendaftaran online dari portal'
        ]);

        // Auto-assign technician immediately upon creation
        $autoAssigned = false;
        try {
            $techs = Technician::all();
            if ($techs->isNotEmpty()) {
                $techWorkloads = [];
                foreach ($techs as $tech) {
                    $count = Task::where('technician_id', $tech->id)->whereIn('status', ['Menunggu', 'Pending', 'Diproses', 'Dikerjakan'])->count();
                    $techWorkloads[] = ['tech' => $tech, 'count' => $count];
                }
                usort($techWorkloads, fn($a, $b) => $a['count'] <=> $b['count']);
                $selectedTech = $techWorkloads[0]['tech'];

                $firstOdp = Odp::first();
                $odpId = $firstOdp ? $firstOdp->id : null;

                $order->update([
                    'status' => 'Proses',
                    'assigned_technician_id' => $selectedTech->id,
                    'odp_id' => $odpId
                ]);

                Task::create([
                    'ticket_number' => 'TK-' . date('Ymd') . '-' . rand(100, 999),
                    'title' => $order->type . ' - ' . ($validated['customer_name'] ?? 'Pelanggan'),
                    'description' => 'Tugas ' . $order->type . ' kecepatan ' . $order->package_speed . '. Alamat: ' . ($validated['address'] ?? ''),
                    'type' => $order->type,
                    'status' => 'Menunggu',
                    'technician_id' => $selectedTech->id,
                    'odp_id' => $odpId,
                    'customer_id' => $custId,
                ]);

                $autoAssigned = true;
            }
        } catch (\Exception $e) {}

        return response()->json([
            'success' => true,
            'message' => 'Order ' . strtolower($order->type) . ($autoAssigned ? ' berhasil dibuat & otomatis ditugaskan ke teknisi!' : ' berhasil dibuat!'),
            'order_id' => $order->id,
            'auto_assigned' => $autoAssigned
        ], 201);
    }

    public function convertToTask(Request $request, $id)
    {
        $order = Order::with('customer')->find($id);
        if (!$order) {
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan!'], 404);
        }

        $technicianId = $request->input('technician_id');
        if (!$technicianId) {
            $firstTech = Technician::first();
            $technicianId = $firstTech ? $firstTech->id : null;
        }
        
        $odpId = $request->input('odp_id', $order->odp_id);
        if (!$odpId) {
            $firstOdp = Odp::first();
            $odpId = $firstOdp ? $firstOdp->id : null;
        }

        // Update order status
        $order->update([
            'status' => 'Proses',
            'assigned_technician_id' => $technicianId,
            'odp_id' => $odpId
        ]);

        // Create Task
        $orderType = $order->type ?? 'Pasang Baru';
        $customerName = $order->customer ? $order->customer->name : 'Pelanggan PT DR';
        $customerAddress = $order->customer ? $order->customer->address : '';
        
        $taskDescPrefix = match($orderType) {
            'Pasang Baru' => 'Pemasangan Wi-Fi kecepatan ',
            'Perbaikan Gangguan' => 'Perbaikan Gangguan Wi-Fi ',
            'Pencabutan' => 'Pencabutan Layanan Wi-Fi ',
            default => 'Tugas Wi-Fi '
        };

        $taskData = [
            'ticket_number' => 'TK-' . date('Ymd') . '-' . rand(100, 999),
            'title' => $orderType . ' - ' . $customerName,
            'description' => $taskDescPrefix . $order->package_speed . '. Alamat: ' . $customerAddress,
            'type' => $orderType,
            'status' => 'Menunggu',
            'technician_id' => $technicianId,
            'odp_id' => $odpId,
            'customer_id' => $order->customer_id,
        ];

        if (Schema::hasColumn('tasks', 'priority')) {
            $taskData['priority'] = 'Tinggi';
        }
        
        $task = Task::create($taskData);

        return response()->json([
            'success' => true,
            'message' => 'Order berhasil dikonversi menjadi Tiket Penugasan Teknisi!',
            'task_id' => $task->id
        ]);
    }

    public function show($id)
    {
        try {
            $order = Order::find($id);
            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Work order not found.'], 404);
            }
            return response()->json(['success' => true, 'data' => $order]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $order = Order::find($id);
            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Work order not found.'], 404);
            }

            // Validation: Work order modifications only permitted while pending dispatch
            if (!in_array($order->status, ['Menunggu', 'Pending']) && !$request->has('force_admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Work order cannot be edited because it is in progress or completed.'
                ], 422);
            }

            $order->update($request->only(['package_speed', 'status', 'notes', 'type']));
            
            if ($order->customer_id) {
                $customerUpdate = [];
                if ($request->has('customer_name')) $customerUpdate['name'] = $request->customer_name;
                if ($request->has('phone')) $customerUpdate['phone'] = $request->phone;
                if ($request->has('address')) $customerUpdate['address'] = $request->address;
                
                if (!empty($customerUpdate)) {
                    $order->customer()->update($customerUpdate);
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Work order updated successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to update work order: ' . $e->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $order = Order::find($id);
            if (!$order) {
                return response()->json(['success' => false, 'message' => 'Work order not found.'], 404);
            }

            // Validation: Work order cancellation only permitted while pending dispatch
            if (!in_array($order->status, ['Menunggu', 'Pending'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan tidak dapat dihapus karena sedang diproses atau telah selesai.'
                ], 422);
            }

            if ($order->customer_id) {
                Task::where('customer_id', $order->customer_id)
                    ->where('type', $order->type)
                    ->whereIn('status', ['Menunggu', 'Pending', 'Diproses', 'Dikerjakan'])
                    ->delete();
            }
            $order->delete();

            return response()->json(['success' => true, 'message' => 'Pending work order deleted successfully.']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Failed to delete work order: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Auto Dispatch Single Order or All Pending Orders to Technicians
     */
    public function autoDispatch(Request $request)
    {
        try {
            $orderId = $request->input('order_id');
            $strategy = $request->input('strategy', 'workload'); // workload | proximity | round_robin
            $maxTasksPerTech = (int)$request->input('max_tasks_per_tech', 5);

            $query = Order::with('customer')->whereIn('status', ['Menunggu', 'Pending']);
            if ($orderId) {
                $query->where('id', $orderId);
            }

            $pendingOrders = $query->get();

            if ($pendingOrders->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No pending work orders require automated dispatch.',
                    'assigned_count' => 0
                ]);
            }

            // Get active technicians
            $technicians = Technician::all();

            if ($technicians->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Automated dispatch failed: No active technicians found in system.'
                ], 422);
            }

            $assignedCount = 0;
            $assignedLog = [];

            foreach ($pendingOrders as $order) {
                // Calculate active workload per technician
                $techWorkloads = [];
                foreach ($technicians as $tech) {
                    $activeTasksCount = Task::where('technician_id', $tech->id)
                        ->whereIn('status', ['Menunggu', 'Pending', 'Dikerjakan', 'Diproses'])
                        ->count();
                    
                    $techWorkloads[] = [
                        'tech' => $tech,
                        'active_count' => $activeTasksCount,
                        'last_task_time' => Task::where('technician_id', $tech->id)->max('created_at') ?? '1970-01-01 00:00:00'
                    ];
                }

                // Filter technicians below max tasks capacity
                $availableTechs = array_values(array_filter($techWorkloads, function ($item) use ($maxTasksPerTech) {
                    return $item['active_count'] < $maxTasksPerTech;
                }));

                // Fallback: If all techs are busy at max capacity, select from all technicians
                if (empty($availableTechs)) {
                    $availableTechs = $techWorkloads;
                }

                // Apply Strategy
                if ($strategy === 'round_robin') {
                    // Pick technician with oldest last task assignment time
                    usort($availableTechs, fn($a, $b) => strcmp($a['last_task_time'], $b['last_task_time']));
                } else {
                    // Workload / default: Pick technician with lowest active task count
                    usort($availableTechs, fn($a, $b) => $a['active_count'] <=> $b['active_count']);
                }

                $selectedTech = $availableTechs[0]['tech'];

                // Find default or closest ODP
                $odpId = $order->odp_id;
                if (!$odpId) {
                    $firstOdp = Odp::first();
                    $odpId = $firstOdp ? $firstOdp->id : null;
                }

                // Update order status
                $order->update([
                    'status' => 'Proses',
                    'assigned_technician_id' => $selectedTech->id,
                    'odp_id' => $odpId
                ]);

                // Create Task ticket
                $orderType = $order->type ?? 'Pasang Baru';
                $customerName = $order->customer ? $order->customer->name : 'Pelanggan';
                $customerAddress = $order->customer ? $order->customer->address : '';

                $taskDescPrefix = match($orderType) {
                    'Pasang Baru' => 'Pemasangan Wi-Fi kecepatan ',
                    'Perbaikan Gangguan' => 'Perbaikan Gangguan Wi-Fi ',
                    'Pencabutan' => 'Pencabutan Layanan Wi-Fi ',
                    default => 'Tugas Wi-Fi '
                };

                $taskData = [
                    'ticket_number' => 'TK-' . date('Ymd') . '-' . rand(100, 999),
                    'title' => $orderType . ' - ' . $customerName,
                    'description' => $taskDescPrefix . ($order->package_speed ?? '30 Mbps') . '. Alamat: ' . $customerAddress,
                    'type' => $orderType,
                    'status' => 'Menunggu',
                    'technician_id' => $selectedTech->id,
                    'odp_id' => $odpId,
                    'customer_id' => $order->customer_id,
                ];

                if (Schema::hasColumn('tasks', 'priority')) {
                    $taskData['priority'] = 'Tinggi';
                }

                $task = Task::create($taskData);
                Technician::where('id', $selectedTech->id)->update(['status' => 'Bertugas']);

                $assignedCount++;
                $assignedLog[] = [
                    'order' => $order->order_number,
                    'technician' => $selectedTech->name,
                    'task_ticket' => $task->ticket_number
                ];
            }

            return response()->json([
                'success' => true,
                'message' => "⚡ Penugasan Otomatis Berhasil! {$assignedCount} order telah ditugaskan ke teknisi secara cerdas.",
                'assigned_count' => $assignedCount,
                'log' => $assignedLog
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Automated dispatch failed: ' . $e->getMessage()], 500);
        }
    }
}
