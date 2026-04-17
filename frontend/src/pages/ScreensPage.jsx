import { useEffect, useState } from "react";
import api from "../lib/api";

export default function ScreensPage() {
  const [screens, setScreens] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [selectedScreen, setSelectedScreen] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [screensRes, playlistsRes] = await Promise.all([
        api.get("/screens"),
        api.get("/playlists"),
      ]);

      setScreens(screensRes.data || []);
      setPlaylists(playlistsRes.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const addPlaylist = async (screenId, playlistId) => {
    await api.post(`/screens/${screenId}/playlists`, { playlistId });
    loadData();
  };

  const removePlaylist = async (screenId, playlistId) => {
    await api.delete(`/screens/${screenId}/playlists/${playlistId}`);
    loadData();
  };

  const getPlaylistName = (screen) => {
    if (!screen.playlists?.length) return "Nenhuma";

    return screen.playlists
      .map((p) => p.playlist?.name)
      .join(", ");
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Telas</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {screens.map((screen) => (
          <div key={screen.id} className="border rounded-xl p-5 bg-white">
            <h2 className="text-lg font-semibold mb-2">
              {screen.name}
            </h2>

            <p className="text-sm text-gray-500 mb-2">
              Playlists ativas:
            </p>

            <p className="text-sm mb-4">
              {getPlaylistName(screen)}
            </p>

            <button
              onClick={() => setSelectedScreen(screen)}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Vincular playlist
            </button>
          </div>
        ))}
      </div>

      {selectedScreen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-[400px]">
            <h2 className="text-lg font-bold mb-4">
              {selectedScreen.name}
            </h2>

            {playlists.map((playlist) => {
              const linked = selectedScreen.playlists?.some(
                (p) => p.playlist?.id === playlist.id
              );

              return (
                <div
                  key={playlist.id}
                  className="flex justify-between items-center mb-3"
                >
                  <span>{playlist.name}</span>

                  {linked ? (
                    <button
                      onClick={() =>
                        removePlaylist(selectedScreen.id, playlist.id)
                      }
                      className="text-red-500"
                    >
                      remover
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        addPlaylist(selectedScreen.id, playlist.id)
                      }
                      className="text-blue-500"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}

            <button
              onClick={() => setSelectedScreen(null)}
              className="mt-4 text-gray-500"
            >
              fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}