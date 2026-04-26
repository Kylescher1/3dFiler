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

function parseTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(t => String(t).toLowerCase().trim()).filter(Boolean);
  return String(input)
    .split(/[,;]/)
    .map(t => t.toLowerCase().trim())
    .filter(Boolean);
}

function buildTagConnect(tagNames) {
  if (!tagNames || tagNames.length === 0) return undefined;
  return {
    connectOrCreate: tagNames.map(name => ({
      where: { name },
      create: { name }
    }))
  };
}

// Upload a 3D model
router.post('/', requireAuth, upload.single('model'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const tagNames = parseTags(req.body.tags);

  const model = await prisma.model.create({
    data: {
      userId: req.user.userId,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      title: req.body.title || req.file.originalname,
      description: req.body.description || '',
      tags: buildTagConnect(tagNames)
    },
    include: { tags: true, pois: true }
  });
  res.status(201).json(model);
});

// List my models
router.get('/mine', requireAuth, async (req, res) => {
  const mine = await prisma.model.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    include: { tags: true }
  });
  res.json(mine);
});

// Get all published models (explore page)
router.get('/explore', async (_req, res) => {
  const published = await prisma.model.findMany({
    where: { published: true },
    select: { id: true, title: true, description: true, createdAt: true, originalName: true, tags: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(published);
});

// Get single model
router.get('/:id', async (req, res) => {
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { pois: true, tags: true }
  });
  if (!model) return res.status(404).json({ error: 'Model not found' });

  let currentUserId = null;
  if (!model.published) {
    const share = req.query.share === model.shareToken;
    const auth = req.headers.authorization;
    let owner = false;
    if (auth?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
        owner = decoded.userId === model.userId;
        currentUserId = decoded.userId;
      } catch { /* ignore */ }
    }
    if (!owner && !share) return res.status(403).json({ error: 'Private model' });
  } else {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
        currentUserId = decoded.userId;
      } catch { /* ignore */ }
    }
  }

  // Gather backlinks: other models whose POIs link to this model
  const backlinks = await prisma.pOI.findMany({
    where: { type: 'nested-model', content: req.params.id },
    include: { model: { select: { id: true, title: true, published: true, userId: true } } }
  });

  const visibleBacklinks = backlinks
    .filter(b => b.model.published || b.model.userId === currentUserId)
    .map(b => ({ id: b.model.id, title: b.model.title, poiTitle: b.title }));

  res.json({ ...model, backlinks: visibleBacklinks });
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

  const { title, description, wikiContent } = req.body;
  const tagNames = parseTags(req.body.tags);

  const updateData = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(wikiContent !== undefined && { wikiContent }),
  };

  if (req.body.tags !== undefined) {
    updateData.tags = { set: [] }; // clear first
  }

  let updated = await prisma.model.update({
    where: { id: req.params.id },
    data: updateData,
    include: { tags: true }
  });

  if (req.body.tags !== undefined && tagNames.length > 0) {
    updated = await prisma.model.update({
      where: { id: req.params.id },
      data: { tags: buildTagConnect(tagNames) },
      include: { tags: true }
    });
  }

  res.json(updated);
});

// List all tags for the current user
router.get('/tags/mine', requireAuth, async (req, res) => {
  const tags = await prisma.tag.findMany({
    where: { models: { some: { userId: req.user.userId } } },
    select: { id: true, name: true, _count: { select: { models: true } } },
    orderBy: { name: 'asc' }
  });
  res.json(tags);
});

// Global search across user's models + POIs
router.get('/search', requireAuth, async (req, res) => {
  const q = (req.query.q || '').toLowerCase().trim();
  if (!q) return res.json({ models: [], pois: [] });

  const models = await prisma.model.findMany({
    where: {
      userId: req.user.userId,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { originalName: { contains: q, mode: 'insensitive' } },
        { tags: { some: { name: { contains: q, mode: 'insensitive' } } } }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { tags: true }
  });

  const pois = await prisma.pOI.findMany({
    where: {
      model: { userId: req.user.userId },
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } }
      ]
    },
    include: { model: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20
  });

  res.json({ models, pois });
});

// Get related models based on shared tags
router.get('/:id/related', async (req, res) => {
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { tags: true }
  });
  if (!model) return res.status(404).json({ error: 'Model not found' });

  let currentUserId = null;
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      currentUserId = jwt.verify(auth.slice(7), process.env.JWT_SECRET).userId;
    } catch { /* ignore */ }
  }

  // Must be owner or published to see related
  if (!model.published && model.userId !== currentUserId) {
    const share = req.query.share === model.shareToken;
    if (!share) return res.status(403).json({ error: 'Private model' });
  }

  const tagNames = model.tags.map(t => t.name);
  if (tagNames.length === 0) return res.json([]);

  const related = await prisma.model.findMany({
    where: {
      id: { not: model.id },
      OR: [
        { published: true },
        { userId: currentUserId }
      ],
      tags: { some: { name: { in: tagNames } } }
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, title: true, description: true, originalName: true, tags: true },
    take: 10
  });

  // Sort by number of shared tags (most relevant first)
  const scored = related.map(r => {
    const shared = r.tags.filter(t => tagNames.includes(t.name)).length;
    return { ...r, sharedTagCount: shared };
  });
  scored.sort((a, b) => b.sharedTagCount - a.sharedTagCount);

  res.json(scored);
});

export default router;
