import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tv, Search, RefreshCw } from 'lucide-react';
import api from '../lib/api';
import MiniPlayer from '../components/screens/MiniPlayer';

export default function PreviewPage() {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  const { data: screens = [], isLoading, refetch } = useQuery({
    queryKey: ['screens'],
    queryFn: () => api.get('/screens').then(r => r.data),
    refetchInterval: 30_000,
  });

  const groups = [...new Set(screens.map(s => s.group).filter(Boolean))];

  const filtered = screens.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const matchGroup = !groupFilter || s.group === groupFilter;
    return matchSearch && matchGroup;
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Preview das Telas</h1>
          <p className="text-sm text-gray-500 mt-1">
            Visualização em tempo real de {screens.length} monitor{screens.length !== 1 ? 'es' : ''}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 text-sm border border-gray-200 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tela..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {groups.length > 0 && (
          <select
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
            className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Todos os grupos</option>
            {groups.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="bg-gray-100" style={{ paddingBottom: '56.25%' }} />
              <div className="p-3"><div className="h-3 bg-gray-100 rounded w-2/3" /></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center">
          <Tv size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Nenhuma tela encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(screen => (
            <MiniPlayer
              key={screen.id}
              shareToken={screen.shareToken}
              screenName={screen.name}
              status={screen.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
