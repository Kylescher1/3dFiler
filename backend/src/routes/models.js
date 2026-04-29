import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fs from 'fs/promises';
import { prisma } from '../lib/prisma.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/');

const SUPPORTED_EXTENSIONS = new Set(['.gltf', '.glb', '.obj', '.fbx', '.stl']);
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'are', 'was', 'were', 'you', 'your',
  'about', 'into', 'onto', 'model', 'models', 'point', 'points', 'interest', 'wiki', 'content',
  'section', 'there', 'their', 'have', 'has', 'had', 'not', 'but', 'can', 'will', 'all', 'any'
]);

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (_req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, unique + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(ext)) {
      return cb(new Error('Unsupported file type. Use GLTF, GLB, OBJ, FBX, or STL.'));
    }
    cb(null, true);
  }
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

function getCurrentUserId(req) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(auth.slice(7), process.env.JWT_SECRET).userId;
  } catch {
    return null;
  }
}

function ensureViewerAccess(model, currentUserId, shareToken) {
  if (model.published || model.userId === currentUserId) return true;
  return Boolean(shareToken && model.shareToken && shareToken === model.shareToken);
}

function parseTags(input) {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : String(input).split(/[,;]/);
  return [...new Set(raw
    .map(t => String(t).toLowerCase().trim())
    .filter(Boolean)
    .map(t => t.slice(0, 40))
  )].slice(0, 20);
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

function getExtension(originalName = '') {
  return path.extname(originalName).replace('.', '').toLowerCase();
}

function stripMarkdown(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\[\[poi:[^\]]+\]\]/g, ' ')
    .replace(/[#>*_~\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitWords(value = '') {
  return stripMarkdown(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map(word => word.trim())
    .filter(word => word.length >= 3 && !STOP_WORDS.has(word));
}

function topTerms(...values) {
  const counts = new Map();
  values.flatMap(splitWords).forEach(word => {
    counts.set(word, (counts.get(word) || 0) + 1);
  });
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([term, count]) => ({ term, count }));
}

function makeExcerpt(value = '', query = '', maxLength = 180) {
  const text = stripMarkdown(value);
  if (!text) return '';
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  const idx = q ? lower.indexOf(q) : -1;
  const start = idx > 40 ? idx - 40 : 0;
  const excerpt = text.slice(start, start + maxLength).trim();
  return `${start > 0 ? '…' : ''}${excerpt}${start + maxLength < text.length ? '…' : ''}`;
}

function summarizeModel(model) {
  const poiCount = model.pois?.length || 0;
  const nestedCount = model.pois?.filter(p => p.type === 'nested-model').length || 0;
  const textPoiCount = Math.max(0, poiCount - nestedCount);
  const tagNames = (model.tags || []).map(t => t.name);
  const terms = topTerms(
    model.title,
    model.description,
    model.wikiContent,
    ...(model.pois || []).map(p => `${p.title} ${p.content}`)
  );

  return {
    poiCount,
    nestedCount,
    textPoiCount,
    tagCount: tagNames.length,
    tags: tagNames,
    format: getExtension(model.originalName),
    hasWiki: Boolean(model.wikiContent?.trim()),
    wikiWordCount: splitWords(model.wikiContent).length,
    completionScore: Math.min(100, Math.round(
      (model.description?.trim() ? 20 : 0) +
      (model.wikiContent?.trim() ? 25 : 0) +
      Math.min(25, poiCount * 5) +
      Math.min(15, tagNames.length * 5) +
      (nestedCount > 0 ? 10 : 0) +
      (model.published ? 5 : 0)
    )),
    topTerms: terms
  };
}

function modelMatchesQuery(model, query) {
  const q = query.toLowerCase();
  const haystack = [
    model.title,
    model.description,
    model.originalName,
    model.wikiContent,
    ...(model.tags || []).map(t => t.name),
    ...(model.pois || []).flatMap(p => [p.title, p.content])
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

function scoreModel(model, query) {
  const q = query.toLowerCase();
  let score = 0;
  if (model.title?.toLowerCase().includes(q)) score += 80;
  if (model.description?.toLowerCase().includes(q)) score += 40;
  if (model.wikiContent?.toLowerCase().includes(q)) score += 35;
  if (model.originalName?.toLowerCase().includes(q)) score += 20;
  score += (model.tags || []).filter(t => t.name.toLowerCase().includes(q)).length * 45;
  score += (model.pois || []).filter(p => `${p.title} ${p.content}`.toLowerCase().includes(q)).length * 20;
  return score;
}

async function deleteUploadedFile(filename) {
  if (!filename) return;
  try {
    await fs.unlink(path.join(uploadDir, filename));
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn(`Failed to delete uploaded file ${filename}:`, error.message);
  }
}

// Upload a 3D model
router.post('/', requireAuth, upload.single('model'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const tagNames = parseTags(req.body.tags);
    const title = String(req.body.title || req.file.originalname).trim().slice(0, 120);
    const description = String(req.body.description || '').trim().slice(0, 4000);

    const model = await prisma.model.create({
      data: {
        userId: req.user.userId,
        originalName: req.file.originalname,
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size,
        title,
        description,
        tags: buildTagConnect(tagNames)
      },
      include: { tags: true, pois: true }
    });
    res.status(201).json({ ...model, summary: summarizeModel(model) });
  } catch (error) {
    if (req.file?.filename) await deleteUploadedFile(req.file.filename);
    next(error);
  }
});

// List my models
router.get('/mine', requireAuth, async (req, res) => {
  const mine = await prisma.model.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    include: { tags: true, pois: { orderBy: { order: 'asc' } } }
  });
  res.json(mine.map(model => ({ ...model, summary: summarizeModel(model) })));
});

// Library-level overview for the current user's 3D wiki
router.get('/library/overview', requireAuth, async (req, res) => {
  const models = await prisma.model.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    include: { tags: true, pois: true }
  });

  const tagCounts = new Map();
  const formatCounts = new Map();
  const graphNodes = [];
  const graphEdges = [];
  let poiCount = 0;
  let wikiCount = 0;
  let publishedCount = 0;

  models.forEach(model => {
    const summary = summarizeModel(model);
    poiCount += summary.poiCount;
    if (summary.hasWiki) wikiCount += 1;
    if (model.published) publishedCount += 1;
    formatCounts.set(summary.format || 'unknown', (formatCounts.get(summary.format || 'unknown') || 0) + 1);
    model.tags.forEach(tag => tagCounts.set(tag.name, (tagCounts.get(tag.name) || 0) + 1));
    graphNodes.push({ id: model.id, title: model.title, tags: summary.tags, poiCount: summary.poiCount, published: model.published });
    model.pois
      .filter(poi => poi.type === 'nested-model' && (poi.nestedModelId || poi.content))
      .forEach(poi => graphEdges.push({ from: model.id, to: poi.nestedModelId || poi.content, title: poi.title, poiId: poi.id }));
  });

  const recent = models.slice(0, 6).map(model => ({
    id: model.id,
    title: model.title,
    description: model.description,
    createdAt: model.createdAt,
    originalName: model.originalName,
    summary: summarizeModel(model)
  }));

  res.json({
    totals: {
      models: models.length,
      pois: poiCount,
      tags: tagCounts.size,
      wikiPages: wikiCount,
      published: publishedCount,
      private: models.length - publishedCount
    },
    tags: [...tagCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count })),
    formats: [...formatCounts.entries()].sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count })),
    graph: { nodes: graphNodes, edges: graphEdges },
    recent
  });
});

// Get all published models (explore page)
router.get('/explore', async (_req, res) => {
  const published = await prisma.model.findMany({
    where: { published: true },
    select: { id: true, title: true, description: true, createdAt: true, originalName: true, tags: true, pois: true, wikiContent: true },
    orderBy: { createdAt: 'desc' }
  });
  res.json(published.map(model => ({ ...model, summary: summarizeModel(model) })));
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

// Global search across user's models + POIs + wiki content
router.get('/search', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ models: [], pois: [], terms: [] });

  const allModels = await prisma.model.findMany({
    where: { userId: req.user.userId },
    orderBy: { createdAt: 'desc' },
    include: { tags: true, pois: { orderBy: { order: 'asc' } } }
  });

  const models = allModels
    .filter(model => modelMatchesQuery(model, q))
    .map(model => ({
      ...model,
      summary: summarizeModel(model),
      searchScore: scoreModel(model, q),
      excerpt: makeExcerpt(model.wikiContent || model.description, q)
    }))
    .sort((a, b) => b.searchScore - a.searchScore || new Date(b.createdAt) - new Date(a.createdAt));

  const pois = allModels
    .flatMap(model => model.pois.map(poi => ({ poi, model })))
    .filter(({ poi }) => `${poi.title} ${poi.content}`.toLowerCase().includes(q.toLowerCase()))
    .map(({ poi, model }) => ({
      ...poi,
      model: { id: model.id, title: model.title },
      excerpt: makeExcerpt(poi.content, q),
      searchScore: (poi.title.toLowerCase().includes(q.toLowerCase()) ? 60 : 0) + (poi.content.toLowerCase().includes(q.toLowerCase()) ? 30 : 0)
    }))
    .sort((a, b) => b.searchScore - a.searchScore)
    .slice(0, 40);

  const terms = topTerms(q, ...models.map(m => `${m.title} ${m.description} ${m.wikiContent}`));

  res.json({ models, pois, terms });
});

// Get related models based on shared tags and wiki terms
router.get('/:id/related', async (req, res) => {
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { tags: true, pois: true }
  });
  if (!model) return res.status(404).json({ error: 'Model not found' });

  const currentUserId = getCurrentUserId(req);
  if (!ensureViewerAccess(model, currentUserId, req.query.share)) {
    return res.status(403).json({ error: 'Private model' });
  }

  const tagNames = model.tags.map(t => t.name);
  const termNames = topTerms(model.title, model.description, model.wikiContent, ...model.pois.map(p => `${p.title} ${p.content}`)).map(t => t.term);

  const visibilityFilter = currentUserId
    ? { OR: [{ published: true }, { userId: currentUserId }] }
    : { published: true };

  const candidates = await prisma.model.findMany({
    where: {
      id: { not: model.id },
      ...visibilityFilter
    },
    orderBy: { createdAt: 'desc' },
    include: { tags: true, pois: true },
    take: 100
  });

  const related = candidates
    .map(candidate => {
      const candidateText = `${candidate.title} ${candidate.description} ${candidate.wikiContent} ${(candidate.pois || []).map(p => `${p.title} ${p.content}`).join(' ')}`.toLowerCase();
      const sharedTags = candidate.tags.filter(t => tagNames.includes(t.name)).map(t => t.name);
      const sharedTerms = termNames.filter(term => candidateText.includes(term)).slice(0, 6);
      return {
        id: candidate.id,
        title: candidate.title,
        description: candidate.description,
        originalName: candidate.originalName,
        tags: candidate.tags,
        summary: summarizeModel(candidate),
        sharedTagCount: sharedTags.length,
        sharedTags,
        sharedTerms,
        relevanceScore: sharedTags.length * 10 + sharedTerms.length * 2
      };
    })
    .filter(item => item.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore || b.sharedTagCount - a.sharedTagCount)
    .slice(0, 10);

  res.json(related);
});

// Publish / unpublish
router.patch('/:id/publish', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const updated = await prisma.model.update({
    where: { id: req.params.id },
    data: { published: Boolean(req.body.published ?? true) },
    include: { tags: true, pois: true }
  });
  res.json({ ...updated, summary: summarizeModel(updated) });
});

// Generate or refresh share link
router.post('/:id/share', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const token = crypto.randomUUID();
  await prisma.model.update({
    where: { id: req.params.id },
    data: { shareToken: token }
  });
  res.json({ shareUrl: `/model/${model.id}?share=${token}` });
});

// Delete model and uploaded file
router.delete('/:id', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.model.delete({ where: { id: req.params.id } });
  await deleteUploadedFile(model.filename);
  res.status(204).send();
});

// Update model metadata and wiki content
router.patch('/:id', requireAuth, async (req, res) => {
  const model = await prisma.model.findUnique({ where: { id: req.params.id } });
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const { title, description, wikiContent } = req.body;
  const tagNames = parseTags(req.body.tags);

  const updateData = {
    ...(title !== undefined && { title: String(title).trim().slice(0, 120) }),
    ...(description !== undefined && { description: String(description).trim().slice(0, 4000) }),
    ...(wikiContent !== undefined && { wikiContent: String(wikiContent).slice(0, 100000) }),
  };

  if (req.body.tags !== undefined) updateData.tags = { set: [] };

  let updated = await prisma.model.update({
    where: { id: req.params.id },
    data: updateData,
    include: { tags: true, pois: { orderBy: { order: 'asc' } } }
  });

  if (req.body.tags !== undefined && tagNames.length > 0) {
    updated = await prisma.model.update({
      where: { id: req.params.id },
      data: { tags: buildTagConnect(tagNames) },
      include: { tags: true, pois: { orderBy: { order: 'asc' } } }
    });
  }

  res.json({ ...updated, summary: summarizeModel(updated) });
});

// Get single model with wiki graph data
router.get('/:id', async (req, res) => {
  const model = await prisma.model.findUnique({
    where: { id: req.params.id },
    include: { pois: { orderBy: { order: 'asc' } }, tags: true }
  });
  if (!model) return res.status(404).json({ error: 'Model not found' });

  const currentUserId = getCurrentUserId(req);
  if (!ensureViewerAccess(model, currentUserId, req.query.share)) {
    return res.status(403).json({ error: 'Private model' });
  }

  const backlinks = await prisma.pOI.findMany({
    where: {
      type: 'nested-model',
      OR: [{ content: req.params.id }, { nestedModelId: req.params.id }]
    },
    include: { model: { select: { id: true, title: true, published: true, userId: true, tags: true } } }
  });

  const visibleBacklinks = backlinks
    .filter(b => b.model.published || b.model.userId === currentUserId)
    .map(b => ({
      id: b.model.id,
      title: b.model.title,
      poiTitle: b.title,
      tags: b.model.tags,
      poiId: b.id
    }));

  const nestedModelIds = [...new Set(model.pois
    .filter(poi => poi.type === 'nested-model')
    .map(poi => poi.nestedModelId || poi.content)
    .filter(Boolean))];

  const nestedModels = nestedModelIds.length > 0
    ? await prisma.model.findMany({
      where: {
        id: { in: nestedModelIds },
        OR: [{ published: true }, { userId: currentUserId }]
      },
      select: { id: true, title: true, description: true, originalName: true, tags: true, published: true }
    })
    : [];

  res.json({
    ...model,
    backlinks: visibleBacklinks,
    nestedModels,
    summary: summarizeModel(model),
    isOwner: model.userId === currentUserId
  });
});

export default router;
