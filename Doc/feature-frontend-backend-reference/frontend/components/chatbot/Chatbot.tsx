import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, X, Minimize2, Bot, Clock, Sparkles } from 'lucide-react';
import { useChatStore } from '../../stores/chatStore';
import { useEventStore } from '../../stores/eventStore';
import type { EventExtended } from '../../types/event';

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [attachedEvents, setAttachedEvents] = useState<EventExtended[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentSessionId = useChatStore((state) => state.currentSessionId);
  const sessions = useChatStore((state) => state.sessions);
  const isTyping = useChatStore((state) => state.isTyping);
  const sendMessage = useChatStore((state) => state.sendMessage);
  const createSession = useChatStore((state) => state.createSession);

  const events = useEventStore((state) => state.events);

  const currentSession = sessions.find((s) => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const eventData = e.dataTransfer.getData('eventData');
    const eventId = e.dataTransfer.getData('eventId');
    if (eventData) {
      try {
        const event = JSON.parse(eventData) as EventExtended;
        if (!attachedEvents.find((ev) => ev.id === event.id)) {
          setAttachedEvents((prev) => [...prev, event]);
        }
      } catch (err) {
        console.error('Failed to parse dropped event:', err);
      }
    } else if (eventId) {
      const event = events.find((ev) => ev.id === eventId);
      if (event && !attachedEvents.find((ev) => ev.id === event.id)) {
        setAttachedEvents((prev) => [...prev, event]);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const removeAttachedEvent = (eventId: string) => {
    setAttachedEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleSend = async () => {
    if (!inputValue.trim() && attachedEvents.length === 0) return;
    await sendMessage(inputValue, attachedEvents.map((e) => e.id), attachedEvents);
    setInputValue('');
    setAttachedEvents([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    createSession();
    setInputValue('');
    setAttachedEvents([]);
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center text-white z-50"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1, height: isMinimized ? 'auto' : '600px' }}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className="fixed bottom-6 right-6 w-96 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-50"
    >
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Memory Assistant</h3>
            <p className="text-xs text-white/70">AI-powered memory helper</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handleNewChat} className="p-2 hover:bg-white/10 rounded-lg" title="New Chat">
            <Sparkles className="w-4 h-4" />
          </button>
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-lg">
            {isMinimized ? <Minimize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 dark:text-zinc-400">
                <Bot className="w-12 h-12 mb-4 opacity-30" />
                <p className="text-sm font-medium mb-2">Start a conversation</p>
                <p className="text-xs max-w-[200px]">Drag events here or type a message. I can help you summarize, search, and organize your memories.</p>
              </div>
            ) : (
              messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user' ? 'bg-blue-500 text-white rounded-br-md' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-bl-md'
                    }`}
                  >
                    {message.attachedEventIds && message.attachedEventIds.length > 0 && (
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {message.attachedEventIds.map((id) => {
                          const event = events.find((e) => e.id === id);
                          return event ? (
                            <span key={id} className={`text-xs px-2 py-0.5 rounded-full ${message.role === 'user' ? 'bg-white/20 text-white' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                              {event.userTitle || event.title}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    <div className={`text-sm whitespace-pre-wrap ${message.role === 'user' ? 'text-white' : 'text-zinc-700 dark:text-zinc-200'}`}>
                      <MarkdownContent content={message.content} />
                    </div>
                    <div className={`text-xs mt-2 flex items-center gap-1 ${message.role === 'user' ? 'text-white/60' : 'text-zinc-400'}`}>
                      <Clock className="w-3 h-3" />
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
                <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-zinc-400">Thinking...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {attachedEvents.length > 0 && (
            <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-2">Attached events:</p>
              <div className="flex flex-wrap gap-2">
                {attachedEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1 text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 truncate max-w-[120px]">{event.userTitle || event.title}</span>
                    <button onClick={() => removeAttachedEvent(event.id)} className="text-zinc-400 hover:text-red-500">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message or drag events here..."
                rows={1}
                className="flex-1 bg-zinc-100 dark:bg-zinc-800 border border-transparent focus:border-blue-500/50 rounded-xl px-4 py-3 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 min-h-[44px] max-h-[120px]"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim() && attachedEvents.length === 0}
                className="w-11 h-11 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-300 dark:disabled:bg-zinc-700 text-white rounded-xl flex items-center justify-center disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-zinc-400 mt-2">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </>
      )}
    </motion.div>
  );
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="font-bold text-base mt-2 mb-1">{line.slice(3)}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="font-semibold text-sm mt-2 mb-1">{line.slice(4)}</h4>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.slice(2, -2)}</p>;
        if (line.startsWith('- ')) return <p key={i} className="pl-2">鈥?{renderBoldText(line.slice(2))}</p>;
        const m = line.match(/^(\d+)\.\s/);
        if (m) return <p key={i} className="pl-2">{m[1]}. {renderBoldText(line.slice(m[0].length))}</p>;
        if (line === '') return <br key={i} />;
        return <p key={i}>{renderBoldText(line)}</p>;
      })}
    </>
  );
}

function renderBoldText(text: string): React.ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}
