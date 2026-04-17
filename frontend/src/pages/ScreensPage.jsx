import { useEffect, useState } from "react";
import api from "../lib/api";

export default function ScreensPage() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScreen, setNewScreen] = useState({
    name: "",
    location: "",
    companyId: "",
    group: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [screensRes, playlistsRes] = await Promise.all([
        api.get("/screens"),
        api.get("/playlists"),
      ]);

      setScreens(screensRes.data || []);
      setPlaylists(playlistsRes.data || []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Erro ao carregar telas e playlists.");
    } finally {
      setLoading(false);
    }
  };

  const addPlaylist = async (screenId, playlistId) => {
    try {
      await api.post(`/screens/${screenId}/playlists`, { playlistId });
      await loadData();

      setSelectedScreen((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playlists: [
            ...(prev.playlists || []),
            {
              playlist: playlists.find((p) => p.id === playlistId),
            },
          ],
        };
      });
    } catch (error) {
      console.error("Erro ao vincular playlist:", error);
      alert("Erro ao vincular playlist.");
    }
  };

  const removePlaylist = async (screenId, playlistId) => {
    try {
      await api.delete(`/screens/${screenId}/playlists/${playlistId}`);
      await loadData();

      setSelectedScreen((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playlists: (prev.playlists || []).filter(
            (p) => p.playlist?.id !== playlistId
          ),
        };
      });
    } catch (error) {
      console.error("Erro ao remover playlist:", error);
      alert("Erro ao remover playlist.");
    }
  };

  const copyPlayerLink = async (screen) => {
    try {
      const url = `${window.location.origin}/player/${screen.shareToken}`;
      await navigator.clipboard.writeText(url);
      alert("Link copiado com sucesso.");
    } catch (error) {
      console.error("Erro ao copiar link:", error);
      alert("Não foi possível copiar o link.");
    }
  };

  const openPlayer = (screen) => {
    const url = `${window.location.origin}/player/${screen.shareToken}`;
    window.open(url, "_blank");
  };

  const deleteScreen = async (screenId) => {
    const confirmed = window.confirm("Deseja realmente excluir esta tela?");
    if (!confirmed) return;

    try {
      await api.delete(`/screens/${screenId}`);
      await loadData();
    } catch (error) {
      console.error("Erro ao excluir tela:", error);
      alert("Erro ao excluir tela.");
    }
  };

  const createScreen = async () => {
    try {
      if (!newScreen.name.trim()) {
        alert("Informe o nome da tela.");
        return;
      }

      let fallbackCompanyId = "";
      const firstPlaylistWithCompany = playlists.find((p) => p.companyId);
      if (firstPlaylistWithCompany) {
        fallbackCompanyId = firstPlaylistWithCompany.companyId;
      }

      const payload = {
        name: newScreen.name.trim(),
        location: newScreen.location.trim(),
        group: newScreen.group.trim(),
        companyId: newScreen.companyId || fallbackCompanyId,
      };

      if (!payload.companyId) {
        alert("Não foi possível identificar uma empresa. Cadastre/associe uma empresa primeiro.");
        return;
      }

      await api.post("/screens", payload);

      setShowCreateModal(false);
      setNewScreen({
        name: "",
        location: "",
        companyId: "",
        group: "",
      });

      await loadData();
      alert("Tela criada com sucesso.");
    } catch (error) {
      console.error("Erro ao criar tela:", error);
      alert("Erro ao criar tela.");
    }
  };

  const getActivePlaylistName = (screen) => {
    if (!screen.playlists || screen.playlists.length === 0) {
      return "Nenhuma playlist vinculada";
    }

    return screen.playlists
      .map((p) => p.playlist?.name)
      .filter(Boolean)
      .join(", ");
  };

  const isPlaylistLinked = (screen, playlistId) => {
    if (!screen?.playlists) return false;
    return screen.playlists.some((p) => p.playlist?.id === playlistId);
  };

  if (loading) {
    return (
      <div className="p-5">
        <h1 className="text-3xl font-bold text-slate-900">Telas</h1>
        <p className="mt-2 text-slate-500">Carregando telas...</p>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Telas</h1>
          <p className="mt-1 text-sm text-slate-500">
            {screens.length} monitores cadastrados
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          + Nova tela
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {screens.map((screen) => (
          <div
            key={screen.id}
            className="h-[270px] rounded-3xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_16px_rgba(15,23,42,0.05)] transition hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)] flex flex-col justify-between"
          >
            <div>
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
                    🖥️
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-lg font-bold leading-tight text-slate-900 break-words">
                      {screen.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400 break-words">
                      {screen.location || "Sem localização"}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  📶 Online
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/90 p-3.5 min-h-[88px]">
                <p className="mb-1.5 text-xs uppercase tracking-wide text-slate-400">
                  Playlist ativa
                </p>
                <p className="text-base font-semibold leading-snug text-slate-800 break-words">
                  {getActivePlaylistName(screen)}
                </p>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={() => setSelectedScreen(screen)}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                🔗 Vincular playlist
              </button>

              <button
                onClick={() => copyPlayerLink(screen)}
                className="rounded-2xl border border-slate-200 p-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
                title="Copiar link do player"
              >
                📋
              </button>

              <button
                onClick={() => openPlayer(screen)}
                className="rounded-2xl border border-slate-200 p-2.5 text-sm text-slate-600 transition hover:bg-slate-50"
                title="Abrir player"
              >
                ↗
              </button>

              <button
                onClick={() => deleteScreen(screen.id)}
                className="rounded-2xl border border-red-200 p-2.5 text-sm text-red-500 transition hover:bg-red-50"
                title="Excluir tela"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedScreen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Vincular playlist — {selectedScreen.name}
              </h3>

              <button
                onClick={() => setSelectedScreen(null)}
                className="text-3xl text-slate-400 transition hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {playlists.map((playlist) => {
                const linked = isPlaylistLinked(selectedScreen, playlist.id);

                return (
                  <div
                    key={playlist.id}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
                  >
                    <div>
                      <p className="text-base font-semibold text-slate-900">
                        {playlist.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {playlist.items?.length || 0} itens
                      </p>
                    </div>

                    {linked ? (
                      <button
                        onClick={() =>
                          removePlaylist(selectedScreen.id, playlist.id)
                        }
                        className="rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-50"
                      >
                        Remover
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          addPlaylist(selectedScreen.id, playlist.id)
                        }
                        className="rounded-xl border border-violet-200 px-4 py-2 text-lg font-medium text-violet-600 transition hover:bg-violet-50"
                      >
                        +
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900">
                Nova tela
              </h3>

              <button
                onClick={() => setShowCreateModal(false)}
                className="text-3xl text-slate-400 transition hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Nome da tela
                </label>
                <input
                  type="text"
                  value={newScreen.name}
                  onChange={(e) =>
                    setNewScreen({ ...newScreen, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
                  placeholder="Ex: Recepção Principal"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Localização
                </label>
                <input
                  type="text"
                  value={newScreen.location}
                  onChange={(e) =>
                    setNewScreen({ ...newScreen, location: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
                  placeholder="Ex: Piso térreo"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Grupo
                </label>
                <input
                  type="text"
                  value={newScreen.group}
                  onChange={(e) =>
                    setNewScreen({ ...newScreen, group: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-violet-500"
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                onClick={createScreen}
                className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                Criar tela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}