import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';

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
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const models = [];
const pois = [];

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
router.post('/', requireAuth, upload.single('model'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const model = {
    id: crypto.randomUUID(),
    userId: req.user.userId,
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimetype: req.file.mimetype,
    size: req.file.size,
    title: req.body.title || req.file.originalname,
    description: req.body.description || '',
    published: false,
    shareToken: null,
    createdAt: new Date().toISOString()
  };
  models.push(model);
  res.status(201).json(model);
});

// List my models
router.get('/mine', requireAuth, (req, res) => {
  const mine = models.filter(m => m.userId === req.user.userId);
  res.json(mine);
});

// Get all published models (explore page)
router.get('/explore', (_req, res) => {
  const published = models.filter(m => m.published).map(m => ({
    id: m.id,
    title: m.title,
    description: m.description,
    createdAt: m.createdAt
  }));
  res.json(published);
});

// Get single model
router.get('/:id', (req, res) => {
  const model = models.find(m => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });

  // If private, require ownership or share token
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

  const modelPois = pois.filter(p => p.modelId === model.id);
  res.json({ ...model, pois: modelPois });
});

// Publish / unpublish
router.patch('/:id/publish', requireAuth, (req, res) => {
  const model = models.find(m => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  model.published = req.body.published ?? true;
  res.json(model);
});

// Generate share link
router.post('/:id/share', requireAuth, (req, res) => {
  const model = models.find(m => m.id === req.params.id);
  if (!model) return res.status(404).json({ error: 'Not found' });
  if (model.userId !== req.user.userId) return res.status(403).json({ error: 'Forbidden' });

  model.shareToken = crypto.randomUUID();
  res.json({ shareUrl: `/models/${model.id}?share=${model.shareToken}` });
});

export default router;
export { models, pois };
