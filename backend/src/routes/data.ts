import { Router } from 'express';
import { dataServerClient } from '../services/dataServerClient';

export const dataServerRouter = Router();

/**
 * Proxy all requests to the data processing & storage server.
 * Example: GET /api/data/items -> forwards to DATA_SERVER_URL/items
 */

dataServerRouter.all('/*', async (req, res) => {
  const path = req.path;
  const { method, body } = req;

  let result;
  if (method === 'GET') {
    result = await dataServerClient.get(path);
  } else if (method === 'POST') {
    result = await dataServerClient.post(path, body);
  } else if (method === 'PUT') {
    result = await dataServerClient.put(path, body);
  } else if (method === 'DELETE') {
    result = await dataServerClient.delete(path);
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  if (!result.success) {
    res.status(502).json(result);
    return;
  }

  res.json(result);
});
