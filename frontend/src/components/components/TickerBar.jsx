import { useEffect, useState } from "react";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [prices, setPrices] = useState({ usd: "R$ --", btc: "BTC --" });
  const [news, setNews] = useState(["Carregando notícias..."]);

  const GNEWS_API_KEY = import.meta.env.VITE_GNEWS_API_KEY;

  // Hora atual
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Buscar dólar e bitcoin
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

  // Buscar notícias reais
  useEffect(() => {
    const fetchNews = async () => {
      try {
        if (!GNEWS_API_KEY) {
          setNews([
            "Chave da GNews não configurada",
            "Defina VITE_GNEWS_API_KEY no arquivo .env",
          ]);
          return;
        }

        const res = await fetch(
          `https://gnews.io/api/v4/top-headlines?lang=pt&country=br&max=10&apikey=${GNEWS_API_KEY}`
        );

        const data = await res.json();

        if (!data.articles || !Array.isArray(data.articles) || data.articles.length === 0) {
          setNews(["Nenhuma notícia disponível no momento"]);
          return;
        }

        const titles = data.articles
          .map((item) => item.title)
          .filter(Boolean);

        setNews(titles);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        setNews([
          "Erro ao carregar notícias",
          "Verifique a conexão ou a chave da API",
        ]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // 10 min

    return () => clearInterval(interval);
  }, [GNEWS_API_KEY]);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 text-white text-sm flex items-center px-4 py-2 z-50">
      {/* Esquerda */}
      <div className="flex gap-4 min-w-[260px] font-medium">
        <span>Dólar: {prices.usd}</span>
        <span>Bitcoin: {prices.btc}</span>
      </div>

      {/* Centro */}
      <div className="flex-1 overflow-hidden mx-4">
        <div className="whitespace-nowrap animate-marquee">
          {news.join(" • ")}
        </div>
      </div>

      {/* Direita */}
      <div className="min-w-[110px] text-right font-semibold">
        {time.toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}