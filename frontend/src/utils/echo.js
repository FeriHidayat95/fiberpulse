import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY || 'pusher-key-placeholder',
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'ap1',
    wsHost: import.meta.env.VITE_PUSHER_HOST || '192.168.90.14',
    wsPort: import.meta.env.VITE_PUSHER_PORT || 8080,
    wssPort: import.meta.env.VITE_PUSHER_PORT || 8080,
    forceTLS: false,
    disableStats: true,
});
