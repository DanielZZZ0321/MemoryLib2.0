import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
// 从 app/data 读取（backend/src/routes -> ../../../ = app 根目录）
const CONFIG_PATH = path.join(__dirname, '../../../data/page-config.json');

router.get('/page-config', (_req, res) => {
  try {
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(data);
    res.json(config);
  } catch (err) {
    console.error('Failed to read page-config.json:', err);
    res.status(500).json({ error: 'Failed to load page configuration' });
  }
});

export default router;
