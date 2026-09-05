import { useEffect, useState, useCallback } from 'react';
import { simulatedSocket } from '@/lib/simulatedWebSocket';

export function useWebSocketStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    simulatedSocket.connect();
    const unsub = simulatedSocket.onStatusChange(setConnected);
    return () => {
      unsub();
      simulatedSocket.disconnect();
    };
  }, []);

  return connected;
}
