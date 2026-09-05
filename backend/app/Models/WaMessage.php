<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'wa_conversation_id',
        'message_id',
        'sender_type',
        'message',
        'status',
    ];

    public function conversation()
    {
        return $this->belongsTo(WaConversation::class, 'wa_conversation_id');
    }
}
