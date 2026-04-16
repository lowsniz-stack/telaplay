import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../lib/api';
import TickerBar from '../components/components/TickerBar';

const POLL_INTERVAL = 30_000; // fallback polling se WS cair
const WS_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001/api')
  .replace(/^http/, 'ws')
  .replace('/api', '/ws');

export default function PlayerPage() {
  const { shareToken } = useParams();
  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [error, setError] = useState(null);
  const [playlistUpdatedAt, setPlaylistUpdatedAt] = useState(null);

  const timerRef = useRef(null);
  const wsRef = useRef(null);
  const playlistRef = useRef(null);

  // ── Buscar conteúdo da API ──────────────────────────────────────────────
  const fetchContent = useCallback(async () => {
    try {
      const { data } = await api.get(`/player/${shareToken}`);

      // Só recarregar se a playlist mudou
      if (data.playlist?.updatedAt === playlistRef.current) return;
      playlistRef.current = data.playlist?.updatedAt;

      if (data.items?.length > 0) {
        // Pré-carregar mídias no cache do browser
        data.items.forEach(item => {
          if (item.media.type === 'IMAGE') {
            const img = new window.Image();
            img.src = item.media.url;
          }
        });

        setItems(data.items);
        setCurrentIndex(0);
        setError(null);

        // Cache local para resiliência offline
        try {
          localStorage.setItem(`signage_cache_${shareToken}`, JSON.stringify(data.items));
        } catch (_) {}
      } else {
        setError('Nenhum conteúdo configurado para esta tela.');
      }

      setPlaylistUpdatedAt(data.playlist?.updatedAt);
    } catch (err) {
      console.error('Erro ao buscar conteúdo:', err);

      // Tentar cache local
      try {
        const cached = localStorage.getItem(`signage_cache_${shareToken}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.length > 0) setItems(parsed);
          return;
        }
      } catch (_) {}

      setError('Sem conexão. Tentando reconectar...');
    }
  }, [shareToken]);

  // ── WebSocket para atualização em tempo real ────────────────────────────
  useEffect(() => {
    function connect() {
      const ws = new WebSocket(`${WS_URL}?token=${shareToken}`);
      wsRef.current = ws;

      const ping = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'PING' }));
        }
      }, 25_000);

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'PLAYLIST_UPDATED') fetchContent();
        } catch (_) {}
      };

      ws.onerror = () => ws.close();

      ws.onclose = () => {
        clearInterval(ping);
        setTimeout(connect, 5000);
      };
    }

    connect();
    return () => wsRef.current?.close();
  }, [shareToken, fetchContent]);

  // ── Polling de fallback ─────────────────────────────────────────────────
  useEffect(() => {
    fetchContent();
    const poll = setInterval(fetchContent, POLL_INTERVAL);
    return () => clearInterval(poll);
  }, [fetchContent]);

  // ── Avançar item da playlist ────────────────────────────────────────────
  const advance = useCallback(() => {
    if (items.length === 0) return;

    setFade(false);

    setTimeout(() => {
      setCurrentIndex(i => (i + 1) % items.length);
      setFade(true);
    }, 400);
  }, [items.length]);

  // ── Timer por item ──────────────────────────────────────────────────────
  useEffect(() => {
    if (items.length === 0) return;

    const item = items[currentIndex];
    const duration = (item?.duration || 10) * 1000;

    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(advance, duration);

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, items, advance]);

  const currentItem = items[currentIndex];
  const media = currentItem?.media;

  // ── Tela sem conteúdo / erro ────────────────────────────────────────────
  if (error && items.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
          </div>
          <p className="text-white/50 text-sm">{error}</p>
          <p className="text-white/30 text-xs mt-2">{shareToken}</p>
        </div>
      </div>
    );
  }

  if (!media) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black overflow-hidden"
      style={{ cursor: 'none' }}
    >
      {/* Mídia atual com fade */}
      <div
        className="w-full h-full transition-opacity duration-400"
        style={{ opacity: fade ? 1 : 0 }}
      >
        {media.type === 'IMAGE' ? (
          <img
            key={media.id}
            src={media.url}
            alt={media.name}
            className="w-full h-full object-cover"
            onError={advance}
          />
        ) : (
          <video
            key={media.id}
            src={media.url}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            onEnded={advance}
            onError={advance}
          />
        )}
      </div>

      {/* Indicador de progresso (pontos) */}
      {items.length > 1 && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-40">
          {items.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === currentIndex ? 20 : 6,
                height: 6,
                backgroundColor: i === currentIndex
                  ? 'rgba(255,255,255,0.9)'
                  : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {/* Barra inferior fixa */}
      <TickerBar />
    </div>
  );
}