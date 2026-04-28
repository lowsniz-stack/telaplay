import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [usd, setUsd] = useState("R$ --");
  const [btc, setBtc] = useState("R$ --");
  const [usdChange, setUsdChange] = useState(0);
  const [btcChange, setBtcChange] = useState(0);

  const [weather, setWeather] = useState({
    temp: "--°C",
    city: "Goiânia - GO",
    icon: "⛅",
  });

  const [news, setNews] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [usdRes, btcRes] = await Promise.all([
          fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL"),
          fetch("https://economia.awesomeapi.com.br/json/last/BTC-BRL"),
        ]);

        const usdData = await usdRes.json();
        const btcData = await btcRes.json();

        setUsd(`R$ ${Number(usdData.USDBRL.bid).toFixed(2)}`);
        setUsdChange(Number(usdData.USDBRL.pctChange));

        setBtc(
          `R$ ${Number(btcData.BTCBRL.bid).toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          })}`
        );
        setBtcChange(Number(btcData.BTCBRL.pctChange));
      } catch {}
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m&timezone=America%2FSao_Paulo"
        );

        const data = await res.json();
        setWeather({
          temp: `${Math.round(data.current.temperature_2m)}°C`,
          city: "Goiânia - GO",
          icon: "☀️",
        });
      } catch {}
    };

    fetchWeather();
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await api.get("/news");
        if (data.news?.length) setNews(data.news);
      } catch {}
    };

    fetchNews();
  }, []);

  const renderArrow = (v) => (v > 0 ? "▲" : v < 0 ? "▼" : "•");
  const renderClass = (v) => (v > 0 ? "up" : v < 0 ? "down" : "");
  const renderPct = (v) => `${v > 0 ? "+" : ""}${v.toFixed(2)}%`;

  return (
    <div className="ticker-shell">
      
      {/* LINHA 1 */}
      <div className="ticker-row top">

        <div className="ticker-box">
          <div className="ticker-title">ÍNDICES</div>
          <div className="ticker-sub">mercado</div>
        </div>

        <div className="ticker-box">
          <div className="ticker-label">DÓLAR</div>
          <div className={`ticker-value ${renderClass(usdChange)}`}>
            {renderArrow(usdChange)} {usd}
          </div>
          <div className="ticker-sub">{renderPct(usdChange)}</div>
        </div>

        <div className="ticker-box">
          <div className="ticker-label">BITCOIN</div>
          <div className={`ticker-value ${renderClass(btcChange)}`}>
            {renderArrow(btcChange)} {btc}
          </div>
          <div className="ticker-sub">{renderPct(btcChange)}</div>
        </div>

        <div className="ticker-box">
          <div className="ticker-value">
            {weather.icon} {weather.temp}
          </div>
          <div className="ticker-sub">{weather.city}</div>
        </div>

        <div className="ticker-brand">Vextor</div>

        <div className="ticker-clock">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>

      </div>

      {/* LINHA 2 - NOTÍCIAS */}
      <div className="ticker-row news">
        <div className="ticker-news-track">
          {news.map((n, i) => (
            <span key={i} className="ticker-news-item">{n}</span>
          ))}
        </div>
      </div>

      {/* LINHA 3 */}
      <div className="ticker-row bottom">
        Quer sua marca ou empresa apareça aqui? Escaneie o QR Code
      </div>

    </div>
  );
}