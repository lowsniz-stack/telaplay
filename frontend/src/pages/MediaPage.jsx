import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { Image, Film, Upload, Trash2, Search, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import clsx from 'clsx';

function MediaCard({ item, onDelete }) {
  const isVideo = item.type === 'VIDEO';
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
      <div className="aspect-video bg-gray-50 relative overflow-hidden">
        {item.thumbnailUrl ? (
          <img src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            {isVideo ? <Film size={28} className="text-gray-200" /> : <Image size={28} className="text-gray-200" />}
          </div>
        )}
        <div className="absolute top-2 left-2">
          <span className={clsx(
            'text-xs px-2 py-0.5 rounded-full font-medium',
            isVideo ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
          )}>
            {isVideo ? 'Vídeo' : 'Imagem'}
          </span>
        </div>
        <button
          onClick={() => onDelete(item.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-lg text-red-400 opacity-0 group-hover:opacity-100 transition hover:bg-red-50"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
        <div className="flex items-center gap-1 mt-1 text-gray-400">
          <Clock size={11} />
          <span className="text-xs">{item.duration}s</span>
        </div>
      </div>
    </div>
  );
}

export default function MediaPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => api.get('/companies').then(r => r.data),
  });

  const [selectedCompany, setSelectedCompany] = useState('');

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['media', { search, typeFilter, selectedCompany }],
    queryFn: () => api.get('/media', {
      params: {
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(selectedCompany && { companyId: selectedCompany }),
      }
    }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/media/${id}`),
    onSuccess: () => { qc.invalidateQueries(['media']); toast.success('Mídia removida'); },
  });

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedCompany) {
      toast.error('Selecione uma empresa antes de fazer upload');
      return;
    }
    setUploading(true);
    setUploadProgress(acceptedFiles.map(f => ({ name: f.name, status: 'uploading' })));

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^.]+$/, ''));
      formData.append('companyId', selectedCompany);

      try {
        await api.post('/media/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setUploadProgress(p => p.map((x, j) => j === i ? { ...x, status: 'done' } : x));
      } catch {
        setUploadProgress(p => p.map((x, j) => j === i ? { ...x, status: 'error' } : x));
      }
    }

    setUploading(false);
    qc.invalidateQueries(['media']);
    toast.success('Upload concluído!');
    setTimeout(() => setUploadProgress([]), 2000);
  }, [selectedCompany, qc]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/webp': [], 'video/mp4': [], 'video/webm': [] },
    maxSize: 100 * 1024 * 1024,
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Mídias</h1>
        <p className="text-sm text-gray-500 mt-1">{media.length} arquivos</p>
      </div>

      {/* Seletor de empresa + Upload */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa para upload</label>
          <select
            value={selectedCompany}
            onChange={e => setSelectedCompany(e.target.value)}
            className="w-full sm:w-64 px-3.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Selecionar empresa</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div
          {...getRootProps()}
          className={clsx(
            'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition',
            isDragActive ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
          )}
        >
          <input {...getInputProps()} />
          <Upload size={28} className={clsx('mx-auto mb-3', isDragActive ? 'text-indigo-500' : 'text-gray-300')} />
          <p className="text-sm font-medium text-gray-700">
            {isDragActive ? 'Solte os arquivos aqui' : 'Arraste ou clique para fazer upload'}
          </p>
          <p className="text-xs text-gray-400 mt-1">MP4, WebM, JPG, PNG, WebP — até 100MB por arquivo</p>
        </div>

        {/* Progresso de upload */}
        {uploadProgress.length > 0 && (
          <div className="mt-4 space-y-2">
            {uploadProgress.map((f, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className={clsx(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  f.status === 'done' ? 'bg-emerald-400' :
                  f.status === 'error' ? 'bg-red-400' : 'bg-indigo-400 animate-pulse'
                )} />
                <span className="text-gray-600 truncate">{f.name}</span>
                <span className={clsx(
                  'text-xs ml-auto flex-shrink-0',
                  f.status === 'done' ? 'text-emerald-600' :
                  f.status === 'error' ? 'text-red-500' : 'text-gray-400'
                )}>
                  {f.status === 'done' ? 'Concluído' : f.status === 'error' ? 'Erro' : 'Enviando...'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar mídia..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todos os tipos</option>
          <option value="IMAGE">Imagens</option>
          <option value="VIDEO">Vídeos</option>
        </select>
        <select
          value={selectedCompany}
          onChange={e => setSelectedCompany(e.target.value)}
          className="px-3.5 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Todas as empresas</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Grid de mídias */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-100" />
              <div className="p-3"><div className="h-3.5 bg-gray-100 rounded w-3/4" /></div>
            </div>
          ))}
        </div>
      ) : media.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 py-20 text-center">
          <Image size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-sm text-gray-400">Nenhuma mídia encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map(item => (
            <MediaCard
              key={item.id}
              item={item}
              onDelete={(id) => { if (confirm('Remover mídia?')) deleteMutation.mutate(id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
