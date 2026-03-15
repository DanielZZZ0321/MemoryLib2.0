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
    description: '事件列表视图，数据浏览和编辑',
    icon: LayoutTemplate,
    category: 'page',
  },
  {
    id: 'projects',
    label: 'Projects',
    description: '项目管理界面，创建和管理记忆项目',
    icon: FolderOpen,
    category: 'page',
  },
  {
    id: 'coldstart',
    label: 'Cold Start',
    description: '冷启动配置向导，初始化数据筛选',
    icon: Rocket,
    category: 'page',
  },
  {
    id: 'canvas',
    label: 'Canvas',
    description: '画布编辑器，创建多模态日记',
    icon: PenTool,
    category: 'page',
  },
  {
    id: 'showcase',
    label: 'Components',
    description: '组件展示库，查看所有 UI 组件',
    icon: Box,
    category: 'page',
  },
  {
    id: 'login',
    label: 'Login Page',
    description: '用户登录页面',
    icon: LogIn,
    category: 'component',
  },
  {
    id: 'chatbot',
    label: 'Chatbot',
    description: 'AI 聊天助手（浮动面板）',
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
                  placeholder="搜索页面或组件..."
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
                    页面
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
                                  当前
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
                    组件
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
                  <p>未找到匹配的页面或组件</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
              <div className="flex items-center justify-center gap-6 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">↓</kbd>
                  导航
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">Enter</kbd>
                  选择
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">Esc</kbd>
                  关闭
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
      <span>导航</span>
      <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] bg-zinc-200/50 dark:bg-zinc-700/50 rounded">
        Ctrl+Shift+X
      </kbd>
    </motion.button>
  );
}