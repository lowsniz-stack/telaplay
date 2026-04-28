import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import TickerBar from "../components/components/TickerBar";

export default function PlayerPage() {
  const params = useParams();
  const screenToken =
    params.token ||
    params.id ||
    params.shareToken ||
    params.screenToken ||
    Object.values(params)[0];

  const [items, setItems] = useState([]);
  const [screenData, setScreenData] = useState(null);
  const [playlistData, setPlaylistData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(true);

  const normalizedItems = useMemo(() => {
    return items
      .map((item) => ({
        ...item,
        media: {
          ...item.media,
          type: String(item?.media?.type || "").toLowerCase(),
          url: item?.media?.url || "",
        },
      }))
      .filter((item) => item?.media?.url);
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (!screenToken) {
          setItems([]);
          return;
        }

        const res = await api.get(`/player/${screenToken}`);

        setItems(res.data?.items || []);
        setScreenData(res.data?.screen || null);
        setPlaylistData(res.data?.playlist || null);
      } catch (err) {
        console.error("Erro ao carregar player:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [screenToken]);

  useEffect(() => {
    if (normalizedItems.length === 0) return;

    const currentItem = normalizedItems[currentIndex];
    const isVideo = currentItem?.media?.type?.includes("video");

    const duration = (currentItem?.duration || (isVideo ? 15 : 10)) * 1000;

    const timer = setTimeout(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % normalizedItems.length);
        setFade(true);
      }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, normalizedItems]);

  useEffect(() => {
    if (!screenData?.id || normalizedItems.length === 0) return;

    const currentItem = normalizedItems[currentIndex];

    api.post("/logs/display", {
      screenId: screenData.id,
      event: "MEDIA_STARTED",
      metadata: {
        screenToken,
        screenName: screenData?.name,
        playlistName: playlistData?.name,
        mediaName: currentItem?.media?.name,
        mediaType: currentItem?.media?.type,
        startedAt: new Date().toISOString(),
      },
    }).catch(() => {});
  }, [currentIndex, normalizedItems, screenData, playlistData, screenToken]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Carregando mídia...
      </div>
    );
  }

  if (normalizedItems.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Nenhuma mídia encontrada para esta tela.
      </div>
    );
  }

  const current = normalizedItems[currentIndex]?.media;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-black">
      
      {/* 🎬 ÁREA DO CLIENTE */}
      <main className="relative h-[85vh] w-full overflow-hidden bg-black">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {current?.type.includes("image") && (
            <img
              src={current.url}
              alt=""
              className="h-full w-full object-cover"
            />
          )}

          {current?.type.includes("video") && (
            <video
              src={current.url}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </main>

      {/* 📊 RODAPÉ FIXO */}
      <footer className="flex h-[15vh] w-full border-t border-white/10 bg-[#0f172a]">
        
        {/* TICKER */}
        <div className="flex h-full flex-1 items-center overflow-hidden">
          <TickerBar />
        </div>

        {/* QR CODE */}
        <div className="flex h-full w-[140px] items-center justify-center border-l border-white/10 bg-[#0b1220]">
          <div className="flex flex-col items-center justify-center">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://w.app/telaplay"
              alt="QR Code Vextor"
              className="h-20 w-20 rounded-md bg-white p-1"
            />
            <p className="mt-1 text-[10px] text-white/80">
              Anuncie na Vextor
            </p>
          </div>
        </div>

      </footer>
    </div>
  );
}