import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  .replace(/^http/, 'ws')
  .replace('/api', '/ws');

/**
 * useSignageSocket — conecta ao WebSocket e chama onMessage ao receber eventos.
 * Reconecta automaticamente. Envia PING a cada 25s para manter vivo.
 *
 * @param {string|null} token — shareToken da tela (null = desconectado)
 * @param {(msg: object) => void} onMessage
 */
export function useSignageSocket(token, onMessage) {
  const wsRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        onMessageRef.current?.(msg);
      } catch (_) {}
    };

    let pingInterval;
    ws.onopen = () => {
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25_000);
    };

    ws.onclose = () => {
      clearInterval(pingInterval);
      setTimeout(connect, 5000);
    };

    ws.onerror = () => ws.close();
  }, [token]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, [connect]);
}
