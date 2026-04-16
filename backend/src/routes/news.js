const express = require('express');

const router = express.Router();

// GET /api/news
router.get('/', async (req, res) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: 'GNEWS_API_KEY não configurada no backend',
      });
    }

    const response = await fetch(
      `https://gnews.io/api/v4/top-headlines?lang=pt&country=br&max=10&apikey=${apiKey}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.errors?.join(', ') || data?.message || 'Erro ao buscar notícias',
      });
    }

    const news = (data.articles || [])
      .map((item) => item.title)
      .filter(Boolean);

    res.json({ news });
  } catch (error) {
    console.error('Erro na rota /api/news:', error);
    res.status(500).json({ error: 'Erro interno ao buscar notícias' });
  }
});

module.exports = router;