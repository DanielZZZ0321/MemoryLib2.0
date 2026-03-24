import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db/database';

export const authRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

authRouter.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    return;
  }
  const emailTrim = String(email).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    res.status(400).json({ success: false, error: '邮箱格式不正确' });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ success: false, error: '密码至少 6 位' });
    return;
  }
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(emailTrim) as { id: number } | undefined;
    if (existing) {
      res.status(409).json({ success: false, error: '该邮箱已被注册' });
      return;
    }
    const password_hash = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const result = stmt.run(emailTrim, password_hash);
    const userId = result.lastInsertRowid as number;
    const token = jwt.sign({ userId, email: emailTrim }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: userId, email: emailTrim } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ success: false, error: '注册失败' });
  }
});

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
    return;
  }
  const emailTrim = String(email).trim().toLowerCase();
  try {
    const user = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(emailTrim) as { id: number; email: string; password_hash: string } | undefined;
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: '登录失败' });
  }
});

authRouter.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未登录' });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number };
    const user = db.prepare('SELECT id, email FROM users WHERE id = ?').get(payload.userId) as { id: number; email: string } | undefined;
    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在' });
      return;
    }
    res.json({ success: true, user: { id: user.id, email: user.email } });
  } catch {
    res.status(401).json({ success: false, error: '登录已过期，请重新登录' });
  }
});
