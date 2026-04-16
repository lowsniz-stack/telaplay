import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function ScreensPage() {
  const [screens, setScreens] = useState([])
  const [playlists, setPlaylists] = useState([])
  const [selectedScreen, setSelectedScreen] = useState(null)

  const loadData = async () => {
    const [screensRes, playlistsRes] = await Promise.all([
      api.get('/screens'),
      api.get('/playlists')
    ])

    setScreens(screensRes.data)
    setPlaylists(playlistsRes.data)
  }

  useEffect(() => {
    loadData()
  }, [])

  const addPlaylist = async (screenId, playlistId) => {
    await api.post(`/screens/${screenId}/playlists`, { playlistId })
    await loadData()
  }

  const removePlaylist = async (screenId, playlistId) => {
    await api.delete(`/screens/${screenId}/playlists/${playlistId}`)
    await loadData()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Telas</h1>

      <div className="grid grid-cols-2 gap-4">
        {screens.map(screen => (
          <div key={screen.id} className="border rounded p-4">
            <h2 className="font-bold">{screen.name}</h2>

            <div className="mt-2 text-sm">
              <b>Playlists ativas:</b>

              {screen.playlists.length === 0 && (
                <div className="text-gray-400">Nenhuma</div>
              )}

              {screen.playlists.map(p => (
                <div key={p.playlist.id} className="flex items-center justify-between">
                  <span>{p.playlist.name}</span>

                  <button
                    onClick={() => removePlaylist(screen.id, p.playlist.id)}
                    className="text-red-500 text-xs"
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedScreen(screen)}
              className="mt-3 bg-blue-500 text-white px-3 py-1 rounded"
            >
              Vincular playlist
            </button>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {selectedScreen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="font-bold mb-4">
              Vincular playlist — {selectedScreen.name}
            </h2>

            {playlists.map(pl => {
              const isLinked = selectedScreen.playlists.some(
                p => p.playlist.id === pl.id
              )

              return (
                <div
                  key={pl.id}
                  className="flex justify-between items-center mb-2 border p-2 rounded"
                >
                  <span>{pl.name}</span>

                  {isLinked ? (
                    <button
                      onClick={() => removePlaylist(selectedScreen.id, pl.id)}
                      className="text-red-500"
                    >
                      Remover
                    </button>
                  ) : (
                    <button
                      onClick={() => addPlaylist(selectedScreen.id, pl.id)}
                      className="text-green-600"
                    >
                      Adicionar
                    </button>
                  )}
                </div>
              )
            })}

            <button
              onClick={() => setSelectedScreen(null)}
              className="mt-4 w-full bg-gray-300 py-2 rounded"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}