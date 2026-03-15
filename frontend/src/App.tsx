import { useRef, useState, useEffect } from 'react';
import { Activity, Download, Settings, Upload, Trash2, LayoutTemplate, Box, Rocket, PenTool, FolderOpen } from 'lucide-react';
import { EventList } from './components/events/EventList';
import { FilterToolbar } from './components/layout/FilterToolbar';
import { MemoryNode } from './components/events/MemoryNode';
import { TimelineCoordinateView } from './components/layout/TimelineCoordinateView';
import { ProjectHistoryList } from './components/layout/ProjectHistoryList';
import { MemoryReflectionAction } from './components/ui/MemoryReflectionAction';
import { EventEditor } from './components/events/EventEditor';
import { ColdStart } from './components/layout/ColdStart';
import { DiaryCanvas } from './components/canvas';
import { Chatbot } from './components/chatbot';
import { ProjectManagement } from './components/projects';
import { NavigationPanel, NavTriggerButton } from './components/navigation';
import { useEventStore } from './stores/eventStore';
import { useUIStore } from './stores/uiStore';
import { ModeToggle } from './components/ui/mode-toggle';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import type { User } from './types/global';

function App() {
  const events = useEventStore(state => state.events);
  const exportData = useEventStore(state => state.exportData);
  const importTimeline = useEventStore(state => state.importTimeline);
  const clearEvents = useEventStore(state => state.clearEvents);
  const loadEvents = useEventStore(state => state.loadEvents);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth state from UI store
  const isAuthenticated = useUIStore(state => state.isAuthenticated);
  const coldStartCompleted = useUIStore(state => state.coldStartCompleted);
  const login = useUIStore(state => state.login);
  const logout = useUIStore(state => state.logout);
  const completeColdStart = useUIStore(state => state.completeColdStart);

  const [activeTab, setActiveTab] = useState<'main' | 'app' | 'showcase' | 'coldstart' | 'canvas' | 'projects'>('main');
  const [isNavOpen, setIsNavOpen] = useState(false);

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Keyboard shortcut for navigation panel (Ctrl + Shift + X)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        setIsNavOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle navigation from panel
  const handleNavigate = (id: string) => {
    if (id === 'login') {
      // Already logged in, just show the page
      setActiveTab('app');
    } else if (id === 'chatbot') {
      // Chatbot is always visible, just go to main
      setActiveTab('main');
    } else {
      setActiveTab(id as any);
    }
  };

  // Handle login
  const handleLogin = (loggedInUser: User) => {
    login(loggedInUser);
  };

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          await importTimeline(json, file.name);
        } else {
          alert('Invalid JSON format.');
        }
      } catch (err) {
        console.error('Failed to parse JSON', err);
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <NavigationPanel
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          activeTab="login"
          onNavigate={() => {
            // Already on login, just close
            setIsNavOpen(false);
          }}
        />
        <LoginPage onLogin={handleLogin} />
      </>
    );
  }

  // Show cold start wizard if not completed
  if (!coldStartCompleted && activeTab === 'main') {
    return (
      <>
        <NavigationPanel
          isOpen={isNavOpen}
          onClose={() => setIsNavOpen(false)}
          activeTab="coldstart"
          onNavigate={(id) => {
            if (id === 'app' || id === 'projects' || id === 'canvas' || id === 'showcase') {
              // Skip coldstart and go directly to page
              completeColdStart({
                startTime: null,
                endTime: null,
                granularity: 'daily',
                purpose: 'review',
                primaryIndex: 'time',
              });
              setActiveTab(id as any);
            }
            setIsNavOpen(false);
          }}
        />
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300">
          <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
            <div className="px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <h1 className="text-lg font-semibold tracking-tight">MemoryLib Setup</h1>
                </div>
                <NavTriggerButton onClick={() => setIsNavOpen(true)} isOpen={isNavOpen} />
              </div>
              <div className="flex items-center gap-4">
                <ModeToggle />
                <button
                  onClick={handleLogout}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-x-hidden">
            <ColdStart onComplete={(config) => {
              completeColdStart({
                startTime: config.startTime,
                endTime: config.endTime,
                granularity: config.granularity === 'day' ? 'daily' : config.granularity === 'week' ? 'weekly' : 'monthly',
                purpose: config.purpose === 'review' ? 'review' : config.purpose === 'diary' ? 'diary' : config.purpose === 'slides' ? 'project' : 'reflection',
                primaryIndex: config.primaryIndex as any || 'time',
                secondaryIndex: config.secondaryIndex as any,
              });
            }} />
          </main>
        </div>
      </>
    );
  }

  // Main layout view
  if (activeTab === 'main') {
    return <MainLayout onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col font-sans transition-colors duration-300">
      {/* Navigation Panel */}
      <NavigationPanel
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
        activeTab={activeTab}
        onNavigate={handleNavigate}
      />

      {/* Header */}
      <header className="sticky top-0 z-30 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600/20 p-2 rounded-lg border border-blue-500/30">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-lg font-semibold tracking-tight">MemoryLib Web Editor</h1>
            </div>

            {/* Navigation Button */}
            <NavTriggerButton onClick={() => setIsNavOpen(true)} isOpen={isNavOpen} />
          </div>
          
          {/* Tab Switcher */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === 'app' ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <LayoutTemplate className="w-4 h-4 mr-2" />
              Events
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === 'projects' ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Projects
            </button>
            <button
              onClick={() => setActiveTab('coldstart')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === 'coldstart' ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <Rocket className="w-4 h-4 mr-2" />
              Cold Start
            </button>
            <button
              onClick={() => setActiveTab('canvas')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === 'canvas' ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <PenTool className="w-4 h-4 mr-2" />
              Canvas
            </button>
            <button
              onClick={() => setActiveTab('showcase')}
              className={`flex items-center px-3 py-1.5 text-sm rounded-md transition-all ${activeTab === 'showcase' ? 'bg-white dark:bg-zinc-900 shadow-sm font-medium text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'}`}
            >
              <Box className="w-4 h-4 mr-2" />
              Components
            </button>
          </div>

          <div className="flex items-center gap-4">
            <input 
              type="file" 
              accept="application/json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload} 
            />
            <button
               onClick={() => fileInputRef.current?.click()}
               className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import 
            </button>
            
            {events.length > 0 && (
              <>
                <button
                  onClick={() => exportData()}
                  className="flex items-center px-3 py-1.5 text-sm bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-200 rounded-md transition-colors border border-zinc-200 dark:border-zinc-700 shadow-sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
                <button
                  onClick={async () => {
                    if (confirm("确定要清除所有数据吗？此操作不可恢复。")) {
                      await clearEvents();
                      alert("数据已清除！请重新导入 JSON 文件。");
                    }
                  }}
                  className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-md transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                  title="Clear All Events"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            
            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1"></div>
            
            <ModeToggle />
            <button className="p-2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      {activeTab === 'canvas' ? (
        <main className="flex-1 overflow-hidden">
          <DiaryCanvas />
        </main>
      ) : activeTab === 'projects' ? (
        <main className="flex-1 overflow-hidden">
          <ProjectManagement />
        </main>
      ) : activeTab === 'coldstart' ? (
        <main className="flex-1 p-6 overflow-x-hidden">
          <ColdStart />
        </main>
      ) : activeTab === 'app' ? (
        <main className="flex-1 p-6 overflow-x-hidden">
          <EventList />
        </main>
      ) : (
        <main className="flex-1 p-6 pb-32 overflow-x-hidden overflow-y-auto w-full relative">
          <div className="max-w-6xl mx-auto space-y-16">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">1. Filter Toolbar</h2>
            <div className="p-8 bg-zinc-50 dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden">
               <FilterToolbar />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">2. Graph View Components</h2>
            <div className="p-8 bg-zinc-100 dark:bg-zinc-800 border rounded-2xl shadow-inner relative h-96 overflow-hidden flex items-center justify-center">
               
               {/* Mock Graph Layout */}
               <div className="relative w-full max-w-2xl h-full flex flex-col justify-center gap-12">
                 
                 <div className="flex justify-between items-center px-12">
                    <MemoryNode title="Sky watching" variant="pill" selected />
                    <MemoryNode title="Meet up" variant="pill" />
                 </div>

                 <div className="flex justify-around items-center">
                    <MemoryNode title="1.20" variant="detail" images={['https://images.unsplash.com/photo-1514565131-fce0801e5785?w=500&q=80']} />
                    <MemoryNode title="Eating and Drinking" variant="pill" />
                    <MemoryNode title="Sports" variant="pill" selected />
                 </div>

                 <div className="flex justify-between items-center px-16">
                    <MemoryNode title="2.2" variant="image-cluster" images={['https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=500&q=80']} />
                    <MemoryNode title="Group Photo" variant="image-cluster" selected images={['https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&q=80']} />
                 </div>

               </div>
               
               {/* SVG splines mock */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 stroke-zinc-900 dark:stroke-white stroke-2" style={{ strokeDasharray: "4 4", fill: "none" }}>
                  <path d="M 300 150 Q 400 200 500 150" />
                  <path d="M 500 250 Q 400 200 300 250" />
                  <path d="M 400 300 Q 500 250 600 300" />
               </svg>

            </div>
          </section>
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">3. Timeline Coordinate View</h2>
            <div className="bg-zinc-50 dark:bg-zinc-900 border rounded-2xl shadow-sm overflow-hidden relative min-h-[500px]">
               <TimelineCoordinateView />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold border-b pb-2">4. Project History List</h2>
            <div className="bg-zinc-50 dark:bg-zinc-950 border rounded-3xl shadow-sm overflow-hidden py-12">
               <ProjectHistoryList />
            </div>
          </section>

        </div>
      </main>
      )}

      <MemoryReflectionAction />
      <EventEditor />
      <Chatbot />
    </div>
  );
}

export default App;