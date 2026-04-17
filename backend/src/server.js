require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createServer } = require('http');
const { WebSocketServer } = require('ws');
const rateLimit = require('express-rate-limit');

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const mediaRoutes = require('./routes/media');
const playlistRoutes = require('./routes/playlists');
const screenRoutes = require('./routes/screens');
const playerRoutes = require('./routes/player');
const logRoutes = require('./routes/logs');
const newsRoutes = require('./routes/news');

const { errorHandler } = require('./middleware/errorHandler');
const { setupWebSocket } = require('./utils/websocket');

const app = express();
const server = createServer(app);
const prisma = new PrismaClient();

// WebSocket
const wss = new WebSocketServer({
  server,
  path: '/ws',
});
setupWebSocket(wss);
app.set('wss', wss);

// Segurança
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/screens', screenRoutes);
app.use('/api/player', playerRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/news', newsRoutes);

// Middleware de erro
app.use(errorHandler);

// Criar / atualizar admin padrão
async function createAdmin() {
  try {
    const hash = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@telaplay.com' },
      update: {
        password: hash,
      },
      create: {
        email: 'admin@telaplay.com',
        password: hash,
        name: 'Administrador',
        role: 'ADMIN',
      },
    });

    console.log('✅ Admin atualizado/criado!');
  } catch (error) {
    console.error('❌ Erro ao criar admin:', error);
  }
}

createAdmin();

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📡 WebSocket disponível em ws://localhost:${PORT}/ws`);
});