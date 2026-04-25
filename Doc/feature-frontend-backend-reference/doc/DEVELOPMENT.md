# MemoryLib 2.0 开发文档

## 项目概述

MemoryLib 2.0 是一个多端记忆管理应用，包含 Web 前端、后端服务、Android 手机端和 AR 眼镜端四个部分。

## 技术栈

### 前端 (Frontend)
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式**: TailwindCSS + Framer Motion
- **状态管理**: Zustand
- **数据存储**: Dexie (IndexedDB)
- **画布渲染**: React Konva
- **拖拽**: @dnd-kit
- **图表**: @xyflow/react

### 后端 (Backend)
- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL (pg)
- **认证**: JWT (jsonwebtoken) + bcryptjs
- **文件上传**: Multer
- **AI集成**: @anthropic-ai/sdk

### 移动端 (Mobile - Android)
- **语言**: Kotlin
- **UI框架**: Jetpack Compose
- **架构**: MVVM (ViewModel)

### 眼镜端 (Glass - Android)
- **语言**: Kotlin
- **UI框架**: Jetpack Compose
- **特性**: 手势交互、按键事件处理

---

## 目录结构

```
MemoryLib2.0/
├── frontend/           # Web 前端
├── backend/            # Node.js 后端
├── Mobile/             # Android 手机应用
├── Glass/              # Android AR 眼镜应用
├── Server Functions/   # 服务端函数
└── doc/               # 开发文档
```

---

## 前端组件文档

### 核心页面组件

#### App.tsx
主应用入口，包含五个主要视图切换：
- **App View**: 事件列表视图
- **Projects**: 项目管理界面
- **Cold Start**: 冷启动配置向导
- **Canvas**: 画布编辑器
- **Components**: 组件展示

全局组件:
- **Chatbot**: 浮动聊天机器人（始终可见）
- **EventEditor**: 事件编辑弹窗

路径: `frontend/src/App.tsx`

---

### Events 事件组件

#### EventList
**路径**: `frontend/src/components/events/EventList.tsx`

**功能**:
- 展示事件卡片网格列表
- 无事件时显示 JSON 上传组件
- 响应式布局 (1-4列)

**依赖**: EventCard, JSONUploader, eventStore

---

#### EventCard
**路径**: `frontend/src/components/events/EventCard.tsx`

**功能**:
- 展示单个事件卡片
- 支持拖拽到画布
- 显示媒体内容（图片/视频）
- 显示标签、时间、摘要

**Props**:
```typescript
interface EventCardProps {
  event: EventExtended;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: EventExtended) => void;
}
```

---

#### EventEditor
**路径**: `frontend/src/components/events/EventEditor.tsx`

**功能**: 事件编辑弹窗，允许用户修改事件标题、摘要、标签等

---

#### JSONUploader
**路径**: `frontend/src/components/events/JSONUploader.tsx`

**功能**: JSON 文件上传组件，支持导入时间轴数据

---

#### MemoryNode
**路径**: `frontend/src/components/events/MemoryNode.tsx`

**功能**: 记忆节点组件，用于图视图中展示事件关系

**变体**:
- `pill`: 胶囊形状
- `detail`: 详情卡片
- `image-cluster`: 图片集群

---

### Canvas 画布组件

#### DiaryCanvas
**路径**: `frontend/src/components/canvas/DiaryCanvas.tsx`

**功能**:
- 基于 Konva 的画布编辑器
- 支持添加文本、事件卡片、图片
- 拖拽和变换元素
- 缩放功能

**主要功能**:
- `addTextElement()`: 添加文本元素
- `addEventCard()`: 添加事件卡片
- `handleDrop()`: 处理拖放事件

---

#### CanvasToolbar
**路径**: `frontend/src/components/canvas/CanvasToolbar.tsx`

**功能**: 画布工具栏，提供缩放、添加元素等操作

---

#### ElementSidebar
**路径**: `frontend/src/components/canvas/ElementSidebar.tsx`

**功能**: 左侧元素面板，显示可拖拽的事件列表

---

### Layout 布局组件

#### ColdStart
**路径**: `frontend/src/components/layout/ColdStart.tsx`

**功能**: 冷启动配置向导，引导用户设置：
1. **时间范围**: 选择记忆的起止日期
2. **粒度**: 日/周/月
3. **目的**: 记忆回顾/日记/幻灯片/反思
4. **索引**: 主/次索引字段

**状态管理**:
```typescript
interface ColdStartConfig {
  startTime: Date | null;
  endTime: Date | null;
  granularity: 'day' | 'week' | 'month' | null;
  purpose: 'review' | 'diary' | 'slides' | 'reflection' | null;
  primaryIndex: string | null;
  secondaryIndex: string | null;
}
```

---

#### FilterToolbar
**路径**: `frontend/src/components/layout/FilterToolbar.tsx`

**功能**: 筛选工具栏，提供时间、标签等筛选条件

---

#### TimelineCoordinateView
**路径**: `frontend/src/components/layout/TimelineCoordinateView.tsx`

**功能**: 时间轴坐标视图，可视化展示事件时间线

---

#### ProjectHistoryList
**路径**: `frontend/src/components/layout/ProjectHistoryList.tsx`

**功能**: 项目历史列表，展示用户的项目记录

---

#### ProjectHistoryCard
**路径**: `frontend/src/components/layout/ProjectHistoryCard.tsx`

**功能**: 项目历史卡片，显示单个项目信息

---

#### MainLayout
**路径**: `frontend/src/components/layout/MainLayout.tsx`

**功能**: 主布局组件，实现三栏结构：
- **左侧**: DataPanel (数据组织面板)
- **中间**: TaskCanvas (任务画布)
- **右侧**: Chatbot (浮动AI助手)

**特性**:
- 可调整左侧面板宽度
- 面板展开/收起切换
- 响应式设计

**Props**:
```typescript
interface MainLayoutProps {
  onLogout?: () => void;
}
```

---

#### DataPanel
**路径**: `frontend/src/components/layout/DataPanel.tsx`

**功能**: 数据组织面板，实现三层缩放结构：
1. **Level 1 (概览层)**: 显示事件类别/标签的图形化视图
2. **Level 2 (详情层)**: 显示特定类别下的事件列表
3. **Level 3 (编辑层)**: 事件编辑界面

**视图模式**:
- `graph`: 图形视图 (气泡布局)
- `grid`: 网格视图 (2列卡片)
- `list`: 列表视图 (单列)

**特性**:
- 事件搜索过滤
- 事件拖拽支持
- 缩放层级导航

---

#### TaskCanvas
**路径**: `frontend/src/components/layout/TaskCanvas.tsx`

**功能**: 任务画布入口组件

**特性**:
- 任务模板选择 (日记/反思/幻灯片/自定义)
- 集成 DiaryCanvas 组件
- 空状态引导

---

### UI 组件

#### MemoryReflectionAction
**路径**: `frontend/src/components/ui/MemoryReflectionAction.tsx`

**功能**: 记忆反思操作面板

---

#### ModeToggle
**路径**: `frontend/src/components/ui/mode-toggle.tsx`

**功能**: 明暗主题切换按钮

---

#### theme-provider
**路径**: `frontend/src/components/ui/theme-provider.tsx`

**功能**: 主题上下文提供者

---

#### Select
**路径**: `frontend/src/components/ui/select.tsx`

**功能**: 下拉选择组件

---

#### Slider
**路径**: `frontend/src/components/ui/slider.tsx`

**功能**: 滑动条组件

---

### Projects 项目组件

#### ProjectManagement
**路径**: `frontend/src/components/projects/ProjectManagement.tsx`

**功能**:
- 项目管理主界面
- 左侧项目列表（支持搜索、状态筛选）
- 右侧项目详情视图
- 创建/编辑/删除项目

**状态管理**: `projectStore`

**特性**:
- 项目状态: active / archived / completed
- 事件关联管理
- 项目时长统计
- IndexedDB 持久化

**Props**: 无（自包含组件）

---

### Navigation 导航组件

#### NavigationPanel
**路径**: `frontend/src/components/navigation/NavigationPanel.tsx`

**功能**:
- 快速导航面板（顶部按钮触发）
- 搜索页面和组件
- 键盘导航支持（↑↓、Enter、Esc）
- Cmd/Ctrl + K 快捷键打开

**特性**:
- 当前页面高亮显示
- 分类展示（页面 / 组件）
- 模糊搜索

**Props**:
```typescript
interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (id: string) => void;
}
```

---

#### NavTriggerButton
**路径**: `frontend/src/components/navigation/NavigationPanel.tsx`

**功能**: 导航按钮，显示在 Header 中

---

### Chatbot 聊天组件

#### Chatbot
**路径**: `frontend/src/components/chatbot/Chatbot.tsx`

**功能**:
- AI 聊天机器人组件
- 浮动面板，可最小化
- 事件拖拽支持
- 消息历史记录

**状态管理**: `chatStore`

**特性**:
- 事件摘要生成（Mock AI）
- 模式分析
- Markdown 格式支持
- 多事件上下文
- 打字动画效果

**交互**:
- 从 Panel 拖拽事件到 Chatbot
- 按 Enter 发送消息
- Shift+Enter 换行

---

### Auth 认证组件

#### LoginPage
**路径**: `frontend/src/components/auth/LoginPage.tsx`

**功能**:
- 用户登录页面
- 邮箱/密码认证
- 第三方登录占位（Google, GitHub, WeChat）
- 记住我选项
- 加载状态和错误提示

**状态管理**: `uiStore`

**Props**:
```typescript
interface LoginPageProps {
  onLogin: (user: User) => void;
}
```

**流程**:
1. 用户输入邮箱和密码
2. 点击登录按钮
3. 验证通过后调用 `onLogin` 回调
4. UI Store 更新认证状态

---

---

## 状态管理 (Stores)

### eventStore
**路径**: `frontend/src/stores/eventStore.ts`

**状态**:
```typescript
interface EventState {
  events: EventExtended[];
  selectedEventId: string | null;
}
```

**方法**:
| 方法 | 描述 |
|------|------|
| `loadEvents()` | 从 IndexedDB 加载事件 |
| `selectEvent(id)` | 选择事件 |
| `updateEvent(id, changes)` | 更新事件 |
| `importTimeline(timeline, filename)` | 导入时间轴 JSON |
| `exportData()` | 导出数据为 JSON |
| `clearEvents()` | 清除所有事件 |

---

### canvasStore
**路径**: `frontend/src/stores/canvasStore.ts`

**功能**: 画布状态管理，包含元素位置、缩放、选中状态等

---

### projectStore
**路径**: `frontend/src/stores/projectStore.ts`

**状态**:
```typescript
interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
}
```

**方法**:
| 方法 | 描述 |
|------|------|
| `loadProjects()` | 加载所有项目 |
| `createProject(name, description)` | 创建新项目 |
| `updateProject(id, changes)` | 更新项目 |
| `deleteProject(id)` | 删除项目 |
| `addEventToProject(projectId, eventId)` | 添加事件到项目 |
| `removeEventFromProject(projectId, eventId)` | 从项目移除事件 |
| `getProjectEvents(projectId)` | 获取项目的事件列表 |

---

### chatStore
**路径**: `frontend/src/stores/chatStore.ts`

**状态**:
```typescript
interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  isTyping: boolean;
}
```

**方法**:
| 方法 | 描述 |
|------|------|
| `createSession(projectId?)` | 创建新会话 |
| `setCurrentSession(id)` | 设置当前会话 |
| `addMessage(sessionId, message)` | 添加消息 |
| `sendMessage(content, attachedEventIds, events)` | 发送消息并获取 AI 回复 |
| `deleteSession(id)` | 删除会话 |
| `clearCurrentSession()` | 清空当前会话 |

---

### uiStore
**路径**: `frontend/src/stores/uiStore.ts`

**功能**: UI 状态管理（认证、主题、面板状态等）

**状态**:
```typescript
interface UIState {
  // 认证状态
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // 冷启动
  coldStartCompleted: boolean;
  coldStartConfig: ColdStartConfig | null;

  // UI 状态
  activePanel: ActivePanel;
  sidebarCollapsed: boolean;
  rightPanelWidth: number;
  leftPanelWidth: number;

  // 面板状态
  panelZoomLevel: ZoomLevel;  // 1 | 2 | 3
  panelLayout: LayoutType;    // 'graph' | 'timeline' | 'grid' | 'list'
  panelFilter: PanelFilter;

  // 通知
  notifications: Notification[];
}
```

**方法**:
| 方法 | 描述 |
|------|------|
| `login(user)` | 登录用户 |
| `logout()` | 登出用户 |
| `completeColdStart(config)` | 完成冷启动配置 |
| `resetColdStart()` | 重置冷启动状态 |
| `setActivePanel(panel)` | 设置活动面板 |
| `toggleSidebar()` | 切换侧边栏 |
| `setPanelZoomLevel(level)` | 设置面板缩放层级 |
| `setPanelLayout(layout)` | 设置面板布局模式 |
| `setPanelFilter(filter)` | 设置面板过滤器 |

---

## 数据类型 (Types)

### Global 类型
**路径**: `frontend/src/types/global.ts`

```typescript
// 冷启动配置
interface ColdStartConfig {
  startTime: Date | null;
  endTime: Date | null;
  granularity: 'daily' | 'weekly' | 'monthly' | 'event';
  purpose: 'review' | 'diary' | 'project' | 'reflection' | 'custom';
  primaryIndex: IndexType;
  secondaryIndex?: IndexType;
}

// 索引类型
type IndexType = 'time' | 'event_type' | 'emotion' | 'person' | 'location' | 'keyword';

// 用户
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  coldStartCompleted: boolean;
}

// 面板状态
type ZoomLevel = 1 | 2 | 3;
type LayoutType = 'graph' | 'timeline' | 'grid' | 'list';

interface PanelFilter {
  timeRange: { start: Date | null; end: Date | null };
  eventTypes: string[];
  emotions: string[];
  people: string[];
  locations: string[];
  keywords: string[];
}
```

---

### Event 类型
**路径**: `frontend/src/types/event.ts`

```typescript
// 媒体项
interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  timestamp?: string;
  caption?: string;
  duration?: number;
}

// 原始事件
interface Event {
  event_index: number;
  start_sec: number;
  end_sec: number;
  start_hms: string;
  end_hms: string;
  title: string;
  summary: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  media?: MediaItem[];
  tags?: string[];
  location?: string;
  mood?: string;
  people?: string[];
  // ... 其他字段
}

// 扩展事件
interface EventExtended extends Event {
  id: string;
  videoId: string;
  userTitle: string | null;
  userSummary: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// 项目
interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  eventIds: string[];
  thumbnailUrl?: string;
  status: 'active' | 'archived' | 'completed';
}

// 聊天消息
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedEventIds?: string[];
}

// 聊天会话
interface ChatSession {
  id: string;
  projectId: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
```

---

### Canvas 类型
**路径**: `frontend/src/types/canvas.ts`

```typescript
type CanvasElementType = 'text' | 'image' | 'video' | 'event-card';

interface CanvasElement {
  id: string;
  type: CanvasElementType;
  position: Position;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  locked: boolean;
  content?: string;
  mediaUrl?: string;
  eventId?: string;
  event?: EventExtended;
  style?: ElementStyle;
}

interface DiaryEntry {
  id: string;
  title: string;
  date: string;
  elements: CanvasElement[];
  canvasSize: { width: number; height: number };
  createdAt: string;
  updatedAt: string;
}
```

---

## 数据库 (Database)

### MemoryLibDB
**路径**: `frontend/src/db/index.ts`

使用 Dexie.js 封装 IndexedDB：

```typescript
class MemoryLibDB extends Dexie {
  events!: Table<EventExtended>;
  videos!: Table<VideoMeta>;
  tags!: Table<Tag>;
}
```

**表结构**:
| 表名 | 索引 | 描述 |
|------|------|------|
| events | id, videoId, eventIndex, *tags | 事件数据 |
| videos | id, filename, importedAt | 视频元数据 |
| tags | id, name | 标签 |

---

## 后端 API 文档

### 基础路由

#### GET /health
健康检查

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### GET /api
API 信息

**响应**:
```json
{
  "message": "MemoryLib API"
}
```

---

## 移动端组件 (Mobile - Android)

### Activities

#### MainActivity
**路径**: `Mobile/CXRMSamples/.../activities/main/MainActivity.kt`

**功能**:
- 应用入口
- 蓝牙权限请求
- 蓝牙状态检查

**状态**:
- `PERMISSION_REQUIRED`: 需要权限
- `BLUETOOTH_DISABLED`: 蓝牙未开启
- `BLUETOOTH_READY`: 蓝牙就绪

---

#### BluetoothInitActivity
**路径**: `Mobile/CXRMSamples/.../activities/bluetoothConnection/BluetoothInitActivity.kt`

**功能**: 蓝牙连接初始化和设备配对

---

#### AudioUsageActivity
**路径**: `Mobile/CXRMSamples/.../activities/audio/AudioUsageActivity.kt`

**功能**: 音频功能演示

---

#### CustomViewActivity
**路径**: `Mobile/CXRMSamples/.../activities/customView/CustomViewActivity.kt`

**功能**: 自定义视图演示

---

#### DeviceInformationActivity
**路径**: `Mobile/CXRMSamples/.../activities/deviceInformation/DeviceInformationActivity.kt`

**功能**: 设备信息展示

---

#### CustomProtocolActivity
**路径**: `Mobile/CXRMSamples/.../activities/customProtocol/CustomProtocolActivity.kt`

**功能**: 自定义协议通信

---

#### UsageSelectionActivity
**路径**: `Mobile/CXRMSamples/.../activities/usageSelection/UsageSelectionActivity.kt`

**功能**: 用例选择界面

---

#### TTSAndNotificationActivity
**路径**: `Mobile/CXRMSamples/.../activities/ttsAndNotification/TTSAndNotificationActivity.kt`

**功能**: TTS 语音和通知功能

---

#### AISceneActivity
**路径**: `Mobile/CXRMSamples/.../activities/useAIScene/AISceneActivity.kt`

**功能**: AI 场景演示

---

#### PictureActivity
**路径**: `Mobile/CXRMSamples/.../activities/picture/PictureActivity.kt`

**功能**: 图片拍摄和浏览

---

#### TeleprompterSceneActivity
**路径**: `Mobile/CXRMSamples/.../activities/useTeleprompter/TeleprompterSceneActivity.kt`

**功能**: 提词器场景

---

#### VideoActivity
**路径**: `Mobile/CXRMSamples/.../activities/video/VideoActivity.kt`

**功能**: 视频录制和播放

---

#### MediaFileActivity
**路径**: `Mobile/CXRMSamples/.../activities/mediaFile/MediaFileActivity.kt`

**功能**: 媒体文件管理

---

#### TranslationSceneActivity
**路径**: `Mobile/CXRMSamples/.../activities/useTranslation/TranslationSceneActivity.kt`

**功能**: 翻译场景

---

### DataBeans (数据模型)

#### UsageType
**路径**: `Mobile/CXRMSamples/.../dataBeans/UsageType.kt`

**功能**: 用例类型枚举

---

#### SelfView 数据模型
**路径**: `Mobile/CXRMSamples/.../dataBeans/selfView/`

包含:
- `SelfViewJson`: 自定义视图 JSON 解析
- `TextViewProps`: 文本视图属性
- `ImageViewProps`: 图片视图属性
- `LinearLayoutProps`: 线性布局属性
- `RelativeLayoutProps`: 相对布局属性

---

## 眼镜端组件 (Glass - Android)

### Activities

#### MainActivity
**路径**: `Glass/CXRSSDKSamples/.../activities/main/MainActivity.kt`

**功能**:
- 眼镜端入口
- 支持手势导航（前滑/后滑）
- 按键事件处理

**手势映射**:
- 右键 + 下键 = 前滑 → 进入 SelfCMD
- 左键 + 上键 = 后滑 → 进入 Keys

---

#### SelfCMDActivity
**路径**: `Glass/CXRSSDKSamples/.../activities/selfCMD/SelfCMDActivity.kt`

**功能**: 自定义命令演示

---

#### KeysActivity
**路径**: `Glass/CXRSSDKSamples/.../activities/keys/KeysActivity.kt`

**功能**: 按键事件演示

---

#### AudioRecordActivity
**路径**: `Glass/CXRSSDKSamples/.../activities/audioRecord/AudioRecordActivity.kt`

**功能**: 音频录制

---

#### VideoRecordActivity
**路径**: `Glass/CXRSSDKSamples/.../activities/videoRecord/VideoRecordActivity.kt`

**功能**: 视频录制

---

## 运行指南

### 前端
```bash
cd MemoryLib2.0/frontend
npm install
npm run dev
```

### 后端
```bash
cd MemoryLib2.0/backend
npm install
npm run dev
```

### Android 应用
使用 Android Studio 打开 `Mobile/CXRMSamples` 或 `Glass/CXRSSDKSamples` 目录。

---

## 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2026-03-13 | 新增 NavigationPanel 快速导航面板 (Cmd+K) |
| 2026-03-13 | 完成用户交互全流程核心组件 |
| 2026-03-13 | 新增 MainLayout 三栏布局 |
| 2026-03-13 | 新增 DataPanel 数据组织面板 (三层缩放) |
| 2026-03-13 | 新增 TaskCanvas 任务画布入口 |
| 2026-03-13 | 新增 LoginPage 登录页面 |
| 2026-03-13 | 完善 uiStore 状态管理 |
| 2026-03-13 | 新增 global.ts 类型定义 |
| 2026-03-13 | 完成 Chatbot 组件和 ProjectManagement 界面 |
| 2026-03-13 | 新增 projectStore, chatStore 状态管理 |
| 2026-03-13 | EventCard 支持拖拽到 Chatbot |
| 2026-03-13 | 更新开发文档，完善组件说明 |
| 2024-03-13 | 初始文档创建 |

---

## 贡献指南

1. 新增组件时请更新此文档
2. 遵循现有代码风格
3. 使用 TypeScript 类型定义
4. 组件命名采用 PascalCase