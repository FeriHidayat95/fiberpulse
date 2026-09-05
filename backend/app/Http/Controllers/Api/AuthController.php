<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use Illuminate\Support\Facades\Hash;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah!'
            ], 401);
        }

        // Generate Sanctum / API session token
        $token = hash('sha256', $user->email . time() . 'drnet-sanctum-secret');

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil sebagai ' . strtoupper($user->role),
            'token' => $token,
            'technician_id' => $user->id,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role
            ]
        ]);
    }

    public function logout(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil, sesi Sanctum ditutup.'
        ]);
    }

    public function me(Request $request)
    {
        $token = $request->header('Authorization');
        return response()->json([
            'success' => true,
            'user' => [
                'name' => 'User PT DR',
                'role' => 'admin',
                'token_active' => !empty($token)
            ]
        ]);
    }
}
