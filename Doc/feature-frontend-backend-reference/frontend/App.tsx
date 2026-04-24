/**
 * App - Login + MemoryLib History + Concept Graph
 */
import { useState, useEffect } from 'react';
import * as authApi from './auth';
import { usePageContextStore } from './stores/pageContextStore';
import { ConceptGraphView } from './components/ConceptGraphView';
import { ChatbotPanel } from './components/chatbot/ChatbotPanel';

// --- Page Config Types ---
interface PageConfig {
  version?: string;
  title?: string;
  memoryLibs?: Array<{ id: string; title: string; dateRange: string; tags: string[]; color: string; year: number; sourceFile?: string }>;
}

// --- MemoryLib Entry ---
interface MemoryLibEntry {
  id: string;
  title: string;
  dateRange: string;
  tags: string[];
  color: 'blue' | 'yellow' | 'green' | 'purple' | 'red';
  year: number;
  sourceFile?: string;
}

const SAMPLE_MEMORYLIBS: MemoryLibEntry[] = [
  { id: '1', title: "My Last Week's Diary", dateRange: '2.13-2.16', tags: ['People', 'Emotion'], color: 'blue', year: 2026, sourceFile: '/data/memorylibs/1.json' },
  { id: '2', title: 'Logic of event occurrence', dateRange: '9.13-9.16', tags: ['Event', 'Time'], color: 'yellow', year: 2026, sourceFile: '/data/memorylibs/2.json' },
  { id: '3', title: 'N/A', dateRange: '10.18-10.19', tags: ['Emotion', 'Workflow'], color: 'green', year: 2026 },
  { id: '4', title: 'Daily Reflection', dateRange: '1.14-2.12', tags: ['Color', 'Event'], color: 'purple', year: 2025 },
  { id: '5', title: 'Decision Making', dateRange: '3.23-3.27', tags: ['Event', 'Emotion'], color: 'red', year: 2025 },
  { id: '6', title: '6-Node Layout Demo', dateRange: '3.16', tags: ['People', 'Emotion', 'Event', 'Time', 'Workflow', 'Decision'], color: 'purple', year: 2026, sourceFile: '/data/memorylibs/6.json' },
];

function escapeHtml(s: string): string {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

// --- Auth Screen ---
function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirmPassword) {
      setError('涓ゆ瀵嗙爜杈撳叆涓嶄竴鑷?);
      return;
    }
    try {
      setLoading(true);
      mode === 'login'
        ? await authApi.login(email, password)
        : await authApi.register(email, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : '鎿嶄綔澶辫触');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h1 className="auth-title">Workspace</h1>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            鐧诲綍
          </button>
          <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            娉ㄥ唽
          </button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>閭</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <div className="auth-field">
            <label>瀵嗙爜</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="鑷冲皯 6 浣? required minLength={6} />
          </div>
          {mode === 'register' && (
            <div className="auth-field">
              <label>纭瀵嗙爜</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="鍐嶆杈撳叆瀵嗙爜" />
            </div>
          )}
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="auth-submit" disabled={loading}>
            {loading ? '澶勭悊涓?..' : mode === 'login' ? '鐧诲綍' : '娉ㄥ唽'}
          </button>
        </form>
      </div>
    </div>
  );
}

// --- MemoryLib History ---
function MemoryLibHistory({
  userEmail,
  pageConfig,
  onCardClick,
  onLogout,
  onOpenChat,
}: {
  userEmail: string;
  pageConfig: PageConfig | null;
  onCardClick: (entry: MemoryLibEntry) => void;
  onLogout: () => void;
  onOpenChat: () => void;
}) {
  const setContext = usePageContextStore((s) => s.setContext);
  useEffect(() => {
    setContext({ pageType: 'history' });
    return () => setContext(null);
  }, [setContext]);

  const entries: MemoryLibEntry[] =
    pageConfig?.memoryLibs?.map((m) => ({
      id: m.id,
      title: m.title,
      dateRange: m.dateRange,
      tags: m.tags ?? [],
      color: (m.color as MemoryLibEntry['color']) || 'blue',
      year: m.year,
      sourceFile: m.sourceFile,
    })) ?? SAMPLE_MEMORYLIBS;
  const years = [...new Set(entries.map((e) => e.year))].sort((a, b) => b - a);

  return (
    <div className="memorylib-page">
      <div className="memorylib-header">
        <h1 className="memorylib-title">
          MemoryLib <span className="underline">History</span>
        </h1>
        <div className="memorylib-nav">
          <span className="toolbar-user" style={{ color: '#64748b' }}>
            {userEmail}
          </span>
          <button
            type="button"
            className="toolbar-btn flex items-center gap-2"
            onClick={onOpenChat}
            title="鎵撳紑鑱婂ぉ鍔╂墜"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            鑱婂ぉ
          </button>
          <button className="toolbar-btn" onClick={onLogout}>
            閫€鍑?          </button>
        </div>
      </div>
      {years.map((year) => (
        <div key={year}>
          <h2 className="memorylib-year">{year}</h2>
          <div className="memorylib-cards">
            {entries
              .filter((e) => e.year === year)
              .map((e) => (
                <div key={e.id} className={`memorylib-card mlb-${e.color}`} onClick={() => onCardClick(e)} style={{ cursor: 'pointer' }}>
                  <span className={`memorylib-date-ribbon mlb-${e.color}`}>{escapeHtml(e.dateRange)}</span>
                  <div className="memorylib-card-title">{escapeHtml(e.title)}</div>
                  <div className="memorylib-tags">
                    {e.tags.map((t) => (
                      <span key={t} className={`memorylib-tag mlb-${e.color}`}>
                        {escapeHtml(t)}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            {year === years[0] && (
              <button className="memorylib-new-btn" onClick={() => onCardClick({ id: 'new', title: 'New MemoryLib', dateRange: '', tags: [], color: 'blue', year })}>
                <span>New MemoryLib</span>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main App ---
export default function App() {
  const [user, setUser] = useState<{ id: number; email: string } | null>(null);
  const [pageConfig, setPageConfig] = useState<PageConfig | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<MemoryLibEntry | null>(null);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  useEffect(() => {
    authApi.getMe().then((u) => {
      setUser(u);
      if (u) {
        fetch('/api/page-config')
          .then((r) => (r.ok ? r.json() : null))
          .then((d) => setPageConfig(d as PageConfig | null));
      }
    });
  }, []);

  const handleLogout = () => {
    authApi.logout();
    setUser(null);
  };

  if (!user) {
    return (
      <AuthScreen
        onLogin={async () => {
          const u = await authApi.getMe();
          setUser(u);
          if (u) {
            const r = await fetch('/api/page-config');
            if (r.ok) setPageConfig((await r.json()) as PageConfig | null);
          }
        }}
      />
    );
  }

  if (selectedEntry) {
    return (
      <>
        <ConceptGraphView
          entry={selectedEntry}
          onBack={() => setSelectedEntry(null)}
          onOpenChat={() => setChatbotOpen(true)}
        />
        <ChatbotPanel open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
      </>
    );
  }

  return (
    <>
      <MemoryLibHistory
        userEmail={user.email}
        pageConfig={pageConfig}
        onCardClick={setSelectedEntry}
        onLogout={handleLogout}
        onOpenChat={() => setChatbotOpen(true)}
      />
      <ChatbotPanel open={chatbotOpen} onClose={() => setChatbotOpen(false)} />
    </>
  );
}
