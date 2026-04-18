import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import TickerBar from "../components/components/TickerBar";

export default function PlayerPage() {
  const { token, id } = useParams();
  const screenToken = token || id;

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [loading, setLoading] = useState(true);

  const normalizedItems = useMemo(() => {
    return items
      .map((item) => {
        if (item?.media) {
          return {
            ...item,
            media: {
              ...item.media,
              type: item.media.type || item.media.mimeType || "",
              url:
                item.media.url ||
                item.media.fileUrl ||
                item.media.path ||
                "",
            },
          };
        }

        return {
          ...item,
          media: {
            type: item?.type || item?.mimeType || "",
            url: item?.url || item?.fileUrl || item?.path || "",
          },
        };
      })
      .filter((item) => item?.media?.url);
  }, [items]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        const res = await api.get(`/player/${screenToken}`);
        const data = res.data;

        const mediaItems =
          data?.items ||
          data?.playlist?.items ||
          data?.screen?.items ||
          data?.screen?.playlist?.items ||
          [];

        setItems(Array.isArray(mediaItems) ? mediaItems : []);
      } catch (err) {
        console.error("Erro ao carregar player:", err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (screenToken) {
      load();
    }
  }, [screenToken]);

  useEffect(() => {
    if (normalizedItems.length === 0) return;

    const currentItem = normalizedItems[currentIndex];
    const mediaType = String(currentItem?.media?.type || "").toLowerCase();

    let duration = 10000;

    if (mediaType.includes("video")) {
      duration = currentItem?.duration || 15000;
    } else {
      duration = currentItem?.duration || 10000;
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
  const mediaType = String(current?.type || "").toLowerCase();
  const mediaUrl = current?.url || "";

  return (
    <div className="h-screen w-screen overflow-hidden bg-black">
      <div className="relative h-full w-full">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {mediaType.includes("image") && (
            <img
              src={mediaUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          )}

          {mediaType.includes("video") && (
            <video
              src={mediaUrl}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          )}
        </div>

        <TickerBar />
      </div>
    </div>
  );
}