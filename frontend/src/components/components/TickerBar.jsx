import { useEffect, useRef, useState } from "react";
import api from "../../lib/api";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [prices, setPrices] = useState({ usd: "R$ --", btc: "R$ --" });
  const [news, setNews] = useState(["Carregando notícias..."]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [isLongNews, setIsLongNews] = useState(false);

  const newsTextRef = useRef(null);
  const newsBoxRef = useRef(null);

  // Hora atual
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Dólar e Bitcoin
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [usdRes, btcRes] = await Promise.all([
          fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL"),
          fetch("https://economia.awesomeapi.com.br/json/last/BTC-BRL"),
        ]);

        const usdData = await usdRes.json();
        const btcData = await btcRes.json();

        const usdValue = usdData?.USDBRL?.bid
          ? Number(usdData.USDBRL.bid).toFixed(2)
          : "--";

        const btcValue = btcData?.BTCBRL?.bid
          ? Number(btcData.BTCBRL.bid).toLocaleString("pt-BR", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })
          : "--";

        setPrices({
          usd: `R$ ${usdValue}`,
          btc: `R$ ${btcValue}`,
        });
      } catch (error) {
        console.error("Erro ao buscar cotações:", error);
        setPrices({
          usd: "R$ --",
          btc: "R$ --",
        });
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);

    return () => clearInterval(interval);
  }, []);

  // Notícias reais pelo backend
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await api.get("/news");

        if (!data.news || !Array.isArray(data.news) || data.news.length === 0) {
          setNews(["Nenhuma notícia disponível no momento"]);
          setNewsIndex(0);
          return;
        }

        setNews(data.news);
        setNewsIndex(0);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        setNews([
          "Erro ao carregar notícias",
          "Verifique a conexão com o backend",
        ]);
        setNewsIndex(0);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000);

    return () => clearInterval(interval);
  }, []);

  // Troca de notícia a cada 10 segundos
  useEffect(() => {
    if (!news.length) return;

    const interval = setInterval(() => {
      setNewsIndex((prev) => (prev + 1) % news.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [news]);

  // Detecta se a notícia é longa
  useEffect(() => {
    const checkIfLong = () => {
      if (!newsTextRef.current || !newsBoxRef.current) return;

      const textWidth = newsTextRef.current.scrollWidth;
      const boxWidth = newsBoxRef.current.clientWidth;

      setIsLongNews(textWidth > boxWidth);
    };

    const timeout = setTimeout(checkIfLong, 100);
    window.addEventListener("resize", checkIfLong);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", checkIfLong);
    };
  }, [newsIndex, news]);

  const currentNews = news[newsIndex] || "Carregando notícias...";

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 text-white z-50">
      <div className="flex items-center px-4 py-2 text-sm">
        {/* Esquerda */}
        <div className="flex gap-4 min-w-[260px] font-medium">
          <span>Dólar: {prices.usd}</span>
          <span>Bitcoin: {prices.btc}</span>
        </div>

        {/* Centro */}
        <div
          ref={newsBoxRef}
          className="flex-1 mx-4 overflow-hidden relative h-[40px] flex items-center"
        >
          {isLongNews ? (
            <div
              ref={newsTextRef}
              className="whitespace-nowrap inline-block animate-news-scroll"
            >
              {currentNews}
            </div>
          ) : (
            <div
              ref={newsTextRef}
              className="w-full text-center font-medium leading-tight line-clamp-2"
            >
              {currentNews}
            </div>
          )}
        </div>

        {/* Direita */}
        <div className="min-w-[110px] text-right font-semibold">
          {time.toLocaleTimeString("pt-BR")}
        </div>
      </div>
    </div>
  );
}