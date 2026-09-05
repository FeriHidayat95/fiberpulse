<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Odp;
use App\Models\Technician;
use App\Models\Order;
use App\Models\Task;
use App\Models\Customer;
use App\Models\Asset;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function summary(): JsonResponse
    {
        $totalOdp = Odp::count();
        $activeOdp = Odp::where('status', 'Aktif')->count();
        $fullOdp = Odp::where('status', 'Penuh')->count();
        $brokenOdp = Odp::where('status', 'Rusak')->count();

        $totalTechnicians = Technician::count();
        $onDutyTechnicians = Technician::where('status', 'Bertugas')->count();
        $availableTechnicians = Technician::where('status', 'Tersedia')->count();

        $pendingOrders = Order::where('status', 'Menunggu')->count();
        $activeTasks = Task::whereIn('status', ['Menunggu', 'Dikerjakan'])->count();
        $totalCustomers = Customer::count();

        $allAssets = Asset::all();
        $hardwareStock = 0;
        $materialStock = 0;
        $totalAssets = 0;
        $damagedAssets = 0;

        foreach ($allAssets as $asset) {
            $total = ($asset->available_stock ?? 0) + ($asset->cabutan_stock ?? 0) + ($asset->damaged_stock ?? 0);
            $totalAssets += $total;
            $damagedAssets += ($asset->damaged_stock ?? 0);

            $st = strtolower($asset->stock_type ?? '');
            $cat = strtolower($asset->category ?? '');
            if (in_array($st, ['meter', 'm', 'roll']) || str_contains($cat, 'kabel') || str_contains($cat, 'fo') || str_contains($cat, 'consumable')) {
                $materialStock += $total;
            } else {
                $hardwareStock += $total;
            }
        }

        $monthlyChart = [];
        $months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
        for ($i = 5; $i >= 0; $i--) {
            $date = \Carbon\Carbon::now()->subMonths($i);
            $monthName = $months[$date->month - 1];
            
            $pasangCount = Order::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
                
            $gangguanCount = Task::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
                
            $monthlyChart[] = [
                'month' => $monthName,
                'pasang' => $pasangCount,
                'gangguan' => $gangguanCount
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'odp' => [
                    'total' => $totalOdp,
                    'aktif' => $activeOdp,
                    'penuh' => $fullOdp,
                    'rusak' => $brokenOdp,
                ],
                'technicians' => [
                    'total' => $totalTechnicians,
                    'bertugas' => $onDutyTechnicians,
                    'tersedia' => $availableTechnicians,
                ],
                'orders' => [
                    'pending' => $pendingOrders,
                ],
                'tasks' => [
                    'active' => $activeTasks,
                ],
                'customers' => [
                    'total' => $totalCustomers,
                ],
                'assets' => [
                    'total' => (int) $totalAssets,
                    'hardware' => (int) $hardwareStock,
                    'material' => (int) $materialStock,
                    'damaged' => (int) $damagedAssets,
                ],
                'monthly_chart' => $monthlyChart,
            ]
        ]);
    }

    public function inventory(): JsonResponse
    {
        $allAssets = Asset::all();
        
        $hardwareBaru = 0;
        $hardwareCabutan = 0;
        $hardwareDamaged = 0;

        $materialBaru = 0;
        $materialCabutan = 0;
        $materialDamaged = 0;

        $categories = [];

        foreach ($allAssets as $asset) {
            $baru = (int) ($asset->available_stock ?? 0);
            $cab = (int) ($asset->cabutan_stock ?? 0);
            $dmg = (int) ($asset->damaged_stock ?? 0);

            $st = strtolower($asset->stock_type ?? '');
            $cat = strtolower($asset->category ?? 'lainnya');
            
            $isMaterial = in_array($st, ['meter', 'm', 'roll']) || str_contains($cat, 'kabel') || str_contains($cat, 'fo') || str_contains($cat, 'consumable');

            if ($isMaterial) {
                $materialBaru += $baru;
                $materialCabutan += $cab;
                $materialDamaged += $dmg;
            } else {
                $hardwareBaru += $baru;
                $hardwareCabutan += $cab;
                $hardwareDamaged += $dmg;
            }

            if (!isset($categories[$cat])) {
                $categories[$cat] = 0;
            }
            $categories[$cat] += $baru + $cab; // Usable available stock
        }

        $hardwareTotal = $hardwareBaru + $hardwareCabutan;
        $materialTotal = $materialBaru + $materialCabutan;
        $totalDamaged = $hardwareDamaged + $materialDamaged;

        $byCat = [];
        foreach ($categories as $k => $v) {
            $byCat[] = ['name' => ucwords($k), 'count' => $v];
        }

        $lowStock = Asset::where('available_stock', '<=', 5)->get();
        $recentTransactions = \App\Models\AssetTransaction::with(['asset', 'technician'])->orderBy('id', 'desc')->limit(10)->get();

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_skus' => $allAssets->count(),
                    'hardware_units' => $hardwareTotal,
                    'hardware_baru' => $hardwareBaru,
                    'hardware_cabutan' => $hardwareCabutan,
                    'hardware_damaged' => $hardwareDamaged,
                    'material_meters' => $materialTotal,
                    'material_baru' => $materialBaru,
                    'material_cabutan' => $materialCabutan,
                    'material_damaged' => $materialDamaged,
                    'baru' => $hardwareBaru + $materialBaru,
                    'cabutan' => $hardwareCabutan + $materialCabutan,
                    'damaged' => $totalDamaged,
                ],
                'by_category' => $byCat,
                'low_stock' => $lowStock,
                'recent_transactions' => $recentTransactions,
            ]
        ]);
    }
}
