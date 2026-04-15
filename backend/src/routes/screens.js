const express = require('express');
const { z } = require('zod');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { broadcast } = require('../utils/websocket');

const router = express.Router();
router.use(authenticate);

const screenSchema = z.object({
  name: z.string().min(1),
  companyId: z.string(),
  location: z.string().optional(),
  group: z.string().optional(),
});

// GET /api/screens — listar todas
router.get('/', async (req, res, next) => {
  try {
    const { companyId, group } = req.query;
    const where = {};
    if (companyId) where.companyId = companyId;
    if (group) where.group = group;

    const screens = await prisma.screen.findMany({
      where,
      include: {
        company: { select: { name: true } },
        playlists: {
          where: { active: true },
          include: { playlist: { select: { id: true, name: true } } },
          orderBy: { priority: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(screens);
  } catch (err) { next(err); }
});

// GET /api/screens/:id
router.get('/:id', async (req, res, next) => {
  try {
    const screen = await prisma.screen.findUnique({
      where: { id: req.params.id },
      include: {
        company: true,
        playlists: {
          include: {
            playlist: {
              include: {
                items: {
                  include: { media: true },
                  orderBy: { order: 'asc' },
                },
              },
            },
          },
          orderBy: { priority: 'desc' },
        },
      },
    });

    if (!screen) return res.status(404).json({ error: 'Tela não encontrada' });
    res.json(screen);
  } catch (err) { next(err); }
});

// POST /api/screens
router.post('/', async (req, res, next) => {
  try {
    const data = screenSchema.parse(req.body);
    const screen = await prisma.screen.create({ data });
    res.status(201).json(screen);
  } catch (err) { next(err); }
});

// PUT /api/screens/:id
router.put('/:id', async (req, res, next) => {
  try {
    const data = screenSchema.partial().parse(req.body);
    const screen = await prisma.screen.update({
      where: { id: req.params.id },
      data,
    });
    res.json(screen);
  } catch (err) { next(err); }
});

// DELETE /api/screens/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.screen.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/screens/:id/playlists — vincular playlist à tela
router.post('/:id/playlists', async (req, res, next) => {
  try {
    const { playlistId, priority = 0 } = req.body;
    const sp = await prisma.screenPlaylist.upsert({
      where: { screenId_playlistId: { screenId: req.params.id, playlistId } },
      update: { priority, active: true },
      create: { screenId: req.params.id, playlistId, priority },
    });

    // Notificar player via WebSocket
    const wss = req.app.get('wss');
    broadcast(wss, req.params.id, { type: 'PLAYLIST_UPDATED' });

    res.json(sp);
  } catch (err) { next(err); }
});

// DELETE /api/screens/:id/playlists/:playlistId
router.delete('/:id/playlists/:playlistId', async (req, res, next) => {
  try {
    await prisma.screenPlaylist.delete({
      where: {
        screenId_playlistId: {
          screenId: req.params.id,
          playlistId: req.params.playlistId,
        },
      },
    });

    const wss = req.app.get('wss');
    broadcast(wss, req.params.id, { type: 'PLAYLIST_UPDATED' });

    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/screens/:id/heartbeat — atualizar status online
router.post('/:id/heartbeat', async (req, res, next) => {
  try {
    await prisma.screen.update({
      where: { deviceId: req.params.id },
      data: { status: 'ONLINE', lastSeenAt: new Date() },
    });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
