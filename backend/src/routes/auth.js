import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'crypto';

const router = express.Router();

// In-memory user store (replace with DB later)
const users = [];

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email, and password required' });
  }

  const existing = users.find(u => u.email === email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    password: hashed,
    createdAt: new Date().toISOString()
  };
  users.push(user);

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.status(201).json({ token, user: { id: user.id, username, email } });
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

// Me
router.get('/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, email: user.email });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
