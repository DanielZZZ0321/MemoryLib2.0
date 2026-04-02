import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { spawnSync } from 'child_process';
import { authMiddleware } from '../middleware/auth';
import { ingestUploadedVideoToGlobalMemory } from '../services/videoIngestService';

const videoRouter = Router();

const uploadsDir = path.join(__dirname, '../../uploads');
const scriptDir = path.join(__dirname, '../../scripts');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const safe = Date.now() + '-' + Math.random().toString(36).slice(2, 9);
    cb(null, `video-${safe}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp4|mov|avi|webm|mkv)$/i;
    if (allowed.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 mp4, mov, avi, webm, mkv 格式'));
    }
  },
});

function runVideoAnalysis(videoPath: string, useTimeline: boolean): { success: boolean; data?: unknown; error?: string } {
  const apiKey = process.env.AIHUBMIX_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_AiHubMix_api_key_here') {
    return { success: false, error: '未配置 AIHUBMIX_API_KEY，请在 .env 中设置' };
  }

  const scriptPath = path.join(scriptDir, 'video_analysis.py');
  if (!fs.existsSync(scriptPath)) {
    return { success: false, error: '视频分析脚本不存在' };
  }

  const args = [scriptPath, videoPath];
  if (useTimeline) args.push('--timeline');

  const env = { ...process.env, AIHUBMIX_API_KEY: apiKey };
  const result = spawnSync('python3', args, {
    env,
    encoding: 'utf-8',
    timeout: 300000, // 5 min
  });

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  if (stderr) console.warn('[video_analysis] stderr:', stderr);

  try {
    const json = JSON.parse(stdout || '{}');
    if (json.success) {
      return { success: true, data: json };
    }
    return { success: false, error: json.error || '分析失败' };
  } catch {
    return { success: false, error: stdout || stderr || '解析分析结果失败' };
  }
}

// POST /api/video/upload - upload and analyze via Gemini (AiHubMix)
videoRouter.post(
  '/upload',
  authMiddleware,
  upload.single('video'),
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, error: '请选择要上传的视频文件' });
      return;
    }

    const filename = req.file.filename;
    const size = req.file.size;
    const videoPath = path.join(uploadsDir, filename);
    const useTimeline = req.body?.timeline === 'true' || req.query?.timeline === 'true';

    const analysisResult = runVideoAnalysis(videoPath, useTimeline);

    if (!analysisResult.success) {
      return res.json({
        success: true,
        video: { filename, size, uploadedAt: new Date().toISOString() },
        analysis: {
          status: 'error',
          message: analysisResult.error,
          mode: useTimeline ? 'timeline' : 'summary',
        },
      });
    }

    const d = analysisResult.data as Record<string, unknown>;
    const analysis = {
      status: 'ok',
      mode: d.mode || (useTimeline ? 'timeline' : 'summary'),
      text: d.text,
      events: d.events,
      raw_text: d.raw_text,
      usage_metadata: d.usage_metadata,
    };

    res.json({
      success: true,
      video: {
        filename,
        size,
        uploadedAt: new Date().toISOString(),
      },
      analysis,
    });
  },
  (err: Error, _req: Request, res: Response, _next: () => void) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({ success: false, error: '文件大小超出限制 (最大 500MB)' });
        return;
      }
    }
    res.status(400).json({ success: false, error: err.message || '上传失败' });
  }
);

// POST /api/video/ingest - ingest an uploaded video into global events + a card graph
videoRouter.post('/ingest', authMiddleware, async (req: Request, res: Response) => {
  const filename = String(req.body?.video?.filename || req.body?.filename || '').trim();
  const size = typeof req.body?.video?.size === 'number' ? (req.body.video.size as number) : undefined;
  const cardTitle = typeof req.body?.card?.title === 'string' ? (req.body.card.title as string) : undefined;
  const topThemes = typeof req.body?.card?.topThemes === 'number' ? (req.body.card.topThemes as number) : undefined;
  const timelineEvents = Array.isArray(req.body?.timelineEvents) ? (req.body.timelineEvents as unknown[]) : undefined;

  if (!filename) {
    res.status(400).json({ success: false, error: 'Missing video filename (expected body.video.filename)' });
    return;
  }

  const result = await ingestUploadedVideoToGlobalMemory({
    reqUser: (req as Request & { user?: unknown }).user,
    filename,
    size,
    cardTitle,
    topThemes,
    timelineEvents: timelineEvents as any,
  });

  if (!result.ok) {
    res.status(400).json({ success: false, error: result.error });
    return;
  }

  res.json({
    success: true,
    videoId: result.result.videoId,
    cardId: result.result.cardId,
    created: { events: result.result.createdEvents, themes: result.result.createdThemes },
    graph: result.result.graph,
  });
});

export { videoRouter };
