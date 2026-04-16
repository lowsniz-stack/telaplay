import { useEffect, useState } from "react";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [prices, setPrices] = useState({ usd: "...", btc: "..." });
  const [news, setNews] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("https://api.coinbase.com/v2/exchange-rates?currency=USD");
        const data = await res.json();

        setPrices({
          usd: "R$ 5.00",
          btc: data?.data?.rates?.BTC ? `BTC ${data.data.rates.BTC}` : "BTC ..."
        });
      } catch {
        setPrices({ usd: "R$ --", btc: "BTC --" });
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setNews([
      "Bem-vindo ao TelaPlay 🚀",
      "Promoções disponíveis hoje!",
      "Anuncie aqui seu negócio",
    ]);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 w-full bg-black text-white text-sm flex items-center px-4 py-2 z-50">
      <div className="flex gap-4 min-w-[200px]">
        <span>USD: {prices.usd}</span>
        <span>{prices.btc}</span>
      </div>

      <div className="flex-1 overflow-hidden mx-4">
        <div className="whitespace-nowrap animate-marquee">
          {news.join(" • ")}
        </div>
      </div>

      <div className="min-w-[100px] text-right">
        {time.toLocaleTimeString("pt-BR")}
      </div>
    </div>
  );
}