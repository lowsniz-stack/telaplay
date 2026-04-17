import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [prices, setPrices] = useState({ usd: "R$ --", btc: "R$ --" });
  const [news, setNews] = useState(["Carregando notícias..."]);

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
          return;
        }

        setNews(data.news);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        setNews([
          "Erro ao carregar notícias",
          "Verifique a conexão com o backend",
        ]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // 10 min

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black/90 text-white text-sm flex items-center px-4 py-2 z-50">
      <div className="flex gap-4 min-w-[260px] font-medium">
        <span>Dólar: {prices.usd}</span>
        <span>Bitcoin: {prices.btc}</span>
      </div>

      <div className="flex-1 overflow-hidden mx-4">
        <div className="whitespace-nowrap animate-marquee">
          {news.join(" • ")}
        </div>
      </div>

      <div className="min-w-[110px] text-right font-semibold">
        {time.toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}