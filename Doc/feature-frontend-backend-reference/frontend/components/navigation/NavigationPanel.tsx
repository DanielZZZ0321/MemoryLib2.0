import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  LayoutTemplate,
  FolderOpen,
  Rocket,
  PenTool,
  Box,
  MessageSquare,
  LogIn,
  ChevronRight,
  Search,
} from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'page' | 'component';
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'app',
    label: 'App View',
    description: '浜嬩欢鍒楄〃瑙嗗浘锛屾暟鎹祻瑙堝拰缂栬緫',
    icon: LayoutTemplate,
    category: 'page',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: '椤圭洰绠＄悊鐣岄潰锛屽垱寤哄拰绠＄悊璁板繂椤圭洰',
    icon: FolderOpen,
    category: 'page',
  },
  {
    id: 'coldstart',
    label: 'Cold Start',
    description: '鍐峰惎鍔ㄩ厤缃悜瀵硷紝鍒濆鍖栨暟鎹瓫閫?,
    icon: Rocket,
    category: 'page',
  },
  {
    id: 'canvas',
    label: 'Canvas',
    description: '鐢诲竷缂栬緫鍣紝鍒涘缓澶氭ā鎬佹棩璁?,
    icon: PenTool,
    category: 'page',
  },
  {
    id: 'showcase',
    label: 'Components',
    description: '缁勪欢灞曠ず搴擄紝鏌ョ湅鎵€鏈?UI 缁勪欢',
    icon: Box,
    category: 'page',
  },
  {
    id: 'login',
    label: 'Login Page',
    description: '鐢ㄦ埛鐧诲綍椤甸潰',
    icon: LogIn,
    category: 'component',
  },
  {
    id: 'chatbot',
    label: 'Chatbot',
    description: 'AI 鑱婂ぉ鍔╂墜锛堟诞鍔ㄩ潰鏉匡級',
    icon: MessageSquare,
    category: 'component',
  },
];

interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (id: string) => void;
}

export function NavigationPanel({ isOpen, onClose, activeTab, onNavigate }: NavigationPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredItems = NAV_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredItems.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredItems[selectedIndex]) {
            handleNavigate(filteredItems[selectedIndex].id);
          }
          break;
        case 'Escape':
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleNavigate = (id: string) => {
    onNavigate(id);
    onClose();
    setSearchQuery('');
  };

  const pages = filteredItems.filter((item) => item.category === 'page');
  const components = filteredItems.filter((item) => item.category === 'component');

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 z-50 overflow-hidden"
          >
            {/* Search Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="鎼滅储椤甸潰鎴栫粍浠?.."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-12 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-transparent rounded-xl text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  onClick={onClose}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg text-zinc-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {/* Pages Section */}
              {pages.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 px-2">
                    椤甸潰
                  </h3>
                  <div className="space-y-1">
                    {pages.map((item, index) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleNavigate(item.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          } ${isActive ? 'ring-1 ring-blue-500/30' : ''}`}
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isActive
                                ? 'bg-blue-500 text-white'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {item.label}
                              </span>
                              {isActive && (
                                <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded-full">
                                  褰撳墠
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Components Section */}
              {components.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 px-2">
                    缁勪欢
                  </h3>
                  <div className="space-y-1">
                    {components.map((item) => {
                      const globalIndex = filteredItems.indexOf(item);
                      const Icon = item.icon;

                      return (
                        <motion.button
                          key={item.id}
                          whileHover={{ x: 4 }}
                          onClick={() => handleNavigate(item.id)}
                          className={`w-full flex items-center gap-4 p-3 rounded-xl text-left transition-colors ${
                            globalIndex === selectedIndex
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                              {item.label}
                            </span>
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
                              {item.description}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-zinc-300 dark:text-zinc-600" />
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>鏈壘鍒板尮閰嶇殑椤甸潰鎴栫粍浠?/p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-center gap-6 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">鈫?/kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">鈫?/kbd>
                  瀵艰埅
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">Enter</kbd>
                  閫夋嫨
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">Esc</kbd>
                  鍏抽棴
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Navigation Trigger Button
interface NavTriggerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}

export function NavTriggerButton({ onClick, isOpen }: NavTriggerButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
        isOpen
          ? 'bg-blue-500 text-white'
          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300'
      }`}
    >
      <LayoutTemplate className="w-4 h-4" />
      <span>瀵艰埅</span>
      <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-zinc-200/50 dark:bg-zinc-700/50 rounded">
        Ctrl+Shift+X
      </kbd>
    </motion.button>
  );
}
