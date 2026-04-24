import './loadEnv';
import path from 'path';
import http from 'http';

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { memoryCoreProxy } from './proxy/memoryCoreProxy';
import { dataServerRouter } from './routes/data';
import { eventsRouter } from './routes/events';
import { authRouter } from './routes/auth';
import { videoRouter } from './routes/video';
import pageConfigRouter from './routes/pageConfig';
import memorylibRouter from './routes/memorylib';
import chatRouter from './routes/chat';
import { cardsRouter } from './routes/cards';
import { eventsGlobalRouter } from './routes/eventsGlobal';
import { dataServerClient } from './services/dataServerClient';

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.use(cors());

// 蹇呴』鍦?express.json() 涔嬪墠锛氬惁鍒?JSON body 琚В鏋愭秷璐瑰悗锛屾棤娉曟纭浆鍙戝埌 FastAPI锛堟祦寮?/chat/stream 浼氭寕姝荤洿鑷宠秴鏃讹級
app.use('/api/memory-core', memoryCoreProxy);

app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/data', dataServerRouter);
app.use('/api/events', eventsRouter);
app.use('/api/video', videoRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/events-global', eventsGlobalRouter);
app.use('/api/memorylibs', memorylibRouter);
app.use('/api/chat', chatRouter);
// 椤甸潰鏋勫缓閰嶇疆锛欸ET /api/page-config 杩斿洖 data/page-config.json
app.use('/api', pageConfigRouter);
// Expose uploaded media so event cards can render video/image/audio URLs.
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.get('/index.html', (_req, res) => res.redirect(301, '/'));
  app.use(express.static(frontendDist, { index: 'index.html' }));
  app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  app.get('*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    res.send('<p>Run <code>npm run build</code> then <code>npm run start</code> to serve the frontend.</p>');
  });
}

const server = http.createServer(app);

const upgradeHandler = (memoryCoreProxy as unknown as { upgrade?: http.RequestListener }).upgrade;
if (typeof upgradeHandler === 'function') {
  server.on('upgrade', upgradeHandler);
}

server.listen(Number(PORT), HOST, () => {
  console.log(`Server running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(
    `Memory core proxy: /api/memory-core -> ${process.env.MEMORY_CORE_URL || 'http://127.0.0.1:8000'}`
  );
  dataServerClient
    .checkConnection()
    .then((connected) => {
      if (connected) console.log('Data server connection: OK');
      else console.warn('Data server connection: NOT AVAILABLE');
    })
    .catch(() => console.warn('Data server connection: NOT AVAILABLE'));
});
