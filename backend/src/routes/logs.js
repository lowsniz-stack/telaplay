const express = require('express');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { screenId, limit = 100 } = req.query;
    const logs = await prisma.displayLog.findMany({
      where: screenId ? { screenId } : {},
      include: { screen: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });
    res.json(logs);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { screenId, event, metadata } = req.body;
    const log = await prisma.displayLog.create({
      data: { screenId, event, metadata, userId: req.user?.id },
    });
    res.status(201).json(log);
  } catch (err) { next(err); }
});

module.exports = router;
