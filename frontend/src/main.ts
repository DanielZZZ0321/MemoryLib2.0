import * as authApi from './auth';

const app = document.getElementById('app')!;
let currentUser: { id: number; email: string } | null = null;

/** 概念图/象限配置类型 */
interface ConceptPhoto {
  checker?: boolean;
  src?: string;
  title?: string;
}
interface ConceptItem {
  id: string;
  label: string;
  x: number;
  y: number;
  photos?: ConceptPhoto[];
}
interface ConceptDate {
  label: string;
  x: number;
  y: number;
  linkTo: string;
  sourceFile?: string;
}
interface ConceptGraphConfig {
  conceptOrder?: string[];
  concepts?: ConceptItem[];
  dates?: ConceptDate[];
}
interface QuadrantEvent {
  time: number;
  category: 'working' | 'resting';
  highlight?: boolean;
  sourceFile?: string;
  title?: string;
}
interface QuadrantConfig {
  timeline?: string[];
  events?: QuadrantEvent[];
}

/** 页面构建配置，从 /api/page-config 读取 data/page-config.json */
interface PageConfig {
  version?: string;
  title?: string;
  viewBox?: { width: number; height: number };
  memoryLibs?: Array<{ id: string; title: string; dateRange: string; tags: string[]; color: string; year: number; sourceFile?: string }>;
  conceptGraph?: ConceptGraphConfig;
  quadrant?: QuadrantConfig;
  wavyPathAmplitude?: number;
}

let pageConfig: PageConfig | null = null;

async function loadPageConfig(): Promise<PageConfig | null> {
  try {
    const res = await fetch('/api/page-config');
    if (!res.ok) return null;
    const data = await res.json();
    pageConfig = data as PageConfig;
    return pageConfig;
  } catch (err) {
    console.warn('Failed to load page-config:', err);
    return null;
  }
}

async function init() {
  const user = await authApi.getMe();
  if (user) {
    currentUser = user;
    await loadPageConfig();
    renderMemoryLibHistory();
  } else {
    renderLoginScreen();
  }
}

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function renderLoginScreen() {
  app.innerHTML = `
    <div class="auth-screen">
      <div class="auth-card">
        <h1 class="auth-title">Workspace</h1>
        <div class="auth-tabs">
          <button class="auth-tab active" data-tab="login">登录</button>
          <button class="auth-tab" data-tab="register">注册</button>
        </div>
        <form class="auth-form" id="auth-form">
          <div class="auth-field">
            <label>邮箱</label>
            <input type="email" name="email" placeholder="your@email.com" required autocomplete="email" />
          </div>
          <div class="auth-field">
            <label>密码</label>
            <input type="password" name="password" placeholder="至少 6 位" required minlength="6" autocomplete="current-password" />
          </div>
          <div class="auth-field auth-field-register" id="auth-field-confirm">
            <label>确认密码</label>
            <input type="password" name="confirmPassword" placeholder="再次输入密码" autocomplete="new-password" />
          </div>
          <div class="auth-error" id="auth-error"></div>
          <button type="submit" class="auth-submit" id="auth-submit">登录</button>
        </form>
        <p class="auth-switch" id="auth-switch">还没有账号？<a href="#" data-action="register">立即注册</a></p>
      </div>
    </div>
  `;

  const form = app.querySelector('#auth-form')! as HTMLFormElement;
  const tabs = app.querySelectorAll('.auth-tab');
  const confirmField = app.querySelector('#auth-field-confirm')! as HTMLElement;
  const submitBtn = app.querySelector('#auth-submit')! as HTMLButtonElement;
  const errorEl = app.querySelector('#auth-error')! as HTMLElement;
  const switchEl = app.querySelector('#auth-switch')! as HTMLElement;

  let mode: 'login' | 'register' = 'login';

  function setMode(m: 'login' | 'register') {
    mode = m;
    tabs.forEach((t) => t.classList.toggle('active', (t as HTMLElement).dataset.tab === m));
    confirmField.style.display = m === 'register' ? 'block' : 'none';
    submitBtn.textContent = m === 'login' ? '登录' : '注册';
    switchEl.innerHTML = m === 'login' ? '还没有账号？<a href="#" data-action="register">立即注册</a>' : '已有账号？<a href="#" data-action="login">立即登录</a>';
    errorEl.textContent = '';
  }

  tabs.forEach((t) => t.addEventListener('click', () => setMode((t as HTMLElement).dataset.tab as 'login' | 'register')));
  switchEl.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest('a');
    if (a?.dataset.action) {
      e.preventDefault();
      setMode(a.dataset.action as 'login' | 'register');
    }
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = (fd.get('email') as string).trim();
    const password = fd.get('password') as string;
    const confirmPassword = fd.get('confirmPassword') as string;
    errorEl.textContent = '';

    if (mode === 'register' && password !== confirmPassword) {
      errorEl.textContent = '两次密码输入不一致';
      return;
    }

    try {
      submitBtn.disabled = true;
      mode === 'login' ? await authApi.login(email, password) : await authApi.register(email, password);
      currentUser = await authApi.getMe();
      if (currentUser) {
        await loadPageConfig();
        renderMemoryLibHistory();
      }
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : '操作失败';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

// ---------- MemoryLib History ----------
interface MemoryLibEntry {
  id: string;
  title: string;
  dateRange: string;
  tags: string[];
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
  year: number;
}

const SAMPLE_MEMORYLIBS: MemoryLibEntry[] = [
  { id: '1', title: "My Last Week's Diary", dateRange: '2.13-2.16', tags: ['People', 'Emotion'], color: 'blue', year: 2026 },
  { id: '2', title: 'Logic of event occurrence', dateRange: '9.13-9.16', tags: ['Event', 'Time'], color: 'yellow', year: 2026 },
  { id: '3', title: 'N/A', dateRange: '10.18-10.19', tags: ['Emotion', 'Workflow'], color: 'green', year: 2026 },
  { id: '4', title: 'Daily Reflection', dateRange: '1.14-2.12', tags: ['Color', 'Event'], color: 'purple', year: 2025 },
  { id: '5', title: 'Decision Making', dateRange: '3.23-3.27', tags: ['Event', 'Emotion'], color: 'red', year: 2025 },
];

function renderMemoryLibHistory() {
  const entries: MemoryLibEntry[] =
    pageConfig?.memoryLibs?.map((m) => ({
      id: m.id,
      title: m.title,
      dateRange: m.dateRange,
      tags: m.tags ?? [],
      color: (m.color as MemoryLibEntry['color']) || 'blue',
      year: m.year,
    })) ?? SAMPLE_MEMORYLIBS;
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a);

  app.innerHTML = `
    <div class="memorylib-page">
      <div class="memorylib-header">
        <h1 class="memorylib-title">MemoryLib <span class="underline">History</span></h1>
        <div class="memorylib-nav">
          <span class="toolbar-user" style="color:#64748b">${escapeHtml(currentUser?.email ?? '')}</span>
          <button class="toolbar-btn" data-video-upload>上传视频分析</button>
          <button class="toolbar-btn" data-logout>退出</button>
        </div>
      </div>

      ${years
        .map(
          (year) => `
        <h2 class="memorylib-year">${year}</h2>
        <div class="memorylib-cards">
          ${entries
            .filter((e) => e.year === year)
            .map(
              (e) => `
            <div class="memorylib-card mlb-${e.color}" data-memorylib-id="${e.id}">
              <span class="memorylib-date-ribbon mlb-${e.color}">${escapeHtml(e.dateRange)}</span>
              <div class="memorylib-card-title">${escapeHtml(e.title)}</div>
              <div class="memorylib-tags">
                ${e.tags.map((t) => `<span class="memorylib-tag mlb-${e.color}">${escapeHtml(t)}</span>`).join('')}
              </div>
            </div>
          `
            )
            .join('')}
          ${year === years[0] ? `
            <button class="memorylib-new-btn" data-new-memorylib>
              <span>New MemoryLib</span>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
          ` : ''}
        </div>
      `
        )
        .join('')}
    </div>
  `;

  app.querySelectorAll('[data-memorylib-id]').forEach((el) => el.addEventListener('click', () => renderWorkspace()));
  app.querySelector('[data-new-memorylib]')?.addEventListener('click', () => renderWorkspace());
  app.querySelector('[data-video-upload]')?.addEventListener('click', () => renderVideoUploadAnalysis());
  app.querySelector('[data-logout]')?.addEventListener('click', () => {
    authApi.logout();
    currentUser = null;
    renderLoginScreen();
  });
}

// ---------- Video Upload & Analysis ----------
function renderVideoUploadAnalysis() {
  app.innerHTML = `
    <div class="video-upload-page">
      <div class="video-upload-header">
        <button class="toolbar-btn" data-back-history>← 返回</button>
      </div>
      <div class="video-upload-content">
        <h1 class="video-upload-title">视频上传与分析</h1>
        <form id="video-upload-form" class="video-upload-form">
          <div class="video-upload-field">
            <label>选择视频文件</label>
            <input type="file" name="video" accept="video/*" id="video-file-input" required />
          </div>
          <div class="video-upload-field video-upload-option">
            <label><input type="checkbox" name="timeline" id="video-timeline-check" /> 时间线分析（返回带时间戳的事件列表）</label>
          </div>
          <button type="submit" class="video-upload-submit" id="video-upload-submit">上传并分析</button>
        </form>
        <div class="video-analysis-result" id="video-analysis-result">
          <div class="video-analysis-placeholder">暂无分析结果，请先上传视频</div>
        </div>
      </div>
    </div>
  `;

  app.querySelector('[data-back-history]')?.addEventListener('click', () => renderMemoryLibHistory());

  const form = app.querySelector('#video-upload-form')! as HTMLFormElement;
  const submitBtn = app.querySelector('#video-upload-submit')! as HTMLButtonElement;
  const resultEl = app.querySelector('#video-analysis-result')! as HTMLElement;
  const placeholderEl = resultEl.querySelector('.video-analysis-placeholder');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fileInput = app.querySelector('#video-file-input')! as HTMLInputElement;
    const file = fileInput.files?.[0];
    if (!file) return;

    const token = authApi.getToken();
    if (!token) {
      resultEl.innerHTML = '<div class="video-analysis-error">请先登录</div>';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = '上传中...';
    if (placeholderEl) placeholderEl.textContent = '正在上传并分析...';

    try {
      const fd = new FormData();
      fd.append('video', file);
      const timelineChecked = (app.querySelector('#video-timeline-check') as HTMLInputElement)?.checked;
      if (timelineChecked) fd.append('timeline', 'true');

      const res = await fetch('/api/video/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await res.json();

      if (data.success) {
        const analysis = data.analysis || {};
        let analysisHtml = '';
        if (analysis.status === 'error') {
          analysisHtml = `<div class="video-analysis-error">${escapeHtml(analysis.message ?? '分析失败')}</div>`;
        } else if (analysis.mode === 'timeline' && Array.isArray(analysis.events) && analysis.events.length > 0) {
          analysisHtml = `
            <div class="video-analysis-timeline">
              <strong>时间线事件 (${analysis.events.length} 个)</strong>
              ${analysis.events.map(
                (ev: { start_sec?: number; end_sec?: number; title?: string; summary?: string }) =>
                  `<div class="timeline-event">
                    <span class="timeline-time">[${ev.start_sec ?? 0}s - ${ev.end_sec ?? 0}s]</span>
                    <strong>${escapeHtml(String(ev.title ?? ''))}</strong>
                    <div class="timeline-summary">${escapeHtml(String(ev.summary ?? ''))}</div>
                  </div>`
              ).join('')}
            </div>
          `;
        } else if (analysis.text) {
          analysisHtml = `<div class="video-analysis-text"><strong>分析摘要</strong><pre>${escapeHtml(analysis.text)}</pre></div>`;
        } else {
          analysisHtml = `<div>${escapeHtml(analysis.message ?? '暂无分析内容')}</div>`;
        }
        resultEl.innerHTML = `
          <div class="video-analysis-success">
            <div><strong>视频信息</strong></div>
            <div>文件名: ${escapeHtml(data.video?.filename ?? '-')}</div>
            <div>大小: ${((data.video?.size ?? 0) / 1024 / 1024).toFixed(2)} MB</div>
            <div>上传时间: ${escapeHtml(data.video?.uploadedAt ?? '-')}</div>
            <hr />
            <div><strong>分析结果</strong> (${analysis.mode === 'timeline' ? '时间线' : '摘要'})</div>
            ${analysisHtml}
          </div>
        `;
      } else {
        resultEl.innerHTML = `<div class="video-analysis-error">${escapeHtml(data.error ?? '上传失败')}</div>`;
      }
    } catch (err) {
      resultEl.innerHTML = `<div class="video-analysis-error">${escapeHtml(err instanceof Error ? err.message : '请求失败')}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '上传并分析';
    }
  });
}

// ---------- Workspace ----------
type WorkspaceTemplate = 'concept' | 'quadrant';

function renderWorkspace() {
  const vb = pageConfig?.viewBox ?? { width: 1000, height: 550 };
  const cg = pageConfig?.conceptGraph;
  const qd = pageConfig?.quadrant;
  const amp = pageConfig?.wavyPathAmplitude ?? 55;
  let activeTemplate: WorkspaceTemplate = cg ? 'concept' : 'quadrant';

  // Concept graph HTML
  const concepts = cg?.concepts ?? [];
  const conceptOrder = cg?.conceptOrder ?? concepts.map((c) => c.id);
  const conceptMap = new Map(concepts.map((c) => [c.id, c]));
  const orderedConcepts = conceptOrder.map((id) => conceptMap.get(id)).filter(Boolean) as ConceptItem[];
  const dates = cg?.dates ?? [];

  const conceptGraphHtml =
    cg && concepts.length > 0
      ? `
    <div class="concept-graph" data-template="concept" style="display:${activeTemplate === 'concept' ? 'block' : 'none'}">
      <svg class="concept-lines-overlay" viewBox="0 0 ${vb.width} ${vb.height}" preserveAspectRatio="xMidYMid meet">
        ${(() => {
          const paths: string[] = [];
          for (let i = 0; i < orderedConcepts.length - 1; i++) {
            const a = orderedConcepts[i];
            const b = orderedConcepts[i + 1];
            if (!a || !b) continue;
            const mx = (a.x + b.x) / 2;
            const my = (a.y + b.y) / 2;
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const perpX = -dy;
            const perpY = dx;
            const len = Math.sqrt(perpX * perpX + perpY * perpY) || 1;
            const cx = mx + (perpX / len) * amp;
            const cy = my + (perpY / len) * amp;
            paths.push(`<path class="concept-solid" fill="none" stroke="#334155" stroke-width="2" d="M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}"/>`);
          }
          return paths.join('\n        ');
        })()}
      </svg>
      <div class="concept-cluster">
        ${concepts
          .map(
            (c) => `
          <div class="concept-node concept-label" data-concept-id="${c.id}" data-drag-text="${escapeHtml(c.label)}" style="left:${(c.x / vb.width) * 100}%;top:${(c.y / vb.height) * 100}%">${escapeHtml(c.label)}</div>
          ${(c.photos ?? [])
            .map((p, i) => {
              const angle = (i / Math.max((c.photos?.length ?? 1) - 1, 1)) * Math.PI * 0.6 - Math.PI * 0.3;
              const r = 90;
              const px = c.x + Math.cos(angle) * r;
              const py = c.y + Math.sin(angle) * r;
              const left = (px / vb.width) * 100;
              const top = (py / vb.height) * 100;
              const dragText = escapeHtml(p.title ?? c.label);
              if (p.src && p.src.trim()) {
                return `<img class="concept-photo-node" data-drag-text="${dragText}" src="${escapeHtml(p.src)}" alt="${escapeHtml(p.title ?? '')}" title="${escapeHtml(p.title ?? '')}" style="left:${left}%;top:${top}%" onerror="this.style.display='none';this.nextElementSibling?.classList.remove('photo-empty-hidden')" /><div class="concept-photo-node photo-empty-frame photo-empty-hidden" data-drag-text="${dragText}" style="left:${left}%;top:${top}%"></div>`;
              }
              return `<div class="concept-photo-node photo-empty-frame" data-drag-text="${dragText}" style="left:${left}%;top:${top}%"></div>`;
            })
            .join('')}
        `
          )
          .join('')}
        ${dates
          .map(
            (d) =>
              `<div class="concept-node concept-date-node" data-drag-text="${escapeHtml(d.label)}" style="left:${(d.x / vb.width) * 100}%;top:${(d.y / vb.height) * 100}%">${escapeHtml(d.label)}</div>`
          )
          .join('')}
      </div>
    </div>`
      : '';

  // Quadrant HTML
  const timeline = qd?.timeline ?? ['8:00', '12:00', '18:00'];
  const events = qd?.events ?? [];
  const aboveEvents = events.filter((e) => e.category === 'working');
  const belowEvents = events.filter((e) => e.category === 'resting');

  const quadrantHtml =
    qd && (timeline.length > 0 || events.length > 0)
      ? `
    <div class="canvas-quadrant" data-template="quadrant" style="display:${activeTemplate === 'quadrant' ? 'block' : 'none'}">
      <div class="quadrant-grid">
        <div class="quadrant-timeline">
          ${timeline.map((t) => `<span class="quadrant-time-capsule">${escapeHtml(t)}</span>`).join('')}
        </div>
        <div class="quadrant-axes">
          <div class="quadrant-y-labels">
            <span class="quadrant-y-label quadrant-y-above">working</span>
            <span class="quadrant-y-label quadrant-y-below">resting</span>
          </div>
          <div class="quadrant-content">
            <div class="quadrant-above">
              ${aboveEvents.map((e) => {
              const label = e.title ?? `${e.category} @ ${Math.round(e.time * 100)}%`;
              return `<div class="quadrant-event ${e.highlight ? 'highlight' : ''}" data-drag-text="${escapeHtml(label)}" style="left:${e.time * 100}%">${escapeHtml(e.title ?? '事件')}</div>`;
            }).join('')}
            </div>
            <div class="quadrant-below">
              ${belowEvents.map((e) => {
              const label = e.title ?? `${e.category} @ ${Math.round(e.time * 100)}%`;
              return `<div class="quadrant-event ${e.highlight ? 'highlight' : ''}" data-drag-text="${escapeHtml(label)}" style="left:${e.time * 100}%">${escapeHtml(e.title ?? '事件')}</div>`;
            }).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`
      : '';

  const hasConcept = conceptGraphHtml.length > 0;
  const hasQuadrant = quadrantHtml.length > 0;
  const fallbackHtml =
    !hasConcept && !hasQuadrant
      ? `<div class="canvas-area-wrap" style="padding:2rem;min-height:200px"><p style="color:#64748b">暂无概念图或象限配置，请检查 page-config.json</p></div>`
      : '';

  const timeSliderHtml =
    hasQuadrant && hasConcept
      ? `<div class="time-slider-wrap"><label>时间</label><input type="range" id="time-range" min="0" max="100" value="0" /><span class="time-range" id="time-range-label">0%</span></div>`
      : '';

  const controlsExtras =
    hasConcept && hasQuadrant
      ? `<label>模板</label><select id="template-select" class="canvas-template-select"><option value="concept" ${activeTemplate === 'concept' ? 'selected' : ''}>概念组织</option><option value="quadrant" ${activeTemplate === 'quadrant' ? 'selected' : ''}>象限</option></select>${timeSliderHtml}`
      : '';

  app.innerHTML = `
    <div class="toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" data-back-history>← History</button>
      </div>
      <div class="toolbar-right">
        <button class="toolbar-btn" data-open-chat>AI Chat</button>
        <button class="toolbar-btn" data-open-task>任务 Canvas</button>
        <span class="toolbar-user">${escapeHtml(currentUser?.email ?? '')}</span>
        <button class="toolbar-btn" data-logout>退出</button>
      </div>
    </div>
    <div class="canvas-workspace">
      <div class="canvas-controls">
        <span>Workspace</span>
        ${controlsExtras}
      </div>
      ${conceptGraphHtml}
      ${quadrantHtml}
      ${fallbackHtml}
    </div>
  `;

  // Template switcher (dropdown) + time range
  const templateSelect = app.querySelector('#template-select') as HTMLSelectElement | null;
  templateSelect?.addEventListener('change', () => {
    const t = templateSelect.value as WorkspaceTemplate;
    if (t !== 'concept' && t !== 'quadrant') return;
    activeTemplate = t;
    const cgEl = app.querySelector('[data-template="concept"]');
    const qdEl = app.querySelector('[data-template="quadrant"]');
    if (cgEl) (cgEl as HTMLElement).style.display = t === 'concept' ? 'block' : 'none';
    if (qdEl) (qdEl as HTMLElement).style.display = t === 'quadrant' ? 'block' : 'none';
    setupDraggables();
  });

  const timeRangeInput = app.querySelector('#time-range') as HTMLInputElement | null;
  const timeRangeLabel = app.querySelector('#time-range-label') as HTMLElement | null;
  timeRangeInput?.addEventListener('input', () => {
    const v = timeRangeInput.value;
    if (timeRangeLabel) timeRangeLabel.textContent = `${v}%`;
  });

  function setupDraggables() {
    const chatPopup = document.getElementById('popup-chat');
    const taskPopup = document.getElementById('popup-task');
    const chatInput = chatPopup?.querySelector('.chat-input') as HTMLTextAreaElement | undefined;
    const taskEditor = taskPopup?.querySelector('.task-editor') as HTMLTextAreaElement | undefined;
    app.querySelectorAll('[data-drag-text]').forEach((el) => {
      const text = (el as HTMLElement).dataset.dragText ?? '';
      el.setAttribute('draggable', 'true');
      el.addEventListener('dragstart', (e) => {
        (e as DragEvent).dataTransfer?.setData('text/plain', text);
        el.classList.add('dragging');
      });
      el.addEventListener('dragend', () => el.classList.remove('dragging'));
    });
    [chatPopup, taskPopup].filter((p): p is HTMLElement => p != null).forEach((popup) => {
      if ((popup as HTMLElement).dataset.dropHandlers === '1') return;
      (popup as HTMLElement).dataset.dropHandlers = '1';
      popup.addEventListener('dragover', (e) => {
        e.preventDefault();
        popup.classList.add('drop-zone-active');
      });
      popup.addEventListener('dragleave', () => popup.classList.remove('drop-zone-active'));
      popup.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        popup.classList.remove('drop-zone-active');
        const text = e.dataTransfer?.getData('text/plain') ?? '';
        if (popup === chatPopup && chatInput) {
          chatInput.value += (chatInput.value ? ' ' : '') + text;
          chatInput.focus();
        } else if (popup === taskPopup && taskEditor) {
          taskEditor.value += (taskEditor.value ? '\n' : '') + text;
          taskEditor.focus();
        }
      });
    });
  }

  function openChat() {
    let popup = document.getElementById('popup-chat');
    if (popup) {
      popup.style.display = 'flex';
      return;
    }
    popup = document.createElement('div');
    popup.id = 'popup-chat';
    popup.className = 'popup drop-zone-active';
    popup.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%);width:360px;height:420px;display:flex;flex-direction:column';
    popup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">AI Chat</span>
        <button class="popup-close" data-close-popup>×</button>
      </div>
      <div class="popup-body">
        <div class="chat-messages"><div class="chat-msg system">拖入内容可发送给 AI</div></div>
        <div class="chat-input-wrap">
          <textarea class="chat-input" rows="2" placeholder="输入消息..."></textarea>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector('[data-close-popup]')?.addEventListener('click', () => (popup!.style.display = 'none'));
    setupDraggables();
  }

  function openTask() {
    let popup = document.getElementById('popup-task');
    if (popup) {
      popup.style.display = 'flex';
      return;
    }
    popup = document.createElement('div');
    popup.id = 'popup-task';
    popup.className = 'popup drop-zone-active';
    popup.style.cssText = 'left:50%;top:50%;transform:translate(-50%,-50%);width:400px;height:360px;display:flex;flex-direction:column';
    popup.innerHTML = `
      <div class="popup-header">
        <span class="popup-title">任务 Canvas</span>
        <button class="popup-close" data-close-popup>×</button>
      </div>
      <div class="popup-body">
        <textarea class="task-editor" placeholder="拖入事件或关键词到这里..."></textarea>
      </div>
    `;
    document.body.appendChild(popup);
    popup.querySelector('[data-close-popup]')?.addEventListener('click', () => (popup!.style.display = 'none'));
    setupDraggables();
  }

  app.querySelector('[data-back-history]')?.addEventListener('click', () => renderMemoryLibHistory());
  app.querySelector('[data-open-chat]')?.addEventListener('click', openChat);
  app.querySelector('[data-open-task]')?.addEventListener('click', openTask);
  app.querySelector('[data-logout]')?.addEventListener('click', () => {
    authApi.logout();
    currentUser = null;
    renderLoginScreen();
  });

  if (hasConcept || hasQuadrant) {
    setTimeout(setupDraggables, 0);
  }
}

init();
