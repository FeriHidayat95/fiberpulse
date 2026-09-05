<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class EvolutionService
{
    /**
     * Send a text message via Evolution API
     */
    public function sendText($remoteJid, $text)
    {
        $url = $this->getBaseUrl() . "/message/sendText/" . $this->getInstanceName();
        $headers = $this->getHeaders();
        
        $typingDelay = (int) (\App\Models\ApiKey::where('provider', 'system')->where('name', 'ai_typing_delay')->value('key') ?? 1200);

        $payload = [
            'number' => $this->formatRecipient($remoteJid),
            'text' => $text,
            'delay' => $typingDelay
        ];

        try {
            $response = Http::withHeaders($headers)->post($url, $payload);

            if (!$response->successful()) {
                Log::error('Evolution API Send Failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                return false;
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Evolution API Request Error', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send a media message via Evolution API
     */
    public function sendMedia($remoteJid, $mediaUrl, $caption = '')
    {
        // 1. Determine local file path if available to send as Base64 (100% reliable)
        $parsedPath = parse_url($mediaUrl, PHP_URL_PATH);
        $filename = basename($mediaUrl);
        $localPath = null;

        if ($parsedPath) {
            $candidate = public_path(ltrim($parsedPath, '/'));
            if (file_exists($candidate) && !is_dir($candidate)) {
                $localPath = $candidate;
            }
        }

        if (!$localPath) {
            $candidate = public_path('media/' . $filename);
            if (file_exists($candidate) && !is_dir($candidate)) {
                $localPath = $candidate;
            }
        }

        // Fallback: If requested filename is missing, find any brochure image in public/media/
        if (!$localPath || !file_exists($localPath)) {
            $mediaDir = public_path('media');
            if (\Illuminate\Support\Facades\File::exists($mediaDir)) {
                $files = \Illuminate\Support\Facades\File::files($mediaDir);
                foreach ($files as $f) {
                    $ext = strtolower($f->getExtension());
                    if (in_array($ext, ['png', 'jpg', 'jpeg', 'webp'])) {
                        $localPath = $f->getPathname();
                        break;
                    }
                }
            }
        }

        // 2. Send via Base64 to bypass HTTP/HTTPS download errors on Evolution API
        if ($localPath && file_exists($localPath)) {
            $fileBytes = @file_get_contents($localPath);
            if ($fileBytes && strlen($fileBytes) > 0) {
                $ext = strtolower(pathinfo($localPath, PATHINFO_EXTENSION));
                $mimetype = match($ext) {
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    'gif' => 'image/gif',
                    default => 'image/jpeg'
                };
                $base64 = base64_encode($fileBytes);
                return $this->sendBase64Media($remoteJid, $base64, $caption, $mimetype);
            }
        }

        // Standard HTTP URL send fallback
        $url = $this->getBaseUrl() . "/message/sendMedia/" . $this->getInstanceName();

        $extension = strtolower(pathinfo(parse_url($mediaUrl, PHP_URL_PATH), PATHINFO_EXTENSION));
        $mimetype = 'image/jpeg';
        if ($extension === 'png') $mimetype = 'image/png';
        elseif ($extension === 'webp') $mimetype = 'image/webp';
        elseif ($extension === 'gif') $mimetype = 'image/gif';

        $typingDelay = (int) (\App\Models\ApiKey::where('provider', 'system')->where('name', 'ai_typing_delay')->value('key') ?? 1200);

        $payload = [
            'number' => $this->formatRecipient($remoteJid),
            'mediatype' => 'image',
            'mimetype' => $mimetype,
            'caption' => $caption,
            'media' => $mediaUrl,
            'delay' => $typingDelay
        ];

        try {
            $response = Http::withHeaders($this->getHeaders())->post($url, $payload);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Evolution API Send Media Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Send base64 image media via Evolution API
     */
    public function sendBase64Media($remoteJid, $base64Data, $caption = '', $mimetype = 'image/png')
    {
        $url = $this->getBaseUrl() . "/message/sendMedia/" . $this->getInstanceName();

        // Clean base64 data to get ONLY the PURE RAW base64 string (WITHOUT data:image/...;base64, header)
        $rawBase64 = preg_replace('/^data:image\/[a-zA-Z0-9\+\-\.]+;base64,/', '', $base64Data);
        $rawBase64 = preg_replace('/\s+/', '', $rawBase64);
        if (str_contains($rawBase64, ',')) {
            $parts = explode(',', $rawBase64);
            $rawBase64 = end($parts);
        }

        $typingDelay = (int) (\App\Models\ApiKey::where('provider', 'system')->where('name', 'ai_typing_delay')->value('key') ?? 1200);

        $payload = [
            'number' => $this->formatRecipient($remoteJid),
            'mediatype' => 'image',
            'mimetype' => $mimetype,
            'caption' => $caption,
            'media' => $rawBase64,
            'delay' => $typingDelay
        ];

        try {
            $response = Http::withHeaders($this->getHeaders())->post($url, $payload);
            if (!$response->successful()) {
                Log::error('Evolution API Send Base64 Failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Evolution API Send Base64 Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    private function formatRecipient($remoteJid)
    {
        if (str_contains($remoteJid, '@g.us')) {
            return $remoteJid;
        }
        $number = str_replace(['@s.whatsapp.net', '@c.us', '@lid'], '', $remoteJid);
        $number = preg_replace('/\D/', '', $number);
        if (str_starts_with($number, '0')) {
            $number = '62' . substr($number, 1);
        }
        return $number;
    }

    private function getBaseUrl()
    {
        $setting = \App\Models\ApiKey::where('provider', 'system')
                    ->where('name', 'evolution_api_url')
                    ->first();
        
        $rawUrl = $setting ? $setting->key : env('EVOLUTION_API_URL', 'http://127.0.0.1:8080');
        
        // Foolproof the URL in case user enters full path like https://wa.domain.com/message/sendText/...
        $parsed = parse_url($rawUrl);
        $scheme = isset($parsed['scheme']) ? $parsed['scheme'] : 'http';
        $host = isset($parsed['host']) ? $parsed['host'] : '127.0.0.1';
        $port = isset($parsed['port']) ? ':' . $parsed['port'] : '';
        
        return $scheme . '://' . $host . $port;
    }

    private function getInstanceName()
    {
        $setting = \App\Models\ApiKey::where('provider', 'system')
                    ->where('name', 'evolution_instance_name')
                    ->first();
                    
        return $setting ? $setting->key : env('EVOLUTION_INSTANCE_NAME', 'CS_BOT');
    }

    private function getHeaders()
    {
        $setting = \App\Models\ApiKey::where('provider', 'system')
                    ->where('name', 'evolution_api_key')
                    ->first();
        $apiKey = $setting ? $setting->key : env('EVOLUTION_API_KEY', 'global_api_key_or_instance_key');
        
        return [
            'apikey' => $apiKey
        ];
    }

    /**
     * Get instance connection state
     */
    public function getConnectionState()
    {
        try {
            $url = $this->getBaseUrl() . "/instance/connectionState/" . $this->getInstanceName();
            $response = Http::withHeaders($this->getHeaders())->get($url);
            
            if ($response->successful()) {
                return $response->json();
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get detailed instance info from fetchInstances
     */
    public function getInstanceInfo()
    {
        try {
            $url = $this->getBaseUrl() . "/instance/fetchInstances";
            $response = Http::withHeaders($this->getHeaders())->get($url);
            if ($response->successful()) {
                $list = $response->json();
                if (is_array($list)) {
                    foreach ($list as $item) {
                        $name = $item['name'] ?? $item['instanceName'] ?? '';
                        if ($name === $this->getInstanceName()) {
                            return $item;
                        }
                    }
                }
            }
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Fetch WhatsApp Groups
     */
    public function getGroups()
    {
        try {
            $url = $this->getBaseUrl() . "/group/fetchAllGroups/" . $this->getInstanceName() . "?getParticipants=false";
            $response = Http::withHeaders($this->getHeaders())->get($url);
            
            if ($response->successful()) {
                return $response->json();
            }
            return [];
        } catch (\Exception $e) {
            Log::error('Evolution API Fetch Groups Error', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Fetch QR Code base64
     */
    public function getQrCode()
    {
        try {
            $url = $this->getBaseUrl() . "/instance/connect/" . $this->getInstanceName();
            $response = Http::withHeaders($this->getHeaders())->get($url);
            
            if ($response->successful()) {
                return $response->json();
            }
            Log::error('Evolution API Fetch QR Failed', ['status' => $response->status(), 'body' => $response->body()]);
            return null;
        } catch (\Exception $e) {
            Log::error('Evolution API Fetch QR Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Fetch WhatsApp 8-digit Pairing Code via Phone Number
     */
    public function getPairingCode($phoneNumber)
    {
        $cleanNumber = preg_replace('/\D/', '', $phoneNumber);
        if (str_starts_with($cleanNumber, '0')) {
            $cleanNumber = '62' . substr($cleanNumber, 1);
        }

        try {
            $url = $this->getBaseUrl() . "/instance/connect/" . $this->getInstanceName() . "?number=" . $cleanNumber;
            $response = Http::withHeaders($this->getHeaders())->get($url);
            
            if ($response->successful()) {
                $data = $response->json();
                $candidate = $data['pairingCode'] ?? $data['qrcode']['pairingCode'] ?? null;
                
                // Strictly validate pairing code (e.g. "ABCD-1234" or "12345678", max 12 chars, no long QR strings)
                if ($candidate && is_string($candidate) && strlen(trim($candidate)) <= 12 && !str_starts_with($candidate, '2@')) {
                    return trim($candidate);
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Evolution API Fetch Pairing Code Exception', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Logout and delete session
     */
    public function logout()
    {
        try {
            $url = $this->getBaseUrl() . "/instance/logout/" . $this->getInstanceName();
            $response = Http::withHeaders($this->getHeaders())->delete($url);
            return $response->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    public function setWebhook()
    {
        try {
            $webhookUrl = $this->getBaseUrl() . "/webhook/set/" . $this->getInstanceName();
            $appWebhookUrl = env('APP_URL', 'https://localhost:8000') . '/api/webhook/evolution';
            
            $webhookPayload = [
                'webhook' => [
                    'enabled' => true,
                    'url' => $appWebhookUrl,
                    'byEvents' => false,
                    'base64' => true,
                    'events' => ['MESSAGES_UPSERT']
                ]
            ];

            $whResponse = Http::withHeaders($this->getHeaders())->post($webhookUrl, $webhookPayload);
            if (!$whResponse->successful()) {
                Log::error('Evolution API Set Webhook Failed', ['status' => $whResponse->status(), 'body' => $whResponse->body()]);
                return false;
            }
            return true;
        } catch (\Exception $e) {
            Log::error('Evolution API Set Webhook Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Create instance and configure webhook
     */
    public function createInstance()
    {
        try {
            // 1. Create Instance
            $createUrl = $this->getBaseUrl() . "/instance/create";
            $payload = [
                'instanceName' => $this->getInstanceName(),
                'token' => '', // auto generate
                'qrcode' => true
            ];
            
            $response = Http::withHeaders($this->getHeaders())->post($createUrl, $payload);
            if (!$response->successful()) {
                Log::error('Evolution API Create Instance Failed', ['status' => $response->status(), 'body' => $response->body()]);
                return false;
            }
            
            // 2. Set Webhook
            $this->setWebhook();

            return true;
        } catch (\Exception $e) {
            Log::error('Evolution API Create Instance Exception', ['error' => $e->getMessage()]);
            return false;
        }
    }
}
