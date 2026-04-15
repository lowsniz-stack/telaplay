import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../lib/api';

const POLL_MS = 30_000;

export function usePlayerContent(shareToken) {
  const [items, setItems] = useState(() => {
    // Inicializar com cache local se existir
    try {
      const cached = localStorage.getItem(`signage_cache_${shareToken}`);
      return cached ? JSON.parse(cached) : [];
    } catch { return []; }
  });
  const [screenName, setScreenName] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const lastUpdatedAt = useRef(null);

  const fetchContent = useCallback(async (force = false) => {
    try {
      const { data } = await api.get(`/player/${shareToken}`);

      // Evitar re-render desnecessário se conteúdo não mudou
      const updatedAt = data.playlist?.updatedAt;
      if (!force && updatedAt === lastUpdatedAt.current) return;
      lastUpdatedAt.current = updatedAt;

      setScreenName(data.screen?.name || '');

      if (data.items?.length > 0) {
        // Pré-carregar imagens
        data.items.forEach(item => {
          if (item.media.type === 'IMAGE') {
            const img = new window.Image();
            img.src = item.media.url;
          }
        });

        setItems(data.items);
        setError(null);

        // Atualizar cache
        try {
          localStorage.setItem(`signage_cache_${shareToken}`, JSON.stringify(data.items));
        } catch (_) {}
      } else {
        if (items.length === 0) setError('Nenhum conteúdo configurado para esta tela.');
      }
    } catch (err) {
      console.warn('Fetch falhou, usando cache:', err.message);
      if (items.length === 0) setError('Sem conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    fetchContent(true);
    const poll = setInterval(() => fetchContent(), POLL_MS);
    return () => clearInterval(poll);
  }, [fetchContent]);

  return { items, screenName, error, loading, refetch: () => fetchContent(true) };
}
