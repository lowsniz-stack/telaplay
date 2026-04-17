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

        const usdValue = Number(usdData.USDBRL.bid);
        const usdPct = Number(usdData.USDBRL.pctChange);

        const btcValue = Number(btcData.BTCBRL.bid);
        const btcPct = Number(btcData.BTCBRL.pctChange);

        setUsd(`R$ ${usdValue.toFixed(2)}`);
        setUsdChange(usdPct);

        setBtc(
          `R$ ${btcValue.toLocaleString("pt-BR", {
            maximumFractionDigits: 0,
          })}`
        );
        setBtcChange(btcPct);
      } catch (error) {
        console.error("Erro ao buscar preços:", error);
      }
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
        });
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const { data } = await api.get("/news");
        setNews(data.news || []);
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        setNews(["Erro ao carregar notícias"]);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ticker-shell">
      <div className="ticker-top">
        <div className="ticker-left-tag">
          <span className="ticker-left-icon">↗</span>
          <div className="ticker-left-text">
            <span className="ticker-title">ÍNDICES</span>
            <span className="ticker-sub">mercado</span>
          </div>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-quote-block">
          <span className="ticker-quote-label">DÓLAR</span>
          <span
            className={`ticker-quote-value ${
              usdChange >= 0 ? "up" : "down"
            }`}
          >
            {usd}
          </span>
        </div>

        <div className="ticker-quote-block">
          <span className="ticker-quote-label">BITCOIN</span>
          <span
            className={`ticker-quote-value ${
              btcChange >= 0 ? "up" : "down"
            }`}
          >
            {btc}
          </span>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-news-wrap">
          <div className="ticker-news-track">
            {news.map((item, index) => (
              <span key={index} className="ticker-news-item">
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-weather-block">
          <span className="ticker-weather-temp">{weather.temp}</span>
          <span className="ticker-weather-city">{weather.city}</span>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-brand">TelaPlay</div>

        <div className="ticker-divider" />

        <div className="ticker-clock">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      <div className="ticker-bottom">
        Quer sua marca ou empresa apareça aqui? Escaneie o QR Code
      </div>
    </div>
  );
}