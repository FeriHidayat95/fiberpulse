<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ApiKey;
use Illuminate\Http\Request;

class ApiKeyController extends Controller
{
    public function index()
    {
        return response()->json(ApiKey::where('provider', '!=', 'system')->get());
    }

    public function getGlobalStatus()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_cs_enabled'],
            ['key' => 'global_status', 'is_active' => true]
        );
        return response()->json(['is_active' => $setting->is_active]);
    }

    public function toggleGlobalStatus()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_cs_enabled'],
            ['key' => 'global_status', 'is_active' => true]
        );
        $setting->is_active = !$setting->is_active;
        $setting->save();
        return response()->json(['is_active' => $setting->is_active]);
    }

    public function getHandoverDuration()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_handover_duration'],
            ['key' => '120', 'is_active' => true] // default 120 minutes
        );
        return response()->json(['duration' => (int) $setting->key]);
    }

    public function updateHandoverDuration(Request $request)
    {
        $request->validate(['duration' => 'required|integer|min:0']);
        
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_handover_duration'],
            ['key' => '120', 'is_active' => true]
        );
        $setting->key = (string) $request->duration;
        $setting->save();
        return response()->json(['duration' => (int) $setting->key]);
    }

    public function getAiAdvancedConfig()
    {
        $delay = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_typing_delay'],
            ['key' => '1200', 'is_active' => true]
        );
        $model = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_model'],
            ['key' => 'gemini-1.5-flash', 'is_active' => true]
        );
        $temperature = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_temperature'],
            ['key' => '0.7', 'is_active' => true]
        );
        $maxTokens = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_max_tokens'],
            ['key' => '800', 'is_active' => true]
        );
        $persona = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_persona'],
            ['key' => "Kamu adalah Customer Service AI dari ISP Sasikirana Net (FiberPulse).\nATURAN UTAMA:\n1. JIKA PELANGGAN HANYA MENYAPA (Halo/Ping/Siang) atau niatnya BELUM JELAS: JANGAN langsung berasumsi ada gangguan! Sambut dengan hangat selayaknya manusia sungguhan dan tawarkan bantuan (misal: Info Paket, Lapor Gangguan, atau Cek Area).\n2. Gunakan bahasa Indonesia yang santai, luwes, dan natural. SANGAT PENTING: Jawab SEPINGKAT MUNGKIN dan langsung ke intinya (to the point). JANGAN pernah menulis paragraf yang panjang atau bertele-tele (pelanggan malas membaca). Cukup 1-3 kalimat pendek saja.\n3. Selalu utamakan REFERENSI JAWABAN (Knowledge Base) di bawah jika berkaitan dengan pertanyaan pelanggan saat ini.\n4. JIKA DAN HANYA JIKA kamu menjawab menggunakan REFERENSI yang memiliki instruksi [GAMBAR: namafile.jpg], kamu WAJIB menyertakan tag tersebut persis apa adanya di akhir balasanmu. JANGAN sertakan tag gambar jika tidak sedang membahas topik tersebut.\n5. JIKA pelanggan komplain keras, menggunakan kata kasar, ATAU kamu sama sekali tidak menemukan jawaban di referensi, balas dengan sopan bahwa tim manusia akan segera membantu, LALU WAJIB panggil fungsi escalateToAdmin.", 'is_active' => true]
        );

        return response()->json([
            'typing_delay' => (int) $delay->key,
            'model' => $model->key,
            'temperature' => (float) $temperature->key,
            'max_tokens' => (int) $maxTokens->key,
            'persona' => $persona->key,
        ]);
    }

    public function updateAiAdvancedConfig(Request $request)
    {
        $request->validate([
            'typing_delay' => 'required|integer|min:0|max:10000',
            'model' => 'required|string',
            'temperature' => 'required|numeric|min:0.1|max:2.0',
            'max_tokens' => 'required|integer|min:100|max:8192',
            'persona' => 'required|string'
        ]);
        
        $delay = ApiKey::where('provider', 'system')->where('name', 'ai_typing_delay')->first();
        if($delay) { $delay->key = (string) $request->typing_delay; $delay->save(); }
        
        $model = ApiKey::where('provider', 'system')->where('name', 'ai_model')->first();
        if($model) { $model->key = $request->model; $model->save(); }
        
        $temperature = ApiKey::where('provider', 'system')->where('name', 'ai_temperature')->first();
        if($temperature) { $temperature->key = (string) $request->temperature; $temperature->save(); }
        
        $maxTokens = ApiKey::where('provider', 'system')->where('name', 'ai_max_tokens')->first();
        if($maxTokens) { $maxTokens->key = (string) $request->max_tokens; $maxTokens->save(); }
        
        $persona = ApiKey::where('provider', 'system')->where('name', 'ai_persona')->first();
        if($persona) { $persona->key = $request->persona; $persona->save(); }

        return response()->json(['message' => 'Config updated successfully']);
    }

    public function getInstanceName()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'evolution_instance_name'],
            ['key' => 'CS_BOT', 'is_active' => true]
        );
        return response()->json(['instance_name' => $setting->key]);
    }

    public function updateInstanceName(Request $request)
    {
        $request->validate(['instance_name' => 'required|string|max:50|alpha_dash']);
        
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'evolution_instance_name'],
            ['key' => 'CS_BOT', 'is_active' => true]
        );
        $setting->key = trim($request->instance_name);
        $setting->save();

        // Automatically create instance on Evolution API and set webhook
        try {
            $evo = app(\App\Services\EvolutionService::class);
            $evo->createInstance();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to create instance during instance name update', ['error' => $e->getMessage()]);
        }

        return response()->json(['instance_name' => $setting->key]);
    }

    public function getEvolutionConfig()
    {
        $url = ApiKey::firstOrCreate(['provider' => 'system', 'name' => 'evolution_api_url'], ['key' => 'http://127.0.0.1:8080', 'is_active' => true]);
        $key = ApiKey::firstOrCreate(['provider' => 'system', 'name' => 'evolution_api_key'], ['key' => 'global_api_key_or_instance_key', 'is_active' => true]);
        return response()->json([
            'url' => $url->key,
            'key' => $key->key,
            'evolution_api_url' => $url->key,
            'evolution_api_key' => $key->key
        ]);
    }

    public function updateEvolutionConfig(Request $request)
    {
        $rawUrl = $request->input('url') ?? $request->input('evolution_api_url');
        $rawKey = $request->input('key') ?? $request->input('evolution_api_key');

        if (!$rawUrl || !$rawKey) {
            return response()->json(['message' => 'URL Server dan API Key wajib diisi!'], 422);
        }

        $rawUrl = trim($rawUrl);
        if (!preg_match('/^https?:\/\//i', $rawUrl)) {
            $rawUrl = 'http://' . $rawUrl;
        }

        $url = ApiKey::firstOrCreate(['provider' => 'system', 'name' => 'evolution_api_url'], ['key' => 'http://127.0.0.1:8080', 'is_active' => true]);
        $url->key = rtrim($rawUrl, '/');
        $url->save();

        $key = ApiKey::firstOrCreate(['provider' => 'system', 'name' => 'evolution_api_key'], ['key' => 'global_api_key_or_instance_key', 'is_active' => true]);
        $key->key = trim($rawKey);
        $key->save();

        // Automatically configure webhook on the instance
        try {
            $evo = app(\App\Services\EvolutionService::class);
            $evo->setWebhook();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to set webhook during config update', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Konfigurasi Evolution API berhasil disimpan',
            'url' => $url->key,
            'key' => $key->key,
            'evolution_api_url' => $url->key,
            'evolution_api_key' => $key->key
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'provider' => 'required|string',
            'key' => 'required|string',
            'name' => 'nullable|string',
        ]);

        $apiKey = ApiKey::create($validated);
        return response()->json($apiKey, 201);
    }

    public function update(Request $request, ApiKey $apiKey)
    {
        $validated = $request->validate([
            'is_active' => 'boolean',
            'key' => 'string',
            'name' => 'nullable|string',
        ]);

        $apiKey->update($validated);
        return response()->json($apiKey);
    }

    public function destroy(ApiKey $apiKey)
    {
        $apiKey->delete();
        return response()->json(['message' => 'API Key deleted']);
    }

    public function getIgnoredNumbers()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_ignored_numbers'],
            ['key' => '', 'is_active' => true]
        );
        return response()->json(['numbers' => $setting->key]);
    }

    public function updateIgnoredNumbers(Request $request)
    {
        $request->validate(['numbers' => 'nullable|string']);
        
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_ignored_numbers'],
            ['key' => '', 'is_active' => true]
        );
        $setting->key = $request->numbers ?? '';
        $setting->save();
        return response()->json(['numbers' => $setting->key]);
    }

    public function getGroupResponseConfig()
    {
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_allow_groups'],
            ['key' => 'false', 'is_active' => true]
        );
        return response()->json([
            'allow_groups' => ($setting->key === 'true' || $setting->key === '1')
        ]);
    }

    public function updateGroupResponseConfig(Request $request)
    {
        $request->validate(['allow_groups' => 'required|boolean']);
        
        $setting = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_allow_groups'],
            ['key' => 'false', 'is_active' => true]
        );
        $setting->key = $request->allow_groups ? 'true' : 'false';
        $setting->save();
        
        return response()->json([
            'success' => true,
            'allow_groups' => $setting->key === 'true',
            'message' => 'Pengaturan respon grup berhasil diperbarui'
        ]);
    }
    public function getTriageConfig()
    {
        $dbIntegration = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_db_integration'],
            ['key' => 'true', 'is_active' => true]
        );
        $groupId = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_notification_group_id'],
            ['key' => '', 'is_active' => true]
        );
        
        return response()->json([
            'ai_db_integration' => $dbIntegration->key === 'true',
            'ai_notification_group_id' => $groupId->key
        ]);
    }

    public function updateTriageConfig(Request $request)
    {
        $request->validate([
            'ai_db_integration' => 'required|boolean',
            'ai_notification_group_id' => 'nullable|string'
        ]);
        
        $dbIntegration = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_db_integration'],
            ['key' => 'true', 'is_active' => true]
        );
        $dbIntegration->key = $request->ai_db_integration ? 'true' : 'false';
        $dbIntegration->save();

        $groupId = ApiKey::firstOrCreate(
            ['provider' => 'system', 'name' => 'ai_notification_group_id'],
            ['key' => '', 'is_active' => true]
        );
        $groupId->key = $request->ai_notification_group_id ?? '';
        $groupId->save();

        return response()->json(['message' => 'Triage config saved']);
    }


    // Reset error counts for all keys manually
    public function resetErrors()
    {
        ApiKey::where('error_count', '>', 0)->update(['error_count' => 0]);
        return response()->json(['message' => 'Error counts reset']);
    }

    // AI Sandbox Simulation Endpoint (Enterprise Real-Time AI Tester)
    public function simulate(Request $request)
    {
        $request->validate(['message' => 'required|string']);
        $incomingText = trim($request->message);
        $userMsgLower = strtolower($incomingText);

        $startTime = microtime(true);

        // Fetch Knowledge Base
        $knowledgeText = "";
        $faqs = \App\Models\AiKnowledgeBase::where('is_active', true)->limit(20)->get();
        if ($faqs->isNotEmpty()) {
            $knowledgeText = "\n\nREFERENSI JAWABAN (Knowledge Base):\n";
            foreach ($faqs as $item) {
                $knowledgeText .= "- Topik: " . $item->question . "\n  Jawaban: " . $item->answer . "\n";
            }
        }

        $defaultPersona = "Kamu adalah Customer Service AI dari ISP Sasikirana Net (FiberPulse).\n" .
        "1. Jawab SINGKAT, PADAT, dan JELAS (1-3 kalimat).\n" .
        "2. Jika hanya sapaan (Halo/Pagi/Siang), sambut dengan ramah TANPA tag gambar.\n" .
        "3. Jika menanyakan paket/brosur, sampaikan harga dan sertakan tag [GAMBAR: brosur_paket.png].";

        $systemPrompt = ApiKey::where('provider', 'system')->where('name', 'ai_persona')->value('key') ?: $defaultPersona;
        $systemPrompt .= "\n\nATURAN WAKTU MENAMPILKAN PAKET INTERNET (SANGAT PENTING):\n" .
        "Setiap kali kamu menyampaikan pilihan paket internet / harga paket, DILARANG KERAS menggabungkannya dalam 1 kalimat tersambung (seperti '10 Mbps (Rp150rb), 15 Mbps (Rp200rb)...')!\n" .
        "KAMU WAJIB MENULISKAN DAFTAR PAKET DALAM FORMAT LIST BERPELURU (BULLET POINTS) BERSIH SEPERTI BERIKUT:\n\n" .
        "📌 *Pilihan Paket Internet:*\n" .
        "• *10 Mbps* — Rp 150.000 / bulan\n" .
        "• *15 Mbps* — Rp 200.000 / bulan\n" .
        "• *50 Mbps* — Rp 300.000 / bulan\n\n" .
        "✨ *Fasilitas:* 100% True Unlimited (Tanpa FUP) & Gratis Biaya Pasang/Modem!\n";
        $systemPrompt .= $knowledgeText;

        // AIService API Call with multi-key failover
        $aiService = new \App\Services\AIService();
        $history = [
            ['role' => 'system', 'content' => $systemPrompt],
            ['role' => 'user', 'content' => $incomingText]
        ];

        try {
            $response = $aiService->generateResponse($history);
            $replyText = is_array($response) ? ($response['text'] ?? '') : (string) $response;
            if (empty($replyText)) {
                $replyText = "Halo Kak! Selamat datang di layanan pelanggan Sasikirana Net (FiberPulse). Ada yang bisa kami bantu seputar informasi layanan internet atau pendaftaran pasang baru?";
            }
        } catch (\Exception $e) {
            $replyText = "Halo Kak! Selamat datang di layanan pelanggan Sasikirana Net (FiberPulse). Ada yang bisa kami bantu seputar informasi layanan internet atau pendaftaran pasang baru?";
        }

        // Media attachment logic check
        $mediaFilename = null;
        $isGreetingOnly = in_array($userMsgLower, ['hallo', 'halo', 'p', 'tes', 'test', 'pagi', 'selamat pagi', 'siang', 'selamat siang', 'malam', 'selamat malam', 'assalamualaikum', 'ping', 'hi', 'hei', 'permisi']);

        if (!$isGreetingOnly) {
            // Note: 'pasang' is intentionally excluded so 'mau pasang baru' prompts for location first without sending image prematurely
            $packageKeywords = ['brosur', 'harga', 'detail paket', 'list paket', 'pilihan paket', 'biaya', 'kecepatan', 'tarif', 'price', 'rincian', 'daftar paket', 'promo', 'mbps', 'fasilitas'];
            $isAskingPackage = false;
            foreach ($packageKeywords as $kw) {
                if (str_contains($userMsgLower, $kw)) {
                    $isAskingPackage = true;
                    break;
                }
            }

            if ($isAskingPackage) {
                $mediaDir = public_path('media');
                if (\Illuminate\Support\Facades\File::exists($mediaDir)) {
                    $allFiles = \Illuminate\Support\Facades\File::files($mediaDir);
                    // Filter ONLY valid image files (ignoring subdirectories like ktp)
                    $files = array_values(array_filter($allFiles, function($f) {
                        return $f->isFile() && in_array(strtolower($f->getExtension()), ['png', 'jpg', 'jpeg', 'webp']);
                    }));

                    $selectedFile = null;

                    if (str_contains($userMsgLower, 'sekolah') || str_contains($userMsgLower, 'pendidikan') || str_contains($userMsgLower, 'instansi')) {
                        foreach ($files as $f) { if (str_contains($f->getFilename(), '--1--')) { $selectedFile = $f->getFilename(); break; } }
                    } elseif (str_contains($userMsgLower, 'dawuan')) {
                        foreach ($files as $f) { if (str_contains($f->getFilename(), '--3--')) { $selectedFile = $f->getFilename(); break; } }
                    } elseif (str_contains($userMsgLower, 'ciater')) {
                        foreach ($files as $f) { if (str_contains($f->getFilename(), '1694')) { $selectedFile = $f->getFilename(); break; } }
                    }

                    if (!$selectedFile) {
                        foreach ($files as $f) { if (str_contains($f->getFilename(), '--2--')) { $selectedFile = $f->getFilename(); break; } }
                    }
                    if (!$selectedFile && !empty($files)) {
                        $selectedFile = $files[0]->getFilename();
                    }
                    $mediaFilename = $selectedFile;
                }
            }
        }

        $endTime = microtime(true);
        $latencyMs = round(($endTime - $startTime) * 1000);

        return response()->json([
            'incoming_text' => $incomingText,
            'reply_text' => $replyText,
            'media_attached' => $mediaFilename,
            'media_url' => $mediaFilename ? url('media/' . $mediaFilename) : null,
            'function_calls' => $response['function_calls'] ?? [],
            'is_greeting' => $isGreetingOnly,
            'latency_ms' => $latencyMs,
            'status' => 'success'
        ]);
    }

    // Automated Enterprise Scenario Test Suite
    public function testSuite()
    {
        $scenarios = [
            ['id' => 1, 'name' => 'Salam Sapaan (Greeting Bypass)', 'prompt' => 'Hallo', 'expect_media' => false],
            ['id' => 2, 'name' => 'Pertanyaan Paket Residensial', 'prompt' => 'mana detail paketnya', 'expect_media' => true],
            ['id' => 3, 'name' => 'Pertanyaan Paket Sekolah', 'prompt' => 'ada paket untuk sekolah?', 'expect_media' => true],
            ['id' => 4, 'name' => 'Cek Area Sumurgintung', 'prompt' => 'sumur gintung tercover?', 'expect_media' => false],
            ['id' => 5, 'name' => 'Lapor Gangguan Wi-Fi', 'prompt' => 'wifi mati lelet dari kemarin', 'expect_media' => false],
        ];

        $results = [];
        $passedCount = 0;

        foreach ($scenarios as $sc) {
            $req = new Request(['message' => $sc['prompt']]);
            $res = $this->simulate($req)->getData(true);

            $hasMedia = !empty($res['media_attached']);
            $pass = ($sc['expect_media'] === $hasMedia);
            if ($pass) $passedCount++;

            $results[] = [
                'id' => $sc['id'],
                'name' => $sc['name'],
                'prompt' => $sc['prompt'],
                'passed' => $pass,
                'media_attached' => $res['media_attached'],
                'reply_snippet' => mb_substr($res['reply_text'], 0, 100) . '...',
                'latency_ms' => $res['latency_ms']
            ];
        }

        return response()->json([
            'score_percent' => round(($passedCount / count($scenarios)) * 100),
            'passed_count' => $passedCount,
            'total_count' => count($scenarios),
            'scenarios' => $results,
            'executed_at' => now()->toIso8601String()
        ]);
    }
}
