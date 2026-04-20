import express from 'express';
import jwt from 'jsonwebtoken';
import { models, pois } from './models.js';

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
router.post('/', requireAuth, (req, res) => {
  const { modelId, position, title, content, type, nestedModelId } = req.body;
  const model = models.find(m => m.id === modelId);

  if (!model) return res.status(404).json({ error: 'Model not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  const poi = {
    id: crypto.randomUUID(),
    modelId,
    position: position || { x: 0, y: 0, z: 0 },
    title: title || 'Untitled',
    content: content || '',
    type: type || 'text', // 'text' | 'nested-model'
    nestedModelId: nestedModelId || null,
    createdAt: new Date().toISOString()
  };
  pois.push(poi);
  res.status(201).json(poi);
});

// Update a POI
router.patch('/:id', requireAuth, (req, res) => {
  const poi = pois.find(p => p.id === req.params.id);
  if (!poi) return res.status(404).json({ error: 'Not found' });

  const model = models.find(m => m.id === poi.modelId);
  if (!model || model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  Object.assign(poi, req.body);
  res.json(poi);
});

// Delete a POI
router.delete('/:id', requireAuth, (req, res) => {
  const idx = pois.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });

  const model = models.find(m => m.id === pois[idx].modelId);
  if (!model || model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  pois.splice(idx, 1);
  res.status(204).send();
});

export default router;
