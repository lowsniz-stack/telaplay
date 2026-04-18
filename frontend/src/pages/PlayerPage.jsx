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
          console.error("Token da tela não encontrado na rota.");
          setItems([]);
          return;
        }

        const res = await api.get(`/player/${screenToken}`);
        const mediaItems = res.data?.items || [];

        setItems(Array.isArray(mediaItems) ? mediaItems : []);
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
    const mediaType = currentItem?.media?.type || "";

    let duration = 10000;

    if (mediaType.includes("video")) {
      duration = (currentItem?.duration || 15) * 1000;
    } else {
      duration = (currentItem?.duration || 10) * 1000;
    }

    const timer = setTimeout(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % normalizedItems.length);
        setFade(true);
      }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, normalizedItems]);

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
    <div className="h-screen w-screen overflow-hidden bg-black relative">
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

      {/* QR CODE FIXO */}
      <div className="absolute bottom-24 right-6 z-50">
        <div className="rounded-2xl border border-white/10 bg-black/70 p-3 shadow-lg backdrop-blur-md">
          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://w.app/telaplay"
            alt="QR Code para contato"
            className="h-24 w-24 rounded-lg bg-white p-1"
          />
          <p className="mt-2 max-w-24 text-center text-[11px] font-medium leading-tight text-white">
            Anuncie aqui
          </p>
        </div>
      </div>

      <TickerBar />
    </div>
  );
}