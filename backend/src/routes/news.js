const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'GNEWS_API_KEY não configurada' });
    }

    const response = await axios.get(
      `https://gnews.io/api/v4/top-headlines?lang=pt&country=br&max=10&apikey=${apiKey}`
    );

    const articles = response.data.articles || [];
    const news = articles.map((item) => item.title).filter(Boolean);

    res.json({ news });
  } catch (error) {
    console.error('Erro ao buscar notícias:', error.message);
    res.status(500).json({ error: 'Erro ao carregar notícias' });
  }
});

module.exports = router;