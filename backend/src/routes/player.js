const express = require('express');
const { prisma } = require('../config/database');

const router = express.Router();

// GET /api/player/:shareToken — dados públicos da tela para o player
// Sem autenticação — acessível pelas TVs
router.get('/:shareToken', async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({
      where: { shareToken: req.params.shareToken },
      include: {
        playlists: {
          where: { active: true },
          include: {
            playlist: {
              include: {
                items: {
                  where: {
                    media: { active: true },
                    OR: [
                      { startAt: null },
                      { startAt: { lte: new Date() } },
                    ],
                    AND: [
                      {
                        OR: [
                          { endAt: null },
                          { endAt: { gte: new Date() } },
                        ],
                      },
                    ],
                  },
                  include: { media: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { priority: 'desc' },
          take: 1,
        },
      },
    });

    if (!screen || !screen.active) {
      return res.status(404).json({ error: 'Tela não encontrada' });
    }

    // Registrar heartbeat automático ao requisitar conteúdo
    await prisma.screen.update({
      where: { id: screen.id },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });

    const playlist = screen.playlists[0]?.playlist || null;
    const items = playlist?.items || [];

    res.json({
      screen: {
        id: screen.id,
        name: screen.name,
        deviceId: screen.deviceId,
      },
      playlist: playlist
        ? {
            id: playlist.id,
            name: playlist.name,
            loop: playlist.loop,
            updatedAt: playlist.updatedAt,
          }
        : null,
      items: items.map((item) => ({
        id: item.id,
        order: item.order,
        duration: item.duration ?? item.media.duration,
        media: {
          id: item.media.id,
          name: item.media.name,
          type: item.media.type,
          url: item.media.url,
          thumbnailUrl: item.media.thumbnailUrl,
        },
      })),
    });
  } catch (err) { next(err); }
});

module.exports = router;
