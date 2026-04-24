import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
// 浠?app/data 璇诲彇锛坆ackend/src/routes -> ../../../ = app 鏍圭洰褰曪級
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
