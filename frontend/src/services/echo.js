import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// Initialize Laravel Echo with Reverb WebSockets
const createEchoInstance = () => {
  try {
    const isHttps = window.location.protocol === 'https:';
    const host = import.meta.env.VITE_REVERB_HOST || window.location.hostname || 'localhost';
    const port = import.meta.env.VITE_REVERB_PORT ? parseInt(import.meta.env.VITE_REVERB_PORT) : 8080;
    const wssPort = import.meta.env.VITE_REVERB_WSS_PORT ? parseInt(import.meta.env.VITE_REVERB_WSS_PORT) : (isHttps ? 443 : port);

    return new Echo({
      broadcaster: 'reverb',
      key: import.meta.env.VITE_REVERB_APP_KEY || 'fiberpulse_key',
      wsHost: host,
      wsPort: port,
      wssPort: wssPort,
      forceTLS: isHttps,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
    });
  } catch (error) {
    console.warn('WebSocket Reverb offline/disabled, running in fallback HTTP polling mode.');
    return null;
  }
};

export const echo = createEchoInstance();
