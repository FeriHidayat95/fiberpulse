<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Jobs\ProcessWhatsAppMessage;

class WebhookController extends Controller
{
    public function evolution(Request $request)
    {
        // 1. Immediately return 200 OK so Evolution API doesn't timeout
        // But first, dispatch the job to the queue
        
        $payload = $request->all();
        
        // Log for debugging
        Log::info('Received Webhook from Evolution', ['payload' => json_encode($payload)]);
        
        // Ensure the event is a message
        if (isset($payload['event']) && $payload['event'] === 'messages.upsert') {
            // Usually, evolution sends an array of messages or a single message object
            $messageData = $payload['data'] ?? null;
            
            if ($messageData) {
                // Dispatch background job
                ProcessWhatsAppMessage::dispatch($messageData);
            }
        }
        
        return response()->json(['status' => 'success']);
    }
}
