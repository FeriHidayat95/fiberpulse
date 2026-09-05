<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\ApiKey;
use App\Exceptions\RateLimitException;

class AIService
{
    /**
     * Send a message to Gemini API with multi-key failover.
     * 
     * @param array $messages Conversation history formatted for Gemini
     * @return string Generated text from AI
     * @throws \Exception
     */
    public function generateResponse(array $messages)
    {
        $keys = ApiKey::where('provider', 'gemini')
            ->where('is_active', true)
            ->get();

        // Filter out keys that are currently on cooldown
        $availableKeys = $keys->filter(function ($key) {
            return !\Illuminate\Support\Facades\Cache::has("ai_key_cooldown_{$key->id}");
        })->sortBy('last_used_at')->values();

        if ($availableKeys->isEmpty()) {
            if ($keys->isEmpty()) {
                Log::error('No active Gemini API keys found.');
                return ['type' => 'text', 'text' => "Maaf, sistem CS kami sedang mengalami gangguan (API Key kosong). Mohon hubungi teknisi manual."];
            } else {
                // All keys are on cooldown
                throw new RateLimitException("All keys are currently on cooldown", 30, 429);
            }
        }

        $preferredModel = ApiKey::where('provider', 'system')->where('name', 'ai_model')->value('key') ?: 'gemini-2.5-flash';

        // Map models in case they have legacy names
        $modelMap = [
            'gemini-1.5-pro' => 'gemini-2.5-pro',
            'gemini-1.5-flash' => 'gemini-2.5-flash',
            'gemini-2.0-flash' => 'gemini-2.0-flash',
            'gemini-2.1-pro' => 'gemini-2.5-pro',
            'gemini-2.1-flash' => 'gemini-2.5-flash',
            'gemini-2.5-flash' => 'gemini-2.5-flash',
            'gemini-2.5-pro' => 'gemini-2.5-pro',
            'gemini-3.5-flash' => 'gemini-3.5-flash'
        ];
        
        if (isset($modelMap[$preferredModel])) {
            $preferredModel = $modelMap[$preferredModel];
        }

        // Ultimate Anti-Error Fallback: Always try known working models as backups
        $modelsToTry = array_values(array_unique([
            $preferredModel,
            'gemini-flash-lite-latest',
            'gemini-3.1-flash-lite',
            'gemma-4-26b-a4b-it',
            'gemini-flash-latest'
        ]));

        $lastExceptionOverall = null;

        foreach ($availableKeys as $keyModel) {
            try {
                $lastException = null;
                $response = null;

                foreach ($modelsToTry as $modelName) {
                    try {
                        $response = $this->callGemini($keyModel->key, $modelName, $messages);
                        break; // Success, exit model loop
                    } catch (\Exception $e) {
                        $lastException = $e;
                        $lastExceptionOverall = $e;
                        Log::warning("Gemini API Key failed with model {$modelName}: " . $keyModel->name, ['error' => $e->getMessage()]);
                        // Try next model
                    }
                }

                if (!$response) {
                    throw $lastException ?: new \Exception("All fallback models failed.");
                }
                
                // Update last used
                $keyModel->last_used_at = now();
                $keyModel->save();
                
                return $response;
            } catch (\Exception $e) {
                if (strpos($e->getMessage(), '429') !== false || strpos($e->getMessage(), 'RESOURCE_EXHAUSTED') !== false) {
                    $retrySeconds = 60;
                    if (preg_match('/retry in ([\d\.]+)s/i', $e->getMessage(), $matches)) {
                        $retrySeconds = (int) ceil((float) $matches[1]);
                    }
                    \Illuminate\Support\Facades\Cache::put("ai_key_cooldown_{$keyModel->id}", true, now()->addSeconds($retrySeconds));
                    Log::info("Key {$keyModel->name} is now on cooldown for {$retrySeconds}s.");
                } else {
                    // Only increment error count for non-429 errors
                    $keyModel->error_count = $keyModel->error_count + 1;
                    $keyModel->save();
                }
                
                // Continue to next key in loop...
            }
        }

        if ($lastExceptionOverall && (strpos($lastExceptionOverall->getMessage(), '429') !== false || strpos($lastExceptionOverall->getMessage(), 'RESOURCE_EXHAUSTED') !== false)) {
            $retrySeconds = 60;
            if (preg_match('/retry in ([\d\.]+)s/i', $lastExceptionOverall->getMessage(), $matches)) {
                $retrySeconds = (int) ceil((float) $matches[1]);
            }
            throw new RateLimitException("Rate limit exhausted on all keys", $retrySeconds, 429, $lastExceptionOverall);
        }

        return ['type' => 'text', 'text' => "Maaf, sistem CS kami sedang sibuk saat ini. Mohon tinggalkan pesan, admin akan membalas segera."];
    }

    private function callGemini($apiKey, $modelName, $messages)
    {
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$modelName}:generateContent?key=" . $apiKey;

        // Gemini REST API format expects:
        // { "contents": [ { "role": "user", "parts": [{ "text": "Hi" }] } ], "systemInstruction": { "parts": [{"text": "You are a CS"}] } }
        
        // Extract system instruction if provided (we'll pass it as the first message with role 'system')
        $systemInstruction = null;
        $geminiContents = [];
        
        foreach ($messages as $msg) {
            if ($msg['role'] === 'system') {
                $systemInstruction = [
                    "role" => "model", // System instructions are technically part of the model's persona, but Gemini 1.5 has a dedicated field
                    "parts" => [["text" => $msg['content']]]
                ];
            }
            if ($msg['role'] !== 'system') {
                $role = $msg['role'] === 'user' ? 'user' : 'model';
                
                $parts = [];
                // Text part
                $textContent = $msg['content'];
                if (empty($textContent) && isset($msg['base64'])) {
                    $textContent = "[Pengguna mengirimkan gambar]";
                }
                if (!empty($textContent)) {
                    $parts[] = ["text" => $textContent];
                }

                // Image part
                if (isset($msg['base64'])) {
                    $base64Clean = str_replace('data:' . $msg['mimetype'] . ';base64,', '', $msg['base64']);
                    $base64Clean = preg_replace('/^data:image\/\w+;base64,/', '', $base64Clean);
                    $parts[] = [
                        "inlineData" => [
                            "mimeType" => $msg['mimetype'] ?? 'image/jpeg',
                            "data" => $base64Clean
                        ]
                    ];
                }

                $geminiContents[] = [
                    "role" => $role,
                    "parts" => $parts
                ];
            }
        }

        $temperature = (float) (ApiKey::where('provider', 'system')->where('name', 'ai_temperature')->value('key') ?? 0.7);
        $maxTokens = (int) (ApiKey::where('provider', 'system')->where('name', 'ai_max_tokens')->value('key') ?? 800);

        $payload = [
            "contents" => $geminiContents,
            "generationConfig" => [
                "temperature" => $temperature,
                "maxOutputTokens" => $maxTokens,
            ],
            "tools" => [
                [
                    "functionDeclarations" => [
                        [
                            "name" => "escalateToAdmin",
                            "description" => "Escalates the conversation to a human administrator. Call this ONLY when the customer is very angry, uses inappropriate language, or explicitly asks to speak to a human administrator.",
                            "parameters" => [
                                "type" => "OBJECT",
                                "properties" => [
                                    "alasan_eskalasi" => [
                                        "type" => "STRING",
                                        "description" => "Alasan eskalasi (misal: Pelanggan marah besar / meminta bicara dengan admin manusia)."
                                    ]
                                ],
                                "required" => ["alasan_eskalasi"]
                            ]
                        ],
                        [
                            "name" => "createTicket",
                            "description" => "Creates a troubleshooting ticket for the customer. CALL THIS ONLY WHEN REQUIRED PARAMETERS (kendala_atau_foto, lokasi_pasti, penanganan_awal) HAVE BEEN FULLY PROVIDED BY THE CUSTOMER IN CHAT. DO NOT CALL IF MODEM PHOTO/PROBLEM OR LOCATION IS MISSING!",
                            "parameters" => [
                                "type" => "OBJECT",
                                "properties" => [
                                    "kendala_atau_foto" => [
                                        "type" => "STRING",
                                        "description" => "Detail kendala / foto modem / kondisi lampu router yang disampaikan pelanggan."
                                    ],
                                    "lokasi_pasti" => [
                                        "type" => "STRING",
                                        "description" => "Shareloc WA asli, link Google Maps, atau alamat detail rumah yang dikirimkan pelanggan."
                                    ],
                                    "penanganan_awal" => [
                                        "type" => "STRING",
                                        "description" => "Hasil percobaan restart modem 5 menit (misal: 'Sudah dicabut 5 menit tetap lelet')."
                                    ]
                                ],
                                "required" => ["kendala_atau_foto", "lokasi_pasti", "penanganan_awal"]
                            ]
                        ],
                        [
                            "name" => "forwardToAdminGroup",
                            "description" => "Forwards a completed New Installation (PSB) application to Sales/Admin Group. CALL THIS ONLY WHEN ALL REQUIRED PARAMETERS (NAME, LOCATION, KTP, PAKET_DIPILIH) ARE FULLY GATHERED IN CHAT.",
                            "parameters" => [
                                "type" => "OBJECT",
                                "properties" => [
                                    "kategori" => [
                                        "type" => "STRING",
                                        "description" => "Kategori laporan: Pasang Baru (PSB)"
                                    ],
                                    "nama_pemohon" => [
                                        "type" => "STRING",
                                        "description" => "Nama lengkap calon pelanggan pasang baru."
                                    ],
                                    "alamat_pemasangan" => [
                                        "type" => "STRING",
                                        "description" => "Alamat lokasi rumah / shareloc WA / link Maps untuk pemasangan."
                                    ],
                                    "paket_dipilih" => [
                                        "type" => "STRING",
                                        "description" => "Pilihan paket kecepatan internet yang dipilih pelanggan dari Knowledge Base (misal: 20 Mbps / 30 Mbps)."
                                    ],
                                    "status_ktp" => [
                                        "type" => "STRING",
                                        "description" => "Konfirmasi bahwa foto KTP sudah dikirim oleh pelanggan."
                                    ],
                                    "ringkasan" => [
                                        "type" => "STRING",
                                        "description" => "Ringkasan lengkap permohonan pasang baru."
                                    ]
                                ],
                                "required" => ["kategori", "nama_pemohon", "alamat_pemasangan", "paket_dipilih", "status_ktp", "ringkasan"]
                            ]
                        ]
                    ]
                ]
            ]
        ];

        if ($systemInstruction) {
            $payload['systemInstruction'] = $systemInstruction;
        }

        $response = Http::timeout(60)->post($url, $payload);

        if ($response->successful()) {
            $data = $response->json();
            $parts = $data['candidates'][0]['content']['parts'] ?? [];
            
            $functionCall = null;
            $textParts = [];

            foreach ($parts as $part) {
                if (isset($part['functionCall'])) {
                    $functionCall = $part['functionCall'];
                } elseif (isset($part['text'])) {
                    $textParts[] = $part['text'];
                }
            }

            if ($functionCall) {
                \Illuminate\Support\Facades\Log::info('Gemini Function Call Response:', ['response' => $data]);
                return [
                    'type' => 'function_call',
                    'name' => $functionCall['name'],
                    'args' => $functionCall['args'] ?? []
                ];
            } elseif (!empty($textParts)) {
                \Illuminate\Support\Facades\Log::info('Gemini Text Response:', ['response' => $data, 'payload_sent' => $payload]);
                return [
                    'type' => 'text',
                    'text' => implode("\n", $textParts)
                ];
            }
            throw new \Exception("Empty or malformed response format");
        }

        throw new \Exception("HTTP Error: " . $response->status() . " - " . $response->body());
    }
}
