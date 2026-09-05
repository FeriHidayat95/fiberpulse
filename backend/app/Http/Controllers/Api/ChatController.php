<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\WaConversation;
use App\Models\WaMessage;
use App\Services\EvolutionService;

class ChatController extends Controller
{
    public function getConversations(Request $request)
    {
        $conversations = WaConversation::with(['messages' => function($query) {
            $query->orderBy('created_at', 'desc')->limit(1);
        }])->orderBy('last_message_at', 'desc')->get();

        return response()->json($conversations);
    }

    public function getMessages($id)
    {
        $conversation = WaConversation::findOrFail($id);
        $messages = $conversation->messages()->orderBy('created_at', 'asc')->get();

        // Clear unread count when admin opens chat
        $conversation->unread_count = 0;
        $conversation->save();

        return response()->json([
            'conversation' => $conversation,
            'messages' => $messages
        ]);
    }

    public function sendMessage(Request $request, $id, EvolutionService $evoService)
    {
        $request->validate(['message' => 'required|string']);
        
        $conversation = WaConversation::findOrFail($id);

        try {
            // Send via Evolution API
            $remoteJid = $conversation->phone_number . '@s.whatsapp.net';
            // Need to append country code if not present, but our DB stores it mostly without @.
            // Wait, remoteJid for Indonesian numbers usually is 628xxx@s.whatsapp.net. 
            // In DB we store phone_number from Evolution which already has country code.
            
            $evoService->sendText($remoteJid, $request->message);

            // Save to DB
            $message = WaMessage::create([
                'wa_conversation_id' => $conversation->id,
                'sender_type' => 'admin',
                'message' => $request->message,
                'status' => 'sent'
            ]);

            // Extend Handover Duration since Admin replied via Dashboard
            $handoverSetting = \App\Models\ApiKey::where('provider', 'system')->where('name', 'ai_handover_duration')->first();
            $durationMinutes = $handoverSetting ? (int) $handoverSetting->key : 120;
            
            if ($durationMinutes === 0) {
                $conversation->ai_paused_until = now()->addYears(10);
            } else {
                $conversation->ai_paused_until = now()->addMinutes($durationMinutes);
            }
            $conversation->last_message_at = now();
            $conversation->save();

            return response()->json(['message' => $message]);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Failed to send message: ' . $e->getMessage()], 500);
        }
    }

    public function toggleAi(Request $request, $id)
    {
        $request->validate(['is_paused' => 'required|boolean']);
        
        $conversation = WaConversation::findOrFail($id);
        
        if ($request->is_paused) {
            // Pause AI for 10 years (effectively manual off)
            $conversation->ai_paused_until = now()->addYears(10);
        } else {
            // Resume AI immediately
            $conversation->ai_paused_until = null;
            \Illuminate\Support\Facades\Cache::forget('ai_soft_reply_' . $conversation->phone_number);
            \Illuminate\Support\Facades\Cache::forget('ai_warned_' . $conversation->id);
        }
        
        $conversation->save();
        return response()->json(['conversation' => $conversation]);
    }

    public function takeoverAllAi(Request $request)
    {
        WaConversation::query()->update(['ai_paused_until' => null]);
        
        // Clear all soft-reply / handover caches
        \Illuminate\Support\Facades\Cache::flush();
        
        return response()->json([
            'success' => true,
            'message' => 'Seluruh kontak percakapan berhasil dialihkan (Takeover) ke AI CS.'
        ]);
    }

    public function clearAll(Request $request)
    {
        \Illuminate\Support\Facades\DB::statement('TRUNCATE TABLE wa_messages, wa_conversations RESTART IDENTITY CASCADE;');
        \Illuminate\Support\Facades\Cache::flush();

        return response()->json([
            'success' => true,
            'message' => 'Seluruh riwayat pesan dan percakapan kontak berhasil dihapus total.'
        ]);
    }
}
