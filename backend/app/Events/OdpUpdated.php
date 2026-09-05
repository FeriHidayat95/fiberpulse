<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OdpUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $odp;

    public function __construct($odp)
    {
        $this->odp = $odp;
    }

    public function broadcastOn()
    {
        return new Channel('odp-updates');
    }

    public function broadcastAs()
    {
        return 'OdpUpdated';
    }
}
