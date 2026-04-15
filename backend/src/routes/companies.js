const express = require('express');
const { z } = require('zod');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  logoUrl: z.string().url().optional(),
});

router.get('/', async (req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { screens: true, media: true, playlists: true } },
      },
    });
    res.json(companies);
  } catch (err) { next(err); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.params.id },
      include: { screens: true, playlists: true },
    });
    if (!company) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(company);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const data = schema.parse(req.body);
    const company = await prisma.company.create({
      data: { ...data, userId: req.user.id },
    });
    res.status(201).json(company);
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'Slug já em uso' });
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const data = schema.partial().parse(req.body);
    const company = await prisma.company.update({ where: { id: req.params.id }, data });
    res.json(company);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.company.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
