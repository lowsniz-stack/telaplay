import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  Monitor,
  Clock,
  CalendarDays,
  Film,
  Image as ImageIcon,
  ScrollText,
} from 'lucide-react';
import api from '../lib/api';

function formatDate(iso) {
  if (!iso) return '-';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStartDate(period) {
  const now = new Date();

  if (period === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return start;
  }

  if (period === '7d') {
    const start = new Date(now);
    start.setDate(now.getDate() - 7);
    return start;
  }

  if (period === '30d') {
    const start = new Date(now);
    start.setDate(now.getDate() - 30);
    return start;
  }

  return null;
}

function getMediaIcon(type) {
  const mediaType = String(type || '').toUpperCase();

  if (mediaType.includes('VIDEO')) {
    return <Film size={14} className="text-gray-400" />;
  }

  return <ImageIcon size={14} className="text-gray-400" />;
}

export default function LogsPage() {
  const [screenFilter, setScreenFilter] = useState('');
  const [period, setPeriod] = useState('7d');

  const {
    data: screens = [],
    isLoading: loadingScreens,
  } = useQuery({
    queryKey: ['screens'],
    queryFn: async () => {
      const res = await api.get('/screens');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const {
    data: logs = [],
    isLoading: loadingLogs,
  } = useQuery({
    queryKey: ['logs', screenFilter],
    queryFn: async () => {
      const res = await api.get('/logs', {
        params: {
          ...(screenFilter ? { screenId: screenFilter } : {}),
          limit: 500,
        },
      });

      return Array.isArray(res.data) ? res.data : [];
    },
    refetchInterval: 20000,
  });

  const filteredLogs = useMemo(() => {
    const startDate = getStartDate(period);

    return logs.filter((log) => {
      if (!log || log.event !== 'MEDIA_STARTED') return false;
      if (!startDate) return true;

      const createdAt = new Date(log.createdAt);
      if (Number.isNaN(createdAt.getTime())) return false;

      return createdAt >= startDate;
    });
  }, [logs, period]);

  const summary = useMemo(() => {
    const uniqueScreens = new Set();
    const uniqueMedia = new Set();

    filteredLogs.forEach((log) => {
      if (log?.screenId) uniqueScreens.add(log.screenId);
      if (log?.metadata?.mediaId) uniqueMedia.add(log.metadata.mediaId);
    });

    return {
      totalExibicoes: filteredLogs.length,
      totalTelas: uniqueScreens.size,
      totalMidias: uniqueMedia.size,
    };
  }, [filteredLogs]);

  const groupedByMedia = useMemo(() => {
    const map = new Map();

    filteredLogs.forEach((log) => {
      const metadata = log?.metadata || {};
      const mediaId = metadata.mediaId || `sem-id-${log.id}`;
      const mediaName = metadata.mediaName || 'Mídia sem nome';
      const mediaType = metadata.mediaType || 'IMAGE';
      const playlistName = metadata.playlistName || '-';
      const screenName = log?.screen?.name || metadata.screenName || '-';

      if (!map.has(mediaId)) {
        map.set(mediaId, {
          mediaId,
          mediaName,
          mediaType,
          playlistName,
          totalExibicoes: 0,
          ultimaExibicao: log.createdAt,
          telas: new Set(),
        });
      }

      const item = map.get(mediaId);
      item.totalExibicoes += 1;
      item.telas.add(screenName);

      const currentDate = new Date(log.createdAt);
      const savedDate = new Date(item.ultimaExibicao);

      if (!Number.isNaN(currentDate.getTime()) && !Number.isNaN(savedDate.getTime())) {
        if (currentDate > savedDate) {
          item.ultimaExibicao = log.createdAt;
        }
      }
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        telas: Array.from(item.telas),
      }))
      .sort((a, b) => b.totalExibicoes - a.totalExibicoes);
  }, [filteredLogs]);

  const recentLogs = useMemo(() => {
    return [...filteredLogs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 20);
  }, [filteredLogs]);

  const isLoading = loadingScreens || loadingLogs;

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Relatório comercial
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Acompanhe exibições por mídia, tela e período
          </p>
        </div>

        <div className="flex gap-3">
          <select
            value={screenFilter}
            onChange={(e) => setScreenFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todas as telas</option>
            {screens.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="all">Todo período</option>
          </select>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-indigo-50 p-2.5">
              <BarChart3 size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total de exibições</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.totalExibicoes}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <Monitor size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Telas com atividade</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.totalTelas}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-violet-50 p-2.5">
              <ScrollText size={18} className="text-violet-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Mídias exibidas</p>
              <p className="text-2xl font-semibold text-gray-900">
                {summary.totalMidias}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Ranking por mídia
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Quantas vezes cada mídia foi exibida
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-gray-400">Carregando relatório...</div>
        ) : groupedByMedia.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhuma exibição encontrada no período selecionado.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {groupedByMedia.map((item, index) => (
              <div key={item.mediaId} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 flex-shrink-0 text-sm font-semibold text-gray-400">
                  #{index + 1}
                </div>

                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="rounded-lg bg-gray-50 p-2">
                    {getMediaIcon(item.mediaType)}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {item.mediaName}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      Playlist: {item.playlistName}
                    </p>
                    <p className="truncate text-xs text-gray-400">
                      Telas: {item.telas.join(', ')}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-semibold text-indigo-600">
                    {item.totalExibicoes}
                  </p>
                  <p className="text-xs text-gray-400">exibições</p>
                </div>

                <div className="min-w-[120px] text-right text-xs text-gray-400">
                  <div className="flex items-center justify-end gap-1">
                    <CalendarDays size={12} />
                    {formatDate(item.ultimaExibicao)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Últimas exibições
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Eventos recentes registrados no sistema
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-gray-400">Carregando histórico...</div>
        ) : recentLogs.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">
            Nenhum log encontrado.
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3">
                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                  {log.event}
                </span>

                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <Monitor size={13} className="text-gray-300 flex-shrink-0" />
                  <span className="truncate text-sm text-gray-700">
                    {log.screen?.name || log.screenId}
                  </span>

                  {log.metadata?.mediaName && (
                    <span className="truncate text-xs text-gray-400">
                      · {log.metadata.mediaName}
                    </span>
                  )}
                </div>

                <div className="flex flex-shrink-0 items-center gap-1 text-xs text-gray-400">
                  <Clock size={11} />
                  {formatDate(log.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}