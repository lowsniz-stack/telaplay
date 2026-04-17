import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function TickerBar() {
  const [time, setTime] = useState(new Date());
  const [prices, setPrices] = useState({
    usd: { value: "R$ --", change: null },
    btc: { value: "R$ --", change: null },
    eur: { value: "R$ --", change: null },
  });
  const [weather, setWeather] = useState({
    temp: "--°",
    city: "Goiânia - GO",
    label: "Clima indisponível",
  });
  const [news, setNews] = useState(["Carregando notícias..."]);

  // Hora
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Índices / moedas
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const [usdRes, btcRes, eurRes] = await Promise.all([
          fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL"),
          fetch("https://economia.awesomeapi.com.br/json/last/BTC-BRL"),
          fetch("https://economia.awesomeapi.com.br/json/last/EUR-BRL"),
        ]);

        const usdData = await usdRes.json();
        const btcData = await btcRes.json();
        const eurData = await eurRes.json();

        const usd = usdData?.USDBRL;
        const btc = btcData?.BTCBRL;
        const eur = eurData?.EURBRL;

        setPrices({
          usd: {
            value: usd?.bid ? `R$ ${Number(usd.bid).toFixed(2)}` : "R$ --",
            change: usd?.pctChange ? Number(usd.pctChange) : null,
          },
          btc: {
            value: btc?.bid
              ? `R$ ${Number(btc.bid).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              : "R$ --",
            change: btc?.pctChange ? Number(btc.pctChange) : null,
          },
          eur: {
            value: eur?.bid ? `R$ ${Number(eur.bid).toFixed(2)}` : "R$ --",
            change: eur?.pctChange ? Number(eur.pctChange) : null,
          },
        });
      } catch (error) {
        console.error("Erro ao buscar índices:", error);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Clima - Goiânia
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=-16.6869&longitude=-49.2648&current=temperature_2m,weather_code&timezone=America%2FSao_Paulo"
        );

        const data = await res.json();
        const temp = data?.current?.temperature_2m;

        const weatherCode = data?.current?.weather_code;

        let label = "Tempo estável";
        if ([0].includes(weatherCode)) label = "Céu limpo";
        else if ([1, 2, 3].includes(weatherCode)) label = "Parcialmente nublado";
        else if ([45, 48].includes(weatherCode)) label = "Neblina";
        else if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(weatherCode)) label = "Chuva";
        else if ([95, 96, 99].includes(weatherCode)) label = "Tempestade";
        else if ([71, 73, 75, 77].includes(weatherCode)) label = "Frio intenso";

        setWeather({
          temp: temp !== undefined ? `${Math.round(temp)}°C` : "--°",
          city: "Goiânia - GO",
          label,
        });
      } catch (error) {
        console.error("Erro ao buscar clima:", error);
      }
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, 600000);
    return () => clearInterval(interval);
  }, []);

  // Notícias do backend
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
    const interval = setInterval(fetchNews, 600000);
    return () => clearInterval(interval);
  }, []);

  const Arrow = ({ value }) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return <span className="ticker-neutral">•</span>;
    }

    if (value > 0) {
      return <span className="ticker-up">▲</span>;
    }

    if (value < 0) {
      return <span className="ticker-down">▼</span>;
    }

    return <span className="ticker-neutral">•</span>;
  };

  const ChangeText = ({ value }) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return <span className="ticker-neutral">--</span>;
    }

    const cls = value > 0 ? "ticker-up" : value < 0 ? "ticker-down" : "ticker-neutral";
    return <span className={cls}>{value > 0 ? "+" : ""}{value.toFixed(2)}%</span>;
  };

  return (
    <div className="ticker-shell">
      <div className="ticker-top">
        <div className="ticker-section ticker-section-title">
          <div className="ticker-icon-box">↗</div>
          <div>
            <div className="ticker-label">ÍNDICES</div>
            <div className="ticker-subtle">mercado</div>
          </div>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-section">
          <div className="ticker-mini-label">DÓLAR</div>
          <div className="ticker-main-line">
            <Arrow value={prices.usd.change} />
            <ChangeText value={prices.usd.change} />
          </div>
          <div className="ticker-subtle">{prices.usd.value}</div>
        </div>

        <div className="ticker-section">
          <div className="ticker-mini-label">EURO</div>
          <div className="ticker-main-line">
            <Arrow value={prices.eur.change} />
            <ChangeText value={prices.eur.change} />
          </div>
          <div className="ticker-subtle">{prices.eur.value}</div>
        </div>

        <div className="ticker-section">
          <div className="ticker-mini-label">BITCOIN</div>
          <div className="ticker-main-line">
            <Arrow value={prices.btc.change} />
            <ChangeText value={prices.btc.change} />
          </div>
          <div className="ticker-subtle">{prices.btc.value}</div>
        </div>

        <div className="ticker-divider" />

        <div className="ticker-section ticker-weather">
          <div className="ticker-weather-icon">☁</div>
          <div>
            <div className="ticker-weather-temp">{weather.temp}</div>
            <div className="ticker-subtle">{weather.label}</div>
            <div className="ticker-subtle">{weather.city}</div>
          </div>
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
        <div className="ticker-news-track">
          {news.map((item, index) => (
            <span key={index} className="ticker-news-item">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}