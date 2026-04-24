/**
 * ChatbotPanel - Slide-in chat panel opened from panel button
 * Uses chatStore, no eventStore dependency
 */
import { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, X, Bot, Sparkles } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { usePageContextStore } from '../../stores/pageContextStore';

interface ChatbotPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ChatbotPanel({ open, onClose }: ChatbotPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [memoryCoreRag, setMemoryCoreRag] = useState(() => {
    try {
      return localStorage.getItem('memoryCoreRag') === '1';
    } catch {
      return false;
    }
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sendBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentSessionId = useChatStore((s) => s.currentSessionId);
  const sessions = useChatStore((s) => s.sessions);
  const isTyping = useChatStore((s) => s.isTyping);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const createSession = useChatStore((s) => s.createSession);
  const loadSessions = useChatStore((s) => s.loadSessions);
  const pageContext = usePageContextStore((s) => s.context);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages ?? [];

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendRef = useRef<(e?: React.FormEvent) => void>(() => {});
  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputValue.trim();
    if (!text || isTyping) return;
    setInputValue(''); // 绔嬪嵆娓呯┖锛岀粰鐢ㄦ埛鍗虫椂鍙嶉
    sendMessage(text, [], [], pageContext ?? undefined).catch(() => {
      setInputValue(text); // 澶辫触鏃舵仮澶嶈緭鍏?    });
  };
  handleSendRef.current = handleSend;

  // 鍘熺敓 DOM 鐐瑰嚮鐩戝惉锛岀粫杩?React 浜嬩欢绯荤粺锛屾彁楂樺彂閫佹寜閽彲闈犳€?  useEffect(() => {
    const btn = sendBtnRef.current;
    if (!btn) return;
    const handler = () => {
      handleSendRef.current();
    };
    btn.addEventListener('click', handler);
    return () => btn.removeEventListener('click', handler);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl+Enter 蹇呭畾鍙戦€侊紝涓嶅彈杈撳叆娉曞奖鍝?    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleSend();
      return;
    }
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createSession();
    setInputValue('');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop - 鍙鐩栭潰鏉垮乏渚э紝閬垮厤閬綇闈㈡澘瀵艰嚧鐐瑰嚮澶辨晥 */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        aria-hidden="true"
        style={{ right: 'min(28rem, 100%)' }}
      >
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Panel - 浣跨敤鏋侀珮 z-index 纭繚鍦ㄦ墍鏈夊厓绱犱箣涓婏紝閬垮厤琚?header/popup 閬尅 */}
      <div
        className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-[#0f172a] border-l border-slate-700/50 shadow-2xl flex flex-col"
        style={{ zIndex: 9999 }}
        role="dialog"
        aria-label="Chatbot"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #1e293b 100%)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-600/50 flex items-center justify-center">
              <Bot className="w-5 h-5 text-slate-200" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-100">Memory Assistant</h2>
              <p className="text-xs text-slate-400">AI 璁板繂鍔╂墜</p>
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={memoryCoreRag}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setMemoryCoreRag(on);
                    try {
                      localStorage.setItem('memoryCoreRag', on ? '1' : '0');
                    } catch {
                      /* ignore */
                    }
                  }}
                  className="rounded border-slate-500"
                />
                Memory Core RAG
              </label>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleNewChat}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="鏂板璇?
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              title="鍏抽棴"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-sm font-medium text-slate-300 mb-2">寮€濮嬪璇?/p>
              <p className="text-xs max-w-[220px]">
                杈撳叆娑堟伅鍗冲彲寮€濮嬨€傛垜鍙互甯綘鎬荤粨銆佹悳绱㈠拰缁勭粐璁板繂銆?              </p>
              <p className="text-xs mt-4 text-slate-500">璇曡瘯锛氥€屼綘濂姐€嶆垨銆屽府鍔┿€?/p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-slate-700/80 text-slate-200 border border-slate-600/50 rounded-bl-md'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  <div
                    className={`text-xs mt-2 ${
                      msg.role === 'user' ? 'text-blue-200' : 'text-slate-500'
                    }`}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-700/80 border border-slate-600/50 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400">鎬濊€冧腑...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input - 浣跨敤 form 鎻愪氦锛屾寜閽悓鏃剁粦瀹?onClick 鍜?onMouseDown 鎻愰珮瑙﹀彂鐜?*/}
        <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(e);
            }}
            className="flex gap-2"
          >
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="杈撳叆娑堟伅..."
              rows={1}
              className="flex-1 resize-none rounded-xl px-4 py-3 text-sm bg-slate-800 text-slate-100 placeholder-slate-500 border border-slate-600/50 focus:border-blue-500/50 focus:outline-none min-h-[44px] max-h-[120px]"
            />
            <button
              ref={sendBtnRef}
              type="button"
              onClick={() => handleSend()}
              className={`min-w-[80px] px-4 h-11 flex-shrink-0 rounded-xl flex items-center justify-center gap-2 transition-colors shrink-0 select-none ${
                inputValue.trim() && !isTyping
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Send className="w-5 h-5" />
              <span>鍙戦€?/span>
            </button>
          </form>
          {/* 澶囩敤鍙戦€佸尯鍩燂細鏁磋鍙偣鍑伙紝瑙ｅ喅閮ㄥ垎鐜鐐瑰嚮鎸夐挳鏃犲弽搴?*/}
          <div
            role="button"
            tabIndex={0}
            className="mt-2 py-2 text-center text-sm text-blue-400 hover:text-blue-300 cursor-pointer"
            onClick={() => handleSend()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSend()}
          >
            鐐瑰嚮姝ゅ鍙戦€?          </div>
          <p className="text-xs text-slate-500 mt-2">Enter 鎴?Ctrl+Enter 鍙戦€侊紝Shift+Enter 鎹㈣</p>
        </div>
      </div>
    </>
  );
}
