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

// Create a point of interest on a model
router.post('/', requireAuth, async (req, res) => {
  const { modelId, position, title, content, type, nestedModelId } = req.body;
  const model = await prisma.model.findUnique({ where: { id: modelId } });

  if (!model) return res.status(404).json({ error: 'Model not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const maxOrder = await prisma.pOI.aggregate({
    where: { modelId },
    _max: { order: true }
  });
  const nextOrder = (maxOrder._max.order ?? -1) + 1;

  const poi = await prisma.pOI.create({
    data: {
      modelId,
      title: title || 'Untitled',
      content: content || '',
      type: type || 'text',
      nestedModelId: nestedModelId || null,
      positionX: position?.x ?? 0,
      positionY: position?.y ?? 0,
      positionZ: position?.z ?? 0,
      order: nextOrder,
    }
  });
  res.status(201).json(poi);
});

// Update a POI
router.patch('/:id', requireAuth, async (req, res) => {
  const poi = await prisma.pOI.findUnique({ where: { id: req.params.id } });
  if (!poi) return res.status(404).json({ error: 'Not found' });

  const model = await prisma.model.findUnique({ where: { id: poi.modelId } });
  if (!model || model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const data = {};
  if (req.body.title !== undefined) data.title = req.body.title;
  if (req.body.content !== undefined) data.content = req.body.content;
  if (req.body.type !== undefined) data.type = req.body.type;
  if (req.body.nestedModelId !== undefined) data.nestedModelId = req.body.nestedModelId;
  if (req.body.position) {
    data.positionX = req.body.position.x;
    data.positionY = req.body.position.y;
    data.positionZ = req.body.position.z;
  }
  if (req.body.order !== undefined) data.order = req.body.order;

  const updated = await prisma.pOI.update({
    where: { id: req.params.id },
    data
  });
  res.json(updated);
});

// Bulk reorder POIs for a model
router.post('/reorder', requireAuth, async (req, res) => {
  const { modelId, poiIds } = req.body;
  if (!modelId || !Array.isArray(poiIds)) return res.status(400).json({ error: 'modelId and poiIds array required' });

  const model = await prisma.model.findUnique({ where: { id: modelId } });
  if (!model || model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.$transaction(
    poiIds.map((pid, idx) =>
      prisma.pOI.update({
        where: { id: pid },
        data: { order: idx }
      })
    )
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

  const model = await prisma.model.findUnique({ where: { id: poi.modelId } });
  if (!model || model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  await prisma.pOI.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
