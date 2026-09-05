<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WaConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'phone_number',
        'customer_name',
        'ai_paused_until',
        'last_message_at',
        'unread_count',
    ];

    protected $casts = [
        'ai_paused_until' => 'datetime',
        'last_message_at' => 'datetime',
    ];

    public function messages()
    {
        return $this->hasMany(WaMessage::class);
    }
}
