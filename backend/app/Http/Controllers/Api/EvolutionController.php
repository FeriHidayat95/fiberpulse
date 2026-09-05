<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\EvolutionService;

class EvolutionController extends Controller
{
    protected $evoService;

    public function __construct(EvolutionService $evoService)
    {
        $this->evoService = $evoService;
    }

    public function status()
    {
        $state = $this->evoService->getConnectionState();
        
        // If state is null, it means instance doesn't exist or API is unreachable
        if (!$state || isset($state['error'])) {
            // Attempt to create instance
            $this->evoService->createInstance();
            return response()->json(['status' => 'creating']);
        }

        // Return connection state (e.g. 'open', 'connecting', 'close')
        // The Evolution API usually returns: {"instance": {"state": "open"}}
        $instanceState = $state['instance']['state'] ?? 'close';

        // Check if there is a 401 disconnection reason (meaning logged out, needs QR scan)
        $instInfo = $this->evoService->getInstanceInfo();
        if (!empty($instInfo['disconnectionReasonCode']) && $instInfo['disconnectionReasonCode'] == 401) {
            $instanceState = 'close';
        }

        return response()->json(['status' => $instanceState]);
    }

    public function qr(Request $request)
    {
        $force = $request->boolean('force', false);
        
        $state = $this->evoService->getConnectionState();
        $instanceState = $state['instance']['state'] ?? null;

        $instInfo = $this->evoService->getInstanceInfo();
        $isLoggedOut = !empty($instInfo['disconnectionReasonCode']) && $instInfo['disconnectionReasonCode'] == 401;

        if ($instanceState === 'open' && !$force && !$isLoggedOut) {
            return response()->json([
                'status' => 'open',
                'message' => 'WhatsApp sudah terhubung aktif (Connected).'
            ]);
        }

        $qrData = $this->evoService->getQrCode();
        if ($qrData) {
            $base64 = $qrData['base64'] ?? $qrData['qrcode']['base64'] ?? $qrData['code'] ?? null;
            $pairingCode = $qrData['pairingCode'] ?? null;

            if ($base64) {
                if (!str_starts_with($base64, 'data:image')) {
                    $base64 = 'data:image/png;base64,' . $base64;
                }
                return response()->json([
                    'base64' => $base64,
                    'pairingCode' => $pairingCode,
                    'status' => 'connecting'
                ]);
            }
        }

        // Fallback: try createInstance one more time
        $this->evoService->createInstance();
        $qrData2 = $this->evoService->getQrCode();
        if ($qrData2) {
            $base64 = $qrData2['base64'] ?? $qrData2['qrcode']['base64'] ?? $qrData2['code'] ?? null;
            if ($base64) {
                if (!str_starts_with($base64, 'data:image')) {
                    $base64 = 'data:image/png;base64,' . $base64;
                }
                return response()->json([
                    'base64' => $base64,
                    'status' => 'connecting'
                ]);
            }
        }

        return response()->json([
            'status' => $instanceState ?? 'close',
            'base64' => null
        ]);
    }

    public function pairingCode(Request $request)
    {
        $phoneNumber = $request->input('phone_number') ?? $request->input('number');
        if (!$phoneNumber) {
            return response()->json(['error' => 'Nomor WhatsApp wajib diisi (contoh: 081234567890)'], 422);
        }

        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);
        if (str_starts_with($cleanNumber, '0')) {
            $cleanNumber = '62' . substr($cleanNumber, 1);
        }

        if (strlen($cleanNumber) < 10 || strlen($cleanNumber) > 15) {
            return response()->json(['error' => 'Format nomor WhatsApp tidak valid. Masukkan nomor HP aktif (contoh: 081234567890)'], 422);
        }

        // Ensure instance exists
        $state = $this->evoService->getConnectionState();
        $instanceState = $state['instance']['state'] ?? null;
        if (!$state || isset($state['error']) || $instanceState === null) {
            $this->evoService->createInstance();
            usleep(800000);
        }

        $code = $this->evoService->getPairingCode($cleanNumber);
        if ($code) {
            return response()->json([
                'success' => true,
                'pairing_code' => $code,
                'message' => 'Pairing code berhasil didapatkan.'
            ]);
        }

        return response()->json([
            'success' => false,
            'error' => 'Server Evolution API sedang aktif dalam mode QR Code. Silakan gunakan tab "Scan QR Code" untuk menautkan perangkat, atau klik Logout terlebih dahulu jika ingin pairing ulang.'
        ], 400);
    }

    public function logout()
    {
        $success = $this->evoService->logout();
        if ($success) {
            // Automatically recreate the instance for the next scan
            $this->evoService->createInstance();
            return response()->json(['message' => 'Logged out successfully']);
        }
        return response()->json(['error' => 'Failed to logout'], 500);
    }

    public function getGroups()
    {
        $groups = $this->evoService->getGroups();
        return response()->json($groups);
    }
}
