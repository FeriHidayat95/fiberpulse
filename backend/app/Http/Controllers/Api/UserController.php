<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Technician;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query();

        if ($request->has('role') && $request->role) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('role', 'asc')->orderBy('name', 'asc')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email',
                'password' => 'required|string|min:6',
                'role' => 'required|string|in:admin,admin_gudang,kepala_gudang,teknisi,Admin Gudang,Kepala Teknisi Gudang,Admin Super',
                'phone' => 'nullable|string',
                'area' => 'nullable|string'
            ]);

            $userData = [
                'name' => trim($validated['name']),
                'email' => trim(strtolower($validated['email'])),
                'password' => Hash::make($validated['password']),
                'role' => $validated['role'],
                'phone' => $validated['phone'] ?? '081234567890',
                'status' => 'Aktif',
            ];
            
            if (Schema::hasColumn('users', 'area')) {
                $userData['area'] = $validated['area'] ?? 'Wilayah Operasional SGT';
            }
            
            $user = User::create($userData);

            if ($validated['role'] === 'teknisi') {
                Technician::firstOrCreate(
                    ['email' => $user->email],
                    [
                        'name' => $user->name,
                        'phone' => $user->phone ?? '081234567890',
                        'status' => 'Tersedia',
                    ]
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Akun pengguna berhasil dibuat!',
                'data' => $user
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $ve) {
            $firstError = collect($ve->errors())->flatten()->first() ?? 'Validasi input tidak sesuai.';
            return response()->json([
                'success' => false,
                'message' => $firstError,
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,'.$id,
                'password' => 'nullable|string|min:6',
                'role' => 'required|string|in:admin,admin_gudang,kepala_gudang,teknisi,Admin Gudang,Kepala Teknisi Gudang,Admin Super',
                'phone' => 'nullable|string',
                'status' => 'required|string|in:Aktif,Nonaktif,Resign'
            ]);

            $user = User::findOrFail($id);
            $oldEmail = $user->email;

            $userData = [
                'name' => trim($validated['name']),
                'email' => trim(strtolower($validated['email'])),
                'role' => $validated['role'],
                'phone' => $validated['phone'] ?? '081234567890',
                'status' => $validated['status'],
            ];
            
            if (!empty($validated['password'])) {
                $userData['password'] = Hash::make($validated['password']);
            }
            
            $user->update($userData);

            if ($validated['role'] === 'teknisi') {
                $technician = Technician::where('email', $oldEmail)->first();
                if (!$technician) {
                    Technician::create([
                        'name' => $validated['name'],
                        'phone' => $validated['phone'] ?? '081234567890',
                        'email' => $validated['email'],
                        'status' => 'Tersedia',
                    ]);
                } else {
                    $technician->update([
                    'name' => $validated['name'],
                    'email' => $validated['email'],
                    'phone' => $validated['phone'] ?? '081234567890',
                ]);
            }
        } else {
            // If changed from teknisi to admin, perhaps remove from technicians table?
            // Optional: Technician::where('email', $oldEmail)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun pengguna berhasil diperbarui!',
            'data' => $user->fresh()
        ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            $firstError = collect($ve->errors())->flatten()->first() ?? 'Validasi input tidak sesuai.';
            return response()->json([
                'success' => false,
                'message' => $firstError,
                'errors' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update account: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:Aktif,Nonaktif,Resign'
        ]);

        $user = User::findOrFail($id);
        $user->update([
            'status' => $validated['status']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status akun pengguna berhasil diperbarui!'
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);
        if ($user) {
            if ($user->role === 'teknisi') {
                Technician::where('email', $user->email)->delete();
            }
            $user->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Akun pengguna berhasil dihapus!'
        ]);
    }
}
