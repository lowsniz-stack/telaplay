import { useQuery } from '@tanstack/react-query';
import { Monitor, ListVideo, Image, Building2, Wifi, WifiOff } from 'lucide-react';
import api from '../lib/api';
import clsx from 'clsx';

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
          <Icon size={16} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
    </div>
  );
}

function ScreenStatusBadge({ status }) {
  const online = status === 'ONLINE';
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
      online ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'
    )}>
      {online ? <Wifi size={11} /> : <WifiOff size={11} />}
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export default function DashboardPage() {
  const { data: screens = [] } = useQuery({
    queryKey: ['screens'],
    queryFn: () => api.get('/screens').then(r => r.data),
    refetchInterval: 30_000,
  });
  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.get('/playlists').then(r => r.data),
  });
  const { data: media = [] } = useQuery({
    queryKey: ['media'],
    queryFn: () => api.get('/media').then(r => r.data),
  });
  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => r.data),
  });

  const onlineCount = screens.filter(s => s.status === 'ONLINE').length;

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral do sistema</p>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Telas cadastradas" value={screens.length} icon={Monitor} color="bg-indigo-500" />
        <StatCard label="Online agora" value={onlineCount} icon={Wifi} color="bg-emerald-500" />
        <StatCard label="Playlists" value={playlists.length} icon={ListVideo} color="bg-violet-500" />
        <StatCard label="Mídias" value={media.length} icon={Image} color="bg-amber-500" />
      </div>

      {/* Lista de telas */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Status das Telas</h2>
        </div>

        {screens.length === 0 ? (
          <div className="py-16 text-center">
            <Monitor size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Nenhuma tela cadastrada</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {screens.map(screen => {
              const playlist = screen.playlists?.[0]?.playlist;
              return (
                <div key={screen.id} className="flex items-center gap-4 px-6 py-3.5">
                  <div className={clsx(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    screen.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-gray-200'
                  )} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{screen.name}</p>
                    <p className="text-xs text-gray-400 truncate">
                      {screen.location || 'Sem localização'} · {screen.company?.name}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400 mb-1 truncate max-w-32">
                      {playlist?.name || 'Sem playlist'}
                    </p>
                    <ScreenStatusBadge status={screen.status} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
