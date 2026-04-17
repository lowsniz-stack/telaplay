import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [usd, setUsd] = useState("--");
  const [btc, setBtc] = useState("--");
  const [weather, setWeather] = useState("26°C");
  const [news, setNews] = useState([]);

  // Hora
  useEffect(() => {
    const i = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  // Dólar / Bitcoin
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usdRes = await fetch(
          "https://economia.awesomeapi.com.br/json/last/USD-BRL"
        );
        const btcRes = await fetch(
          "https://economia.awesomeapi.com.br/json/last/BTC-BRL"
        );

        const usdData = await usdRes.json();
        const btcData = await btcRes.json();

        setUsd(`R$ ${Number(usdData.USDBRL.bid).toFixed(2)}`);
        setBtc(
          `R$ ${Number(btcData.BTCBRL.bid).toLocaleString("pt-BR")}`
        );
      } catch {}
    };

    fetchData();
    const i = setInterval(fetchData, 60000);
    return () => clearInterval(i);
  }, []);

  // Clima
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m"
        );
        const data = await res.json();
        setWeather(`${Math.round(data.current.temperature_2m)}°C`);
      } catch {}
    };

    fetchWeather();
  }, []);

  // Notícias
  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await api.get("/news");
        setNews(data.news || []);
      } catch {
        setNews(["Erro ao carregar notícias"]);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="ticker-shell">
      {/* LINHA PRINCIPAL */}
      <div className="ticker-main">
        <span className="ticker-item strong">ÍNDICES</span>

        <span className="ticker-item">Dólar {usd}</span>
        <span className="ticker-item">Bitcoin {btc}</span>

        {/* NOTÍCIAS */}
        <div className="ticker-news">
          <div className="ticker-news-track">
            {news.map((n, i) => (
              <span key={i} className="ticker-news-item">
                {n}
              </span>
            ))}
          </div>
        </div>

        <span className="ticker-item">{weather}</span>

        <span className="ticker-brand">TelaPlay</span>

        <span className="ticker-clock">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* LINHA INFERIOR */}
      <div className="ticker-footer">
        Quer sua marca ou empresa apareça aqui? Escaneie o QR Code
      </div>
    </div>
  );
}