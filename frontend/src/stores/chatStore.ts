import { create } from 'zustand';
import type { ChatMessage, ChatSession, EventExtended } from '../types/event';

interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  isTyping: boolean;

  // Actions
  createSession: (projectId?: string) => ChatSession;
  setCurrentSession: (id: string | null) => void;
  addMessage: (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  deleteSession: (id: string) => void;
  clearCurrentSession: () => void;

  // AI Actions (mock for now, can be replaced with actual API)
  sendMessage: (content: string, attachedEventIds?: string[], events?: EventExtended[]) => Promise<void>;
}

// Mock AI responses for event summarization
const generateAIResponse = async (
  userMessage: string,
  attachedEvents?: EventExtended[]
): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

  const lowerMessage = userMessage.toLowerCase();

  // If events are attached, summarize them
  if (attachedEvents && attachedEvents.length > 0) {
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary') || lowerMessage.includes('总结')) {
      const eventSummaries = attachedEvents.map((e) => {
        const title = e.userTitle || e.title;
        const summary = e.userSummary || e.summary;
        return `**${title}** (${e.startHms} - ${e.endHms}): ${summary}`;
      });

      if (attachedEvents.length === 1) {
        const event = attachedEvents[0];
        const title = event.userTitle || event.title;
        const summary = event.userSummary || event.summary;
        const duration = event.endSec - event.startSec;
        const minutes = Math.floor(duration / 60);
        const seconds = duration % 60;

        return `## Event Summary: ${title}\n\n` +
          `**Duration:** ${minutes}m ${seconds}s (${event.startHms} - ${event.endHms})\n\n` +
          `**Description:** ${summary}\n\n` +
          `${event.tags.length > 0 ? `**Tags:** ${event.tags.join(', ')}\n\n` : ''}` +
          `${event.notes ? `**Notes:** ${event.notes}` : ''}`;
      }

      return `## Summary of ${attachedEvents.length} Events\n\n` +
        `Total duration: ${formatTotalDuration(attachedEvents)}\n\n` +
        `### Events:\n${eventSummaries.map((s, i) => `${i + 1}. ${s}`).join('\n\n')}`;
    }

    if (lowerMessage.includes('common') || lowerMessage.includes('pattern') || lowerMessage.includes('共同') || lowerMessage.includes('模式')) {
      // Find common tags
      const allTags = attachedEvents.flatMap((e) => e.tags);
      const tagCounts = allTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const commonTags = Object.entries(tagCounts)
        .filter(([, count]) => count > 1)
        .sort((a, b) => b[1] - a[1]);

      // Calculate total time
      const totalDuration = attachedEvents.reduce((sum, e) => sum + (e.endSec - e.startSec), 0);

      let response = `## Analysis of ${attachedEvents.length} Events\n\n`;
      response += `**Total Time:** ${formatTotalDuration(attachedEvents)}\n\n`;

      if (commonTags.length > 0) {
        response += `**Common Themes:**\n`;
        commonTags.forEach(([tag, count]) => {
          response += `- ${tag} (${count} events)\n`;
        });
        response += '\n';
      }

      // Time distribution
      const avgDuration = totalDuration / attachedEvents.length;
      response += `**Average Event Duration:** ${Math.floor(avgDuration / 60)}m ${Math.floor(avgDuration % 60)}s\n`;

      return response;
    }

    // Default response for events
    return `I see you've shared ${attachedEvents.length} event${attachedEvents.length > 1 ? 's' : ''} with me. ` +
      `I can help you:\n\n` +
      `- **Summarize** these events\n` +
      `- Find **patterns** or **common themes**\n` +
      `- Help create a **diary entry** based on them\n` +
      `- Answer questions about specific details\n\n` +
      `What would you like to know?`;
  }

  // General responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('你好')) {
    return "Hello! I'm your MemoryLib assistant. I can help you organize, search, and understand your memories. Try dragging events here or asking me to summarize your activities!";
  }

  if (lowerMessage.includes('help') || lowerMessage.includes('帮助')) {
    return `## How I Can Help\n\n` +
      `I'm your memory assistant! Here's what I can do:\n\n` +
      `1. **Event Summarization** - Drag events here and ask me to summarize them\n` +
      `2. **Pattern Recognition** - Find common themes across multiple events\n` +
      `3. **Search** - Find specific events by keyword, time, or tag\n` +
      `4. **Diary Assistance** - Help you create diary entries from your memories\n\n` +
      `Try dragging an event card here to get started!`;
  }

  return "I understand you're asking about your memories. Try dragging some events from the panel to give me context, or ask me to help you search through your memory database!";
};

const formatTotalDuration = (events: EventExtended[]): string => {
  const totalSeconds = events.reduce((sum, e) => sum + (e.endSec - e.startSec), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
};

class ChatDB {
  private dbName = 'MemoryLibChat';
  private storeName = 'sessions';
  private db: IDBDatabase | null = null;

  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async getAll(): Promise<ChatSession[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async put(session: ChatSession): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(session);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(id: string): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(this.storeName, 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

const chatDB = new ChatDB();

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  isTyping: false,

  createSession: (projectId) => {
    const session: ChatSession = {
      id: crypto.randomUUID(),
      projectId: projectId || null,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
    }));

    chatDB.put(session);
    return session;
  },

  setCurrentSession: (id) => {
    set({ currentSessionId: id });
  },

  addMessage: async (sessionId, message) => {
    const fullMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };

    set((state) => {
      const sessions = state.sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, fullMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });

      chatDB.put(sessions.find((s) => s.id === sessionId)!);

      return { sessions };
    });
  },

  deleteSession: async (id) => {
    await chatDB.delete(id);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== id),
      currentSessionId: state.currentSessionId === id ? null : state.currentSessionId,
    }));
  },

  clearCurrentSession: () => {
    const { currentSessionId, sessions } = get();
    if (!currentSessionId) return;

    set((state) => {
      const updatedSessions = state.sessions.map((s) => {
        if (s.id === currentSessionId) {
          return { ...s, messages: [], updatedAt: new Date().toISOString() };
        }
        return s;
      });

      chatDB.put(updatedSessions.find((s) => s.id === currentSessionId)!);

      return { sessions: updatedSessions };
    });
  },

  sendMessage: async (content, attachedEventIds = [], events = []) => {
    const { currentSessionId, addMessage } = get();

    let sessionId = currentSessionId;
    if (!sessionId) {
      const session = get().createSession();
      sessionId = session.id;
    }

    // Add user message
    await addMessage(sessionId, {
      role: 'user',
      content,
      attachedEventIds,
    });

    // Generate AI response
    set({ isTyping: true });

    try {
      const aiResponse = await generateAIResponse(content, events);

      await addMessage(sessionId, {
        role: 'assistant',
        content: aiResponse,
      });
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      await addMessage(sessionId, {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
      });
    } finally {
      set({ isTyping: false });
    }
  },

  loadSessions: async () => {
    set({ isLoading: true });
    try {
      const sessions = await chatDB.getAll();
      sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      set({ sessions, isLoading: false });
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
      set({ isLoading: false });
    }
  },
}));