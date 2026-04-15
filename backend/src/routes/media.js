const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { z } = require('zod');
const { prisma } = require('../config/database');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `telaplay/${req.body.companyId || 'default'}`, // 🔥 ALTERADO AQUI
    resource_type: file.mimetype.startsWith('video/') ? 'video' : 'image',
    transformation: file.mimetype.startsWith('image/')
      ? [{ quality: 'auto', fetch_format: 'auto', width: 1920, crop: 'limit' }]
      : [],
  }),
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Tipo de arquivo não suportado'));
  },
});

// GET /api/media
router.get('/', async (req, res, next) => {
  try {
    const { companyId, type, search } = req.query;
    const where = { active: true };
    if (companyId) where.companyId = companyId;
    if (type) where.type = type.toUpperCase();
    if (search) where.name = { contains: search, mode: 'insensitive' };

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    res.json(media);
  } catch (err) { next(err); }
});

// POST /api/media/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Nenhum arquivo enviado' });

    const isVideo = req.file.mimetype.startsWith('video/');
    const media = await prisma.media.create({
      data: {
        name: req.body.name || req.file.originalname,
        type: isVideo ? 'VIDEO' : 'IMAGE',
        url: req.file.path,
        thumbnailUrl: isVideo
          ? req.file.path.replace('/upload/', '/upload/so_0,w_640,h_360,c_fill/')
          : req.file.path,
        duration: parseInt(req.body.duration) || (isVideo ? 30 : 10),
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        companyId: req.body.companyId,
      },
    });

    res.status(201).json(media);
  } catch (err) { next(err); }
});

// PUT /api/media/:id
router.put('/:id', async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().optional(),
      duration: z.number().optional(),
    });
    const data = schema.parse(req.body);
    const media = await prisma.media.update({ where: { id: req.params.id }, data });
    res.json(media);
  } catch (err) { next(err); }
});

// DELETE /api/media/:id (soft delete)
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.media.update({
      where: { id: req.params.id },
      data: { active: false },
    });
    res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;