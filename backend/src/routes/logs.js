const express = require('express');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

/**
 * POST público para o player registrar exibição
 * Não exige login, porque o player roda por shareToken
 */
router.post('/display', async (req, res, next) => {
  try {
    const { screenId, event, metadata } = req.body;

    if (!screenId || !event) {
      return res.status(400).json({
        error: 'screenId e event são obrigatórios',
      });
    }

    const log = await prisma.displayLog.create({
      data: {
        screenId,
        event,
        metadata,
      },
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

/**
 * A partir daqui, mantém protegido para o dashboard/admin
 */
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { screenId, limit = 100 } = req.query;

    const logs = await prisma.displayLog.findMany({
      where: screenId ? { screenId } : {},
      include: {
        screen: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit, 10),
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { screenId, event, metadata } = req.body;

    if (!screenId || !event) {
      return res.status(400).json({
        error: 'screenId e event são obrigatórios',
      });
    }

    const log = await prisma.displayLog.create({
      data: {
        screenId,
        event,
        metadata,
        userId: req.user?.id,
      },
    });

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
});

module.exports = router;