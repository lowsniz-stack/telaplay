const express = require('express');
const { z } = require('zod');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// GET /api/playlists
router.get('/', async (req, res, next) => {
  try {
    const { companyId } = req.query;
    const playlists = await prisma.playlist.findMany({
      where: { active: true, ...(companyId && { companyId }) },
      include: {
        _count: { select: { items: true, screens: true } },
        company: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(playlists);
  } catch (err) { next(err); }
});

// GET /api/playlists/:id
router.get('/:id', async (req, res, next) => {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { media: true },
          orderBy: { order: 'asc' },
        },
        screens: { include: { screen: true } },
      },
    });
    if (!playlist) return res.status(404).json({ error: 'Playlist não encontrada' });
    res.json(playlist);
  } catch (err) { next(err); }
});

// POST /api/playlists
router.post('/', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      loop: z.boolean().default(true),
      companyId: z.string(),
    });
    const data = schema.parse(req.body);
    const playlist = await prisma.playlist.create({ data });
    res.status(201).json(playlist);
  } catch (err) { next(err); }
});

// PUT /api/playlists/:id
router.put('/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      loop: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const playlist = await prisma.playlist.update({ where: { id: req.params.id }, data });
    res.json(playlist);
  } catch (err) { next(err); }
});

// DELETE /api/playlists/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.playlist.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/playlists/:id/items — adicionar mídia
router.post('/:id/items', async (req, res, next) => {
  try {
    const schema = z.object({
      mediaId: z.string(),
      duration: z.number().optional(),
      startAt: z.string().datetime().optional(),
      endAt: z.string().datetime().optional(),
    });
    const { mediaId, duration, startAt, endAt } = schema.parse(req.body);

    // Próxima ordem
    const last = await prisma.playlistItem.findFirst({
      where: { playlistId: req.params.id },
      orderBy: { order: 'desc' },
    });
    const order = (last?.order ?? -1) + 1;

    const item = await prisma.playlistItem.create({
      data: {
        playlistId: req.params.id,
        mediaId,
        order,
        duration,
        startAt: startAt ? new Date(startAt) : undefined,
        endAt: endAt ? new Date(endAt) : undefined,
      },
      include: { media: true },
    });

    // Atualizar timestamp da playlist para forçar reload nos players
    await prisma.playlist.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });

    res.status(201).json(item);
  } catch (err) { next(err); }
});

// PUT /api/playlists/:id/items/reorder — reordenar itens
router.put('/:id/items/reorder', async (req, res, next) => {
  try {
    const { order } = req.body; // array de { id, order }
    await prisma.$transaction(
      order.map(({ id, order: o }) =>
        prisma.playlistItem.update({ where: { id }, data: { order: o } })
      )
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// DELETE /api/playlists/:id/items/:itemId
router.delete('/:id/items/:itemId', async (req, res, next) => {
  try {
    await prisma.playlistItem.delete({ where: { id: req.params.itemId } });
    await prisma.playlist.update({
      where: { id: req.params.id },
      data: { updatedAt: new Date() },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
