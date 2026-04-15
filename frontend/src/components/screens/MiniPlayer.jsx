import { useState, useEffect, useRef } from 'react';
import { Monitor, Film, Image, Wifi, WifiOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api';
import clsx from 'clsx';

/**
 * MiniPlayer — exibe preview em miniatura do que está sendo mostrado na tela.
 * Troca de item automaticamente no mesmo ritmo do player real.
 */
export default function MiniPlayer({ shareToken, screenName, status }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ['player-preview', shareToken],
    queryFn: () => api.get(`/player/${shareToken}`).then(r => r.data),
    refetchInterval: 30_000,
    enabled: !!shareToken,
  });

  const items = data?.items || [];
  const current = items[currentIndex];

  useEffect(() => {
    if (items.length <= 1) return;
    const duration = (current?.duration || 10) * 1000;
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setFade(false);
      setTimeout(() => {
        setCurrentIndex(i => (i + 1) % items.length);
        setFade(true);
      }, 300);
    }, duration);
    return () => clearTimeout(timerRef.current);
  }, [currentIndex, items, current]);

  const online = status === 'ONLINE';

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      {/* Preview 16:9 */}
      <div className="relative bg-gray-900" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            </div>
          ) : !current ? (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Monitor size={22} className="text-white/20" />
              <span className="text-xs text-white/30">Sem conteúdo</span>
            </div>
          ) : (
            <div
              className="w-full h-full transition-opacity duration-300"
              style={{ opacity: fade ? 1 : 0 }}
            >
              {current.media.type === 'IMAGE' ? (
                <img
                  src={current.media.thumbnailUrl || current.media.url}
                  alt={current.media.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full bg-gray-800">
                  {current.media.thumbnailUrl ? (
                    <img
                      src={current.media.thumbnailUrl}
                      alt={current.media.name}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film size={20} className="text-white/30" />
                    </div>
                  )}
                  <div className="absolute bottom-1.5 right-1.5 bg-black/60 rounded px-1.5 py-0.5">
                    <Film size={10} className="text-white/70 inline mr-1" />
                    <span className="text-xs text-white/70">vídeo</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status badge sobreposto */}
          <div className="absolute top-2 left-2">
            <span className={clsx(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm',
              online
                ? 'bg-emerald-500/90 text-white'
                : 'bg-black/40 text-white/60'
            )}>
              {online ? <Wifi size={9} /> : <WifiOff size={9} />}
              {online ? 'Ao vivo' : 'Offline'}
            </span>
          </div>

          {/* Indicador de itens */}
          {items.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {items.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-200"
                  style={{
                    width: i === currentIndex ? 12 : 4,
                    height: 4,
                    backgroundColor: i === currentIndex ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)',
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info abaixo do preview */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-gray-800 truncate">{screenName}</p>
        {current && (
          <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
            {current.media.type === 'IMAGE' ? <Image size={10} /> : <Film size={10} />}
            {current.duration || current.media?.duration}s
          </span>
        )}
      </div>
    </div>
  );
}
