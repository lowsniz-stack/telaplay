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

  const [news, setNews] = useState([
    "Carregando notícias...",
    "Aguarde alguns instantes para atualização das notícias",
  ]);

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
          "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo"
        );

        const data = await res.json();
        const temp = Math.round(data.current.temperature_2m);
        const code = data.current.weather_code;

        let icon = "⛅";
        if (code === 0) icon = "☀️";
        else if ([1, 2, 3].includes(code)) icon = "⛅";
        else if ([45, 48].includes(code)) icon = "🌫️";
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) icon = "🌧️";
        else if ([95, 96, 99].includes(code)) icon = "⛈️";
        else if ([71, 73, 75, 77].includes(code)) icon = "❄️";

        setWeather({
          temp: `${temp}°C`,
          city: "Goiânia - GO",
          icon,
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
    const NEWS_CACHE_KEY = "vextor_real_news_cache_v2";

    const loadCache = () => {
      try {
        const cached = localStorage.getItem(NEWS_CACHE_KEY);

        if (!cached) return;

        const parsed = JSON.parse(cached);

        if (Array.isArray(parsed?.news) && parsed.news.length > 0) {
          setNews(parsed.news);
        }
      } catch (error) {
        console.error("Erro ao ler cache de notícias:", error);
      }
    };

    const fetchNews = async () => {
      try {
        const { data } = await api.get(`/news?t=${Date.now()}`);

        if (Array.isArray(data.news) && data.news.length > 0) {
          const cleanNews = data.news
            .map((item) => String(item || "").trim())
            .filter(Boolean);

          if (cleanNews.length > 0) {
            setNews(cleanNews);

            localStorage.setItem(
              NEWS_CACHE_KEY,
              JSON.stringify({
                updatedAt: new Date().toISOString(),
                news: cleanNews,
              })
            );

            return true;
          }
        }

        return false;
      } catch (error) {
        console.error("Erro ao buscar notícias:", error);
        return false;
      }
    };

    loadCache();

    let retryInterval;

    const startNews = async () => {
      const success = await fetchNews();

      if (!success) {
        retryInterval = setInterval(async () => {
          const retrySuccess = await fetchNews();

          if (retrySuccess && retryInterval) {
            clearInterval(retryInterval);
          }
        }, 8000);
      }
    };

    startNews();

    const updateInterval = setInterval(fetchNews, 180000);

    return () => {
      clearInterval(updateInterval);
      if (retryInterval) clearInterval(retryInterval);
    };
  }, []);

  const renderArrow = (value) => {
    if (value > 0) return "▲";
    if (value < 0) return "▼";
    return "•";
  };

  const renderClass = (value) => {
    if (value > 0) return "up";
    if (value < 0) return "down";
    return "";
  };

  const renderPct = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "--";
    return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
  };

  const newsItems = [...news, ...news, ...news, ...news];

  return (
    <div className="ticker-shell">
      <div className="ticker-topline">
        <div className="ticker-card ticker-card-index">
          <span className="ticker-icon">↗</span>
          <div>
            <div className="ticker-title">ÍNDICES</div>
            <div className="ticker-sub">mercado</div>
          </div>
        </div>

        <div className="ticker-card">
          <div className="ticker-label">DÓLAR</div>
          <div className={`ticker-value ${renderClass(usdChange)}`}>
            {renderArrow(usdChange)} {usd}
          </div>
          <div className={`ticker-sub ${renderClass(usdChange)}`}>
            {renderPct(usdChange)}
          </div>
        </div>

        <div className="ticker-card">
          <div className="ticker-label">BITCOIN</div>
          <div className={`ticker-value ${renderClass(btcChange)}`}>
            {renderArrow(btcChange)} {btc}
          </div>
          <div className={`ticker-sub ${renderClass(btcChange)}`}>
            {renderPct(btcChange)}
          </div>
        </div>

        <div className="ticker-card ticker-card-weather">
          <div className="ticker-value">
            {weather.icon} {weather.temp}
          </div>
          <div className="ticker-sub">{weather.city}</div>
        </div>

        <div className="ticker-brand">Vextor Mídia</div>

        <div className="ticker-clock">
          {time.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      <div className="ticker-news-line">
        <div className="ticker-news-track">
          <div className="ticker-news-group">
            {newsItems.map((item, index) => (
              <span key={`a-${index}`} className="ticker-news-item">
                {item}
              </span>
            ))}
          </div>

          <div className="ticker-news-group" aria-hidden="true">
            {newsItems.map((item, index) => (
              <span key={`b-${index}`} className="ticker-news-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="ticker-cta">
        Quer sua marca ou empresa apareça aqui? Escaneie o QR Code
      </div>
    </div>
  );
}