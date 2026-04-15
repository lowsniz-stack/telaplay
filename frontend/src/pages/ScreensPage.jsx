import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Monitor, Plus, Link2, Wifi, WifiOff, Trash2, ExternalLink, Copy } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export default function ScreensPage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [showLink, setShowLink] = useState(null); // screen selecionada para vincular
  const [form, setForm] = useState({ name: '', location: '', group: '', companyId: '' });

  const { data: screens = [], isLoading } = useQuery({
    queryKey: ['screens'],
    queryFn: () => api.get('/screens').then(r => r.data),
    refetchInterval: 30_000,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => r.data),
  });

  const { data: playlists = [] } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.get('/playlists').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/screens', data),
    onSuccess: () => {
      qc.invalidateQueries(['screens']);
      setShowCreate(false);
      setForm({ name: '', location: '', group: '', companyId: '' });
      toast.success('Tela criada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro ao criar tela'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/screens/${id}`),
    onSuccess: () => { qc.invalidateQueries(['screens']); toast.success('Tela removida'); },
  });

  const linkMutation = useMutation({
    mutationFn: ({ screenId, playlistId }) =>
      api.post(`/screens/${screenId}/playlists`, { playlistId }),
    onSuccess: () => { qc.invalidateQueries(['screens']); toast.success('Playlist vinculada!'); setShowLink(null); },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  function copyPlayerLink(screen) {
    const url = `${window.location.origin}/player/${screen.shareToken}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  }

  function openPlayer(screen) {
    window.open(`/player/${screen.shareToken}`, '_blank');
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Telas</h1>
          <p className="text-sm text-gray-500 mt-1">{screens.length} monitores cadastrados</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} /> Nova tela
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="bg-white rounded-xl border border-gray-100 h-40 animate-pulse" />)}
        </div>
      ) : screens.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center">
          <Monitor size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Nenhuma tela cadastrada ainda</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 text-indigo-600 text-sm font-medium hover:underline">
            Adicionar primeira tela
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {screens.map(screen => {
            const online = screen.status === 'ONLINE';
            const playlist = screen.playlists?.[0]?.playlist;
            return (
              <div key={screen.id} className="bg-white rounded-xl border border-gray-100 p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      'w-9 h-9 rounded-lg flex items-center justify-center',
                      online ? 'bg-emerald-50' : 'bg-gray-50'
                    )}>
                      <Monitor size={18} className={online ? 'text-emerald-600' : 'text-gray-300'} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{screen.name}</p>
                      <p className="text-xs text-gray-400">{screen.location || 'Sem localização'}</p>
                    </div>
                  </div>
                  <span className={clsx(
                    'flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
                    online ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'
                  )}>
                    {online ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {online ? 'Online' : 'Offline'}
                  </span>
                </div>

                {/* Playlist atual */}
                <div className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">Playlist ativa</p>
                  <p className="text-sm font-medium text-gray-700">{playlist?.name || 'Sem playlist vinculada'}</p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLink(screen)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs border border-gray-200 rounded-lg py-1.5 text-gray-600 hover:bg-gray-50 transition"
                  >
                    <Link2 size={13} /> Vincular playlist
                  </button>
                  <button
                    onClick={() => copyPlayerLink(screen)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    title="Copiar link do player"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    onClick={() => openPlayer(screen)}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition"
                    title="Abrir player"
                  >
                    <ExternalLink size={13} />
                  </button>
                  <button
                    onClick={() => { if (confirm('Remover tela?')) deleteMutation.mutate(screen.id); }}
                    className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition"
                    title="Remover"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal criar tela */}
      {showCreate && (
        <Modal title="Nova tela" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Elevador A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa</label>
              <select
                value={form.companyId}
                onChange={e => setForm(f => ({ ...f, companyId: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecionar empresa</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Localização</label>
              <input
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Piso térreo, bloco B"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Grupo</label>
              <input
                value={form.group}
                onChange={e => setForm(f => ({ ...f, group: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Elevadores"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-2.5 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button
                onClick={() => createMutation.mutate(form)}
                disabled={!form.name || !form.companyId || createMutation.isPending}
                className="flex-1 py-2.5 text-sm bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {createMutation.isPending ? 'Criando...' : 'Criar tela'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal vincular playlist */}
      {showLink && (
        <Modal title={`Vincular playlist — ${showLink.name}`} onClose={() => setShowLink(null)}>
          <div className="space-y-2">
            {playlists.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma playlist disponível</p>
            ) : playlists.map(pl => (
              <button
                key={pl.id}
                onClick={() => linkMutation.mutate({ screenId: showLink.id, playlistId: pl.id })}
                disabled={linkMutation.isPending}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition text-left"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{pl.name}</p>
                  <p className="text-xs text-gray-400">{pl._count?.items || 0} itens · {pl.company?.name}</p>
                </div>
                <Plus size={16} className="text-indigo-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
