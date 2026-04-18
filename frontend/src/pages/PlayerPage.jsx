import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../lib/api";
import TickerBar from "../components/components/TickerBar";

export default function PlayerPage() {
  const { token } = useParams();

  const [items, setItems] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/player/${token}`);
        const mediaItems = res.data?.items || [];
        setItems(mediaItems);
      } catch (err) {
        console.error("Erro ao carregar player:", err);
      }
    };

    load();
  }, [token]);

  useEffect(() => {
    if (items.length === 0) return;

    const currentItem = items[currentIndex];

    let duration = 10000;

    if (currentItem?.media?.type === "video") {
      duration = currentItem.duration || 15000;
    } else {
      duration = currentItem.duration || 10000;
    }

    const timer = setTimeout(() => {
      setFade(false);

      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % items.length);
        setFade(true);
      }, 400);
    }, duration);

    return () => clearTimeout(timer);
  }, [currentIndex, items]);

  if (items.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        Carregando mídia...
      </div>
    );
  }

  const current = items[currentIndex]?.media;

  return (
    <div className="h-screen w-screen bg-black overflow-hidden flex flex-col">
      
      <div className="flex-1 relative">
        <div
          className={`absolute inset-0 transition-opacity duration-500 ${
            fade ? "opacity-100" : "opacity-0"
          }`}
        >
          {current?.type === "image" && (
            <img
              src={current.url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}

          {current?.type === "video" && (
            <video
              src={current.url}
              autoPlay
              muted
              loop
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>

      <TickerBar />
    </div>
  );
}