import express from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const router = express.Router();

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

function normalizeType(type) {
  return type === 'nested-model' ? 'nested-model' : 'text';
}

function normalizeNestedId(type, content, nestedModelId) {
  if (type !== 'nested-model') return null;
  return nestedModelId || content || null;
}

async function assertModelOwner(modelId, userId) {
  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model) return { error: { status: 404, message: 'Model not found' } };
  if (model.userId !== userId) return { error: { status: 403, message: 'Forbidden' } };
  return { model };
}

async function validateNestedModel(nestedModelId, userId) {
  if (!nestedModelId) return { ok: true };
  const nested = await prisma.model.findUnique({ where: { id: nestedModelId } });
  if (!nested) return { ok: false, status: 400, message: 'Linked model does not exist' };
  if (!nested.published && nested.userId !== userId) {
    return { ok: false, status: 403, message: 'You cannot link to a private model you do not own' };
  }
  return { ok: true };
}

// Create a point of interest on a model
router.post('/', requireAuth, async (req, res) => {
  const { modelId, position, title, content, nestedModelId } = req.body;
  const type = normalizeType(req.body.type);
  const ownership = await assertModelOwner(modelId, req.user.userId);
  if (ownership.error) return res.status(ownership.error.status).json({ error: ownership.error.message });

  const linkId = normalizeNestedId(type, content, nestedModelId);
  const nestedCheck = await validateNestedModel(linkId, req.user.userId);
  if (!nestedCheck.ok) return res.status(nestedCheck.status).json({ error: nestedCheck.message });

  const maxOrder = await prisma.pOI.aggregate({
    where: { modelId },
    _max: { order: true }
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const poi = await prisma.pOI.create({
    data: {
      modelId,
      title: String(title || 'Untitled').trim().slice(0, 120),
      content: type === 'nested-model' ? linkId : String(content || '').slice(0, 20000),
      type,
      nestedModelId: linkId,
      positionX: Number(position?.x ?? 0),
      positionY: Number(position?.y ?? 0),
      positionZ: Number(position?.z ?? 0),
      cameraView: String(req.body.cameraView || '{}'),
      order: nextOrder
    }
  });
  res.status(201).json(poi);
});

// Update a POI
router.patch('/:id', requireAuth, async (req, res) => {
  const poi = await prisma.pOI.findUnique({ where: { id: req.params.id } });
  if (!poi) return res.status(404).json({ error: 'Not found' });

  const ownership = await assertModelOwner(poi.modelId, req.user.userId);
  if (ownership.error) return res.status(ownership.error.status).json({ error: ownership.error.message });

  const data = {};
  const nextType = req.body.type !== undefined ? normalizeType(req.body.type) : poi.type;
  const nextContent = req.body.content !== undefined ? req.body.content : poi.content;
  const nextNestedModelId = req.body.nestedModelId !== undefined ? req.body.nestedModelId : poi.nestedModelId;
  const linkId = normalizeNestedId(nextType, nextContent, nextNestedModelId);

  const nestedCheck = await validateNestedModel(linkId, req.user.userId);
  if (!nestedCheck.ok) return res.status(nestedCheck.status).json({ error: nestedCheck.message });

  if (req.body.title !== undefined) data.title = String(req.body.title || 'Untitled').trim().slice(0, 120);
  if (req.body.type !== undefined) data.type = nextType;
  if (req.body.content !== undefined || req.body.nestedModelId !== undefined || req.body.type !== undefined) {
    data.content = nextType === 'nested-model' ? linkId : String(nextContent || '').slice(0, 20000);
    data.nestedModelId = linkId;
  }
  if (req.body.position) {
    data.positionX = Number(req.body.position.x ?? poi.positionX);
    data.positionY = Number(req.body.position.y ?? poi.positionY);
    data.positionZ = Number(req.body.position.z ?? poi.positionZ);
  }
  if (req.body.order !== undefined) data.order = Number(req.body.order);
  if (req.body.cameraView !== undefined) data.cameraView = String(req.body.cameraView);

  const updated = await prisma.pOI.update({
    where: { id: req.params.id },
    data
  });
  res.json(updated);
});

// Persist point-of-interest order for a model
router.post('/reorder', requireAuth, async (req, res) => {
  const { modelId, poiIds } = req.body;
  if (!Array.isArray(poiIds)) return res.status(400).json({ error: 'poiIds must be an array' });

  const ownership = await assertModelOwner(modelId, req.user.userId);
  if (ownership.error) return res.status(ownership.error.status).json({ error: ownership.error.message });

  const existing = await prisma.pOI.findMany({
    where: { modelId },
    select: { id: true }
  });
  const existingIds = new Set(existing.map(p => p.id));
  const requestedIds = [...new Set(poiIds.filter(id => existingIds.has(id)))];
  const missingIds = existing.map(p => p.id).filter(id => !requestedIds.includes(id));
  const orderedIds = [...requestedIds, ...missingIds];

  await prisma.$transaction(
    orderedIds.map((id, idx) => prisma.pOI.update({ where: { id }, data: { order: idx } }))
  );

  const pois = await prisma.pOI.findMany({
    where: { modelId },
    orderBy: { order: 'asc' }
  });
  res.json(pois);
});

// Delete a POI
router.delete('/:id', requireAuth, async (req, res) => {
  const poi = await prisma.pOI.findUnique({ where: { id: req.params.id } });
  if (!poi) return res.status(404).json({ error: 'Not found' });

  const ownership = await assertModelOwner(poi.modelId, req.user.userId);
  if (ownership.error) return res.status(ownership.error.status).json({ error: ownership.error.message });

  await prisma.pOI.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
