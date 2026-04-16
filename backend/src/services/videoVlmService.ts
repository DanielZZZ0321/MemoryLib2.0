/**
 * 调用 Python video_query.py 对片段或整段视频做 VLM 问答
 */
import path from 'path';
import { spawnSync } from 'child_process';

function scriptPath(): string {
  return path.join(__dirname, '../../scripts/video_query.py');
}

export function querySegmentVlm(clipPath: string, question: string): { ok: true; text: string } | { ok: false; error: string } {
  const apiKey = process.env.AIHUBMIX_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_AiHubMix_api_key_here') return { ok: false, error: '未配置 AIHUBMIX_API_KEY' };

  const py = scriptPath();
  const result = spawnSync('python3', [py, 'segment', clipPath, question], {
    env: { ...process.env, AIHUBMIX_API_KEY: apiKey },
    encoding: 'utf-8',
    timeout: 300000,
  });
  const stdout = (result.stdout || '').trim();
  try {
    const j = JSON.parse(stdout || '{}') as { success?: boolean; text?: string; error?: string };
    if (j.success && typeof j.text === 'string') return { ok: true, text: j.text };
    return { ok: false, error: j.error || stdout || (result.stderr || '').slice(0, 400) || 'VLM 调用失败' };
  } catch {
    return { ok: false, error: stdout || result.stderr || '解析 VLM 输出失败' };
  }
}

export function queryFullVideoVlm(videoPath: string, question: string): { ok: true; text: string } | { ok: false; error: string } {
  const apiKey = process.env.AIHUBMIX_API_KEY?.trim();
  if (!apiKey || apiKey === 'your_AiHubMix_api_key_here') return { ok: false, error: '未配置 AIHUBMIX_API_KEY' };

  const py = scriptPath();
  const result = spawnSync('python3', [py, 'full', videoPath, question], {
    env: { ...process.env, AIHUBMIX_API_KEY: apiKey },
    encoding: 'utf-8',
    timeout: 600000,
  });
  const stdout = (result.stdout || '').trim();
  try {
    const j = JSON.parse(stdout || '{}') as { success?: boolean; text?: string; error?: string };
    if (j.success && typeof j.text === 'string') return { ok: true, text: j.text };
    return { ok: false, error: j.error || stdout || (result.stderr || '').slice(0, 400) || 'VLM 调用失败' };
  } catch {
    return { ok: false, error: stdout || result.stderr || '解析 VLM 输出失败' };
  }
}
