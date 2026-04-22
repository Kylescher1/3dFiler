import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, path.join(__dirname, '../../uploads/')),
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Upload a 3D model
router.post('/', requireAuth, upload.single('model'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const model = await prisma.model.create({
    data: {
      userId: req.user.userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
    }
  });
  res.status(201).json(model);
});

// List my models
router.get('/mine', requireAuth, async (req, res) => {
  const mine = await prisma.model.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' }
  });
  res.json(mine);
});

// Get all published models (explore page)
router.get('/explore', async (_req, res) => {
  const published = await prisma.model.findMany({
    where: { published: true },
    select: { id: true, title: true, description: true, createdAt: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(published);
});

// Get single model
router.get('/:id', async (req, res) => {
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { pois: true }
  });
  if (!model) return res.status(404).json({ error: 'Model not found' });

  if (!model.published) {
    const share = req.query.share === model.shareToken;
    const auth = req.headers.authorization;
    let owner = false;
    if (auth?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
        owner = decoded.userId === model.userId;
      } catch { /* ignore */ }
    }
    if (!owner && !share) return res.status(403).json({ error: 'Private model' });
  }

  res.json(model);
});

// Publish / unpublish
router.patch('/:id/publish', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.model.update({
    where: { id: req.params.id },
    data: { published: req.body.published ?? true }
  });
  res.json(updated);
});

// Generate share link
router.post('/:id/share', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const token = crypto.randomUUID();
  await prisma.model.update({
    where: { id: req.params.id },
    data: { shareToken: token }
  });
  res.json({ shareUrl: `/models/${model.id}?share=${token}` });
});

// Delete model
router.delete('/:id', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.model.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// Update model metadata
router.patch('/:id', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const { title, description } = req.body;
  const updated = await prisma.model.update({
    where: { id: req.params.id },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
    }
  });
  res.json(updated);
});

export default router;
