import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Monitor, Clock } from 'lucide-react';
import api from '../lib/api';

function formatDate(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function LogsPage() {
  const [screenFilter, setScreenFilter] = useState('');

  const { data: screens = [] } = useQuery({
    queryKey: ['screens'],
    queryFn: () => api.get('/screens').then(r => r.data),
  });

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['logs', screenFilter],
    queryFn: () => api.get('/logs', {
      params: { ...(screenFilter && { screenId: screenFilter }), limit: 200 },
    }).then(r => r.data),
    refetchInterval: 20_000,
  });

  const eventColors = {
    PLAYLIST_UPDATED: 'bg-blue-50 text-blue-700',
    SCREEN_ONLINE:    'bg-emerald-50 text-emerald-700',
    SCREEN_OFFLINE:   'bg-gray-100 text-gray-500',
    MEDIA_PLAYED:     'bg-violet-50 text-violet-700',
    ERROR:            'bg-red-50 text-red-600',
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Logs de Exibição</h1>
          <p className="text-sm text-gray-500 mt-1">{logs.length} eventos registrados</p>
        </div>
        <select
          value={screenFilter}
          onChange={e => setScreenFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas as telas</option>
          {screens.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        {isLoading ? (
          <div className="divide-y divide-gray-50">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="flex items-center gap-4 px-6 py-3.5 animate-pulse">
                <div className="w-20 h-5 bg-gray-100 rounded-full" />
                <div className="flex-1 h-4 bg-gray-100 rounded" />
                <div className="w-28 h-4 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center">
            <ScrollText size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Nenhum log registrado</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {logs.map(log => (
              <div key={log.id} className="flex items-center gap-4 px-6 py-3">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${eventColors[log.event] || 'bg-gray-100 text-gray-600'}`}>
                  {log.event}
                </span>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <Monitor size={13} className="text-gray-300 flex-shrink-0" />
                  <span className="text-sm text-gray-600 truncate">{log.screen?.name || log.screenId}</span>
                  {log.metadata?.mediaName && (
                    <span className="text-xs text-gray-400 truncate">· {log.metadata.mediaName}</span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
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
