import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ListVideo, Plus, Trash2, GripVertical, Clock, Film, Image } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function PlaylistsPage() {
  const qc = useQueryClient();
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMedia, setShowAddMedia] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', companyId: '' });

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: () => api.get('/playlists').then(r => r.data),
  });

  const { data: playlistDetail } = useQuery({
    queryKey: ['playlist', selectedPlaylist?.id],
    queryFn: () => api.get(`/playlists/${selectedPlaylist.id}`).then(r => r.data),
    enabled: !!selectedPlaylist,
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => r.data),
  });

  const { data: allMedia = [] } = useQuery({
    queryKey: ['media'],
    queryFn: () => api.get('/media').then(r => r.data),
    enabled: showAddMedia,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/playlists', data),
    onSuccess: (res) => {
      qc.invalidateQueries(['playlists']);
      setShowCreate(false);
      setSelectedPlaylist(res.data);
      setForm({ name: '', description: '', companyId: '' });
      toast.success('Playlist criada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/playlists/${id}`),
    onSuccess: () => {
      qc.invalidateQueries(['playlists']);
      setSelectedPlaylist(null);
      toast.success('Playlist removida');
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ playlistId, mediaId }) =>
      api.post(`/playlists/${playlistId}/items`, { mediaId }),
    onSuccess: () => {
      qc.invalidateQueries(['playlist', selectedPlaylist?.id]);
      setShowAddMedia(false);
      toast.success('Mídia adicionada!');
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Erro'),
  });

  const removeItemMutation = useMutation({
    mutationFn: ({ playlistId, itemId }) =>
      api.delete(`/playlists/${playlistId}/items/${itemId}`),
    onSuccess: () => qc.invalidateQueries(['playlist', selectedPlaylist?.id]),
  });

  const items = playlistDetail?.items || [];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Playlists</h1>
          <p className="text-sm text-gray-500 mt-1">{playlists.length} playlists</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus size={16} /> Nova playlist
        </button>
      </div>

      <div className="flex gap-6">
        {/* Lista de playlists */}
        <div className="w-72 flex-shrink-0 space-y-2">
          {isLoading ? (
            [1,2,3].map(i => <div key={i} className="h-20 bg-white rounded-xl border border-gray-100 animate-pulse" />)
          ) : playlists.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 py-10 text-center">
              <ListVideo size={28} className="mx-auto text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">Nenhuma playlist</p>
            </div>
          ) : playlists.map(pl => (
            <button
              key={pl.id}
              onClick={() => setSelectedPlaylist(pl)}
              className={clsx(
                'w-full text-left p-4 rounded-xl border transition',
                selectedPlaylist?.id === pl.id
                  ? 'border-indigo-200 bg-indigo-50'
                  : 'border-gray-100 bg-white hover:border-gray-200'
              )}
            >
              <p className="text-sm font-semibold text-gray-900 truncate">{pl.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {pl._count?.items || 0} itens · {pl.company?.name}
              </p>
              {pl._count?.screens > 0 && (
                <span className="inline-block mt-1.5 text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {pl._count.screens} tela(s)
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Detalhe da playlist */}
        <div className="flex-1 bg-white rounded-xl border border-gray-100">
          {!selectedPlaylist ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-sm text-gray-400">Selecione uma playlist para editar</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{selectedPlaylist.name}</h2>
                  {selectedPlaylist.description && (
                    <p className="text-xs text-gray-400 mt-0.5">{selectedPlaylist.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddMedia(true)}
                    className="flex items-center gap-1.5 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 hover:bg-gray-50 transition"
                  >
                    <Plus size={14} /> Adicionar mídia
                  </button>
                  <button
                    onClick={() => { if (confirm('Remover playlist?')) deleteMutation.mutate(selectedPlaylist.id); }}
                    className="p-1.5 rounded-lg border border-red-100 text-red-400 hover:bg-red-50 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="py-16 text-center">
                  <ListVideo size={32} className="mx-auto text-gray-200 mb-3" />
                  <p className="text-sm text-gray-400">Nenhuma mídia na playlist</p>
                  <button
                    onClick={() => setShowAddMedia(true)}
                    className="mt-3 text-indigo-600 text-sm font-medium hover:underline"
                  >
                    Adicionar mídia
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {items.map((item, i) => (
                    <div key={item.id} className="flex items-center gap-3 px-6 py-3 group">
                      <GripVertical size={16} className="text-gray-200 flex-shrink-0" />
                      <span className="text-xs text-gray-300 w-5 flex-shrink-0">{i + 1}</span>
                      <div className="w-14 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0">
                        {item.media.thumbnailUrl ? (
                          <img src={item.media.thumbnailUrl} alt={item.media.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            {item.media.type === 'VIDEO'
                              ? <Film size={14} className="text-gray-300" />
                              : <Image size={14} className="text-gray-300" />
                            }
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.media.name}</p>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Clock size={11} />
                          <span className="text-xs">{item.duration ?? item.media.duration}s</span>
                          <span className="text-xs ml-2">
                            {item.media.type === 'VIDEO' ? '· Vídeo' : '· Imagem'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItemMutation.mutate({ playlistId: selectedPlaylist.id, itemId: item.id })}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal criar playlist */}
      {showCreate && (
        <Modal title="Nova playlist" onClose={() => setShowCreate(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Ex: Promoções de verão"
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                rows={2}
                placeholder="Descrição da playlist..."
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
                {createMutation.isPending ? 'Criando...' : 'Criar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal adicionar mídia */}
      {showAddMedia && (
        <Modal title="Adicionar mídia" onClose={() => setShowAddMedia(false)}>
          <div className="space-y-2">
            {allMedia.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">Nenhuma mídia disponível</p>
            ) : allMedia.map(m => (
              <button
                key={m.id}
                onClick={() => addItemMutation.mutate({ playlistId: selectedPlaylist.id, mediaId: m.id })}
                disabled={addItemMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50 transition text-left"
              >
                <div className="w-12 h-9 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                  {m.thumbnailUrl ? (
                    <img src={m.thumbnailUrl} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      {m.type === 'VIDEO' ? <Film size={14} className="text-gray-300" /> : <Image size={14} className="text-gray-300" />}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.type === 'VIDEO' ? 'Vídeo' : 'Imagem'} · {m.duration}s</p>
                </div>
                <Plus size={15} className="text-indigo-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
