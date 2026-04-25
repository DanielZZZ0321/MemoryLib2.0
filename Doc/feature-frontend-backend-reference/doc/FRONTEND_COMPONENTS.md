# MemoryLib 2.0 前端组件文档

本文档基于当前分支代码整理，主要覆盖 `frontend/src/components` 下的 React + TypeScript 组件，以及它们依赖的 store、类型和数据流。

## 组件库概览

当前前端有两套并存的组件形态：

1. 当前主入口流程：`frontend/src/App.tsx` 直接承载登录、MemoryLib History 列表、概念图详情页和 `ChatbotPanel`。
2. 早期工作台式组件库：`MainLayout`、`DataPanel`、`DiaryCanvas`、`ProjectManagement`、`NavigationPanel` 等仍在代码中保留并导出，适合作为可复用组件或后续整合入口。

技术栈与组件相关依赖：

| 类别 | 使用 |
| --- | --- |
| UI 框架 | React 18, TypeScript |
| 样式 | TailwindCSS, 全局 CSS |
| 动效 | Framer Motion |
| 图标 | lucide-react |
| 状态管理 | Zustand |
| 本地存储 | Dexie IndexedDB, 原生 IndexedDB, localStorage |
| 画布 | react-konva |
| 下拉菜单 | `@radix-ui/react-dropdown-menu` 被 `Select` 使用 |

## 当前主入口

### App

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/App.tsx` |
| 导出 | `default function App()` |
| 当前状态 | 当前 `main.tsx` 直接挂载的唯一入口 |
| 主要依赖 | `auth.ts`, `ConceptGraphView`, `ChatbotPanel`, `pageContextStore` |

功能：

- 检查当前登录状态，未登录时显示内联 `AuthScreen`。
- 登录后展示 MemoryLib History 卡片列表，数据来自 `/api/page-config`，失败时使用内置样例。
- 点击 MemoryLib 卡片后进入 `ConceptGraphView`。
- 在 History 和概念图页面都可打开 `ChatbotPanel`。
- 通过 `pageContextStore` 告知聊天助手当前处于 History 页。

关键内联组件：

| 组件 | 功能 | 备注 |
| --- | --- | --- |
| `AuthScreen` | 登录/注册表单，调用 `authApi.login/register/getMe` | 当前入口实际使用的认证界面，不是 `components/auth/LoginPage` |
| `MemoryLibHistory` | 按年份展示 MemoryLib 卡片，支持打开聊天和退出登录 | 使用 `page-config` 或 `SAMPLE_MEMORYLIBS` |

### ConceptGraphView

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ConceptGraphView.tsx` |
| 导出 | `ConceptGraphView` |
| 当前状态 | 当前主流程正在使用 |
| 主要依赖 | `conceptLayout`, `EventNodeCard`, `EventEditorPopup`, `pageContextStore` |

功能：

- 展示 MemoryLib 的概念图，支持两种模式：
  - 标签模式：根据 MemoryLib 标题和 tags 生成节点。
  - 事件模式：从 `/api/memorylibs/:id` 加载 events 后，按事件生成节点。
- 使用 `computeConceptLayout` 自动布局，使用 SVG 绘制节点连线。
- 事件模式下用 `foreignObject` 嵌入 `EventNodeCard`。
- 支持拖动节点，并将布局覆盖值保存到 `localStorage`。
- 双击事件节点打开 `EventEditorPopup`。
- 将当前页面、事件、节点 ID、节点位置写入 `pageContextStore`，供 AI 聊天理解当前上下文。
- 当 AI action 中出现 `layout_reset` 时清除本地布局。

Props：

```ts
interface ConceptGraphViewProps {
  entry: { id: string; title: string; tags: string[]; color: string; sourceFile?: string };
  onBack: () => void;
  onOpenChat?: () => void;
  width?: number;
  height?: number;
}
```

关键特性：

- 自动响应容器尺寸变化。
- 支持标签图与事件图的独立布局缓存。
- 颜色由 MemoryLib entry 的 `color` 映射到 accent 色。
- 当前编辑保存只更新本地 `memoryLib` state，没有直接持久化回后端。

### EventNodeCard

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/EventNodeCard.tsx` |
| 导出 | `EventNodeCard`, `MemoryLibEvent` |
| 当前状态 | `ConceptGraphView` 中使用 |
| 主要依赖 | `lucide-react` |

功能：

- 在概念图中以紧凑卡片形式展示单个事件。
- 可展示首个媒体资源，图片用 `img`，视频用静音 `video`。
- 展示标题、开始时间、摘要和最多 3 个标签。

Props：

```ts
interface EventNodeCardProps {
  event: MemoryLibEvent;
  accent: string;
  isCenter?: boolean;
  onClick?: () => void;
}
```

### EventEditorPopup

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/EventEditorPopup.tsx` |
| 导出 | `EventEditorPopup`, `EventEditorData`, `MediaItem` |
| 当前状态 | `ConceptGraphView` 中使用 |
| 主要依赖 | `lucide-react` |

功能：

- 事件详情弹窗，支持 `overview` 和 `edit` 两种模式。
- 展示与编辑标题、起止时间、标签、摘要、笔记。
- 分区展示视频、音频、照片。
- 支持编辑 media 的 URL 和 caption。
- 点击遮罩关闭，点击弹窗内部阻止冒泡。

Props：

```ts
interface EventEditorPopupProps {
  event: EventEditorData;
  eventIndex: number;
  accent: string;
  onClose: () => void;
  onSave?: (event: EventEditorData) => void;
}
```

关键特性：

- `accent` 控制弹窗头部渐变和编辑态按钮颜色。
- `onSave` 是可选回调，组件本身不绑定后端保存。

### ChatbotPanel

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/chatbot/ChatbotPanel.tsx` |
| 导出 | `ChatbotPanel` |
| 当前状态 | 当前主流程正在使用 |
| 主要依赖 | `chatStore`, `pageContextStore`, `localStorage` |

功能：

- 右侧滑入式聊天面板。
- 使用 `chatStore` 维护会话、消息、加载状态。
- 发送消息时携带当前 `pageContextStore.context`，让后端或 AI 能感知当前页面。
- 支持新建对话、关闭面板、自动滚动到底部。
- 支持 `Memory Core RAG` 开关，状态保存在 `localStorage.memoryCoreRag`。
- 输入支持 Enter 发送、Ctrl+Enter 发送、Shift+Enter 换行。

Props：

```ts
interface ChatbotPanelProps {
  open: boolean;
  onClose: () => void;
}
```

关键特性：

- 面板使用很高的 `z-index`，避免被图节点和弹窗遮挡。
- 有备用“点击此处发送”区域，解决部分环境按钮点击不稳定的问题。
- 该组件不依赖 `eventStore`，它依赖页面上下文和聊天 store。

## 事件组件

### EventList

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/events/EventList.tsx` |
| 导出 | `EventList` |
| 当前状态 | 可复用，当前 `App.tsx` 未直接挂载 |
| 主要依赖 | `eventStore`, `EventCard`, `JSONUploader` |

功能：

- 加载并展示 IndexedDB 中的事件。
- 无事件时显示 `JSONUploader`。
- 有事件时以响应式网格展示 `EventCard`。
- 提供“同步到 Memory Core”按钮，调用 `eventStore.syncToMemoryCore()`。
- 展示同步中、同步成功、同步失败状态。

### EventCard

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/events/EventCard.tsx` |
| 导出 | `EventCard` |
| 当前状态 | `EventList`、`DataPanel` 使用 |
| 主要依赖 | `EventExtended`, `lucide-react` |

功能：

- 展示单个事件的标题、时间、摘要、标签和媒体头图。
- 支持单媒体和多媒体布局，多媒体最多展示前 4 个，超过显示数量遮罩。
- 支持 HTML5 drag and drop，写入 `eventData`、`type=event-card`、`eventId`。
- 自定义拖拽预览。

Props：

```ts
interface EventCardProps {
  event: EventExtended;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: EventExtended) => void;
}
```

### EventEditor

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/events/EventEditor.tsx` |
| 导出 | `EventEditor` |
| 当前状态 | `DataPanel` 使用 |
| 主要依赖 | `eventStore`, `framer-motion` |

功能：

- 根据 `eventStore.selectedEventId` 打开右侧编辑抽屉。
- 支持编辑 `userTitle`、`userSummary`、`notes`。
- 展示首个媒体资源，图片或视频。
- 保存时调用 `eventStore.updateEvent()`，并清空选中事件。

关键特性：

- 用户标题和摘要与原始标题摘要分开保存。
- 使用 Framer Motion 做遮罩和抽屉进出场动画。

### JSONUploader

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/events/JSONUploader.tsx` |
| 导出 | `JSONUploader` |
| 当前状态 | `EventList`、`DataPanel` 使用 |
| 主要依赖 | `eventStore.importTimeline` |

功能：

- 接收 `application/json` 文件。
- 读取并解析 JSON。
- 只接受数组格式，数组会传给 `importTimeline(json, file.name)`。
- 解析失败或格式不正确时用 `alert` 提示。

### MemoryNode

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/events/MemoryNode.tsx` |
| 导出 | `MemoryNode`, `MemoryNodeProps` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `cn` |

功能：

- 通用记忆节点展示组件。
- 支持三种视觉变体：
  - `pill`：胶囊节点。
  - `detail`：详情卡片，支持图片、日期、描述。
  - `image-cluster`：图片集群缩略节点。
- 支持选中态和点击回调。

Props：

```ts
export interface MemoryNodeProps {
  title: string;
  images?: string[];
  selected?: boolean;
  dateStr?: string;
  description?: string;
  className?: string;
  onClick?: () => void;
  variant?: 'pill' | 'detail' | 'image-cluster';
}
```

## 画布组件

### DiaryCanvas

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/canvas/DiaryCanvas.tsx` |
| 导出 | `DiaryCanvas` |
| 当前状态 | `TaskCanvas` 使用 |
| 主要依赖 | `react-konva`, `canvasStore`, `eventStore`, `CanvasToolbar`, `ElementSidebar` |

功能：

- 多模态日记画布编辑器。
- 若没有当前 entry，会自动创建 `Untitled Diary`。
- 根据容器尺寸自动更新画布尺寸。
- 支持从事件侧栏拖入事件卡片或媒体。
- 支持添加文本、添加图片、缩放、选中、拖动、变换。
- 使用 Konva `Transformer` 管理选中元素的 resize/rotate。

内部渲染器：

| 内部组件 | 功能 |
| --- | --- |
| `CanvasElementRenderer` | 按元素类型分发渲染 |
| `EventCardRenderer` | 在 Konva 中渲染事件卡片 |
| `ImageElement` | 加载图片并渲染为 `KonvaImage` |
| `MediaRenderer` | 渲染独立图片元素 |

支持元素类型：

```ts
type CanvasElementType = 'text' | 'image' | 'video' | 'event-card';
```

关键限制：

- `video` 类型在类型中存在，但当前 `DiaryCanvas` 主要实现了 text、image、event-card。
- `CanvasToolbar` 的 Save 和 Download 按钮目前主要是 UI，占位行为未接入完整保存/导出逻辑。

### CanvasToolbar

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/canvas/CanvasToolbar.tsx` |
| 导出 | `CanvasToolbar` |
| 当前状态 | `DiaryCanvas` 使用 |
| 主要依赖 | `canvasStore`, `lucide-react` |

功能：

- 控制侧栏显隐。
- 添加文本元素。
- 通过文件选择添加图片元素，图片转为 data URL 存入 canvas element。
- 调整缩放，显示百分比。
- 展示日记模板标题。
- 提供 Save 和 Download 按钮 UI。

Props：

```ts
interface CanvasToolbarProps {
  onAddText: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  zoom: number;
  onToggleSidebar: () => void;
  showSidebar: boolean;
}
```

### ElementSidebar

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/canvas/ElementSidebar.tsx` |
| 导出 | `ElementSidebar` |
| 当前状态 | `DiaryCanvas` 使用 |
| 主要依赖 | `EventExtended`, `framer-motion` |

功能：

- 画布左侧事件资源面板。
- 搜索事件标题、摘要和标签。
- 按创建时间粗分为 `today`、`this-week`、`this-month`、`older`。
- 支持折叠/展开分组。
- 事件可拖拽到画布，媒体也可单独拖拽到画布。
- 点击事件可设置选中事件。

Props：

```ts
interface ElementSidebarProps {
  events: EventExtended[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onAddEventCard: (eventId: string) => void;
}
```

备注：

- `onAddEventCard` 在 Props 中定义，但当前组件内部没有直接调用，主要通过拖拽交互添加。

## 布局与工作台组件

### MainLayout

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/MainLayout.tsx` |
| 导出 | `MainLayout` |
| 当前状态 | 可复用，当前 `App.tsx` 未直接挂载 |
| 主要依赖 | `DataPanel`, `TaskCanvas`, `Chatbot`, `ModeToggle`, `uiStore`, `eventStore` |

功能：

- 早期三栏工作台主布局。
- 顶部 Header 包含 logo、Panel/Canvas 视图切换、事件计数、主题切换、用户头像和退出按钮。
- 左侧 `DataPanel` 可展开、收起和拖动调整宽度。
- 中间区域承载 `TaskCanvas`。
- 右下角挂载浮动版 `Chatbot`。

Props：

```ts
interface MainLayoutProps {
  onLogout?: () => void;
}
```

### DataPanel

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/DataPanel.tsx` |
| 导出 | `DataPanel` |
| 当前状态 | `MainLayout` 使用 |
| 主要依赖 | `eventStore`, `uiStore`, `EventCard`, `EventEditor`, `JSONUploader` |

功能：

- 左侧数据组织和事件管理面板。
- 无事件时显示 `JSONUploader`。
- 支持搜索事件。
- 以 tag 将事件分组。
- 支持三层缩放结构：
  - Level 1：概览层，graph/grid/list 三种布局。
  - Level 2：分类详情层，展示某个 tag 下事件。
  - Level 3：事件编辑层，嵌入 `EventEditor`。
- 事件支持拖拽，drag data 与 `EventCard` 保持一致。

视图模式：

| 模式 | 内部组件 | 功能 |
| --- | --- | --- |
| `graph` | `GraphView` | 按 tag 数量渲染圆形分类节点 |
| `grid` | `GridView` | 双列简卡事件网格 |
| `list` | `ListView` | 单列事件列表 |

关键状态：

- `uiStore.panelZoomLevel`
- `uiStore.panelLayout`
- 本地 `searchQuery`
- 本地 `selectedCategory`

### TaskCanvas

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/TaskCanvas.tsx` |
| 导出 | `TaskCanvas` |
| 当前状态 | `MainLayout` 使用 |
| 主要依赖 | `DiaryCanvas`, `canvasStore` |

功能：

- 任务执行区入口。
- 无当前任务或画布 entry 时显示模板选择。
- 支持四种模板：Diary、Reflection、Slides、Custom。
- 选择模板后调用 `canvasStore.createNewEntry()`，进入 `DiaryCanvas`。

Props：

```ts
interface TaskCanvasProps {
  activeView: 'panel' | 'canvas';
}
```

备注：

- 当前实现中 `_props` 未实际使用，Panel/Canvas 切换状态没有影响渲染逻辑。

### ColdStart

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/ColdStart.tsx` |
| 导出 | `ColdStart` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `Select`, `lucide-react` |

功能：

- 冷启动配置向导。
- 四步流程：时间范围、时间粒度、使用目的、组织索引。
- 每步有必填校验，满足条件才允许下一步。
- 完成时调用 `onComplete(config)`。
- 完成后展示配置摘要，并允许重置重新开始。

Props：

```ts
interface ColdStartProps {
  onComplete?: (config: ColdStartConfig) => void;
}
```

注意：

- 该文件内部定义的 `ColdStartConfig` 使用 `day | week | month`，与 `types/global.ts` 中的 `daily | weekly | monthly | event` 不完全一致。后续接入全局 store 时建议统一。

### FilterToolbar

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/FilterToolbar.tsx` |
| 导出 | `FilterToolbar` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `Select`, `RangeSlider` |

功能：

- 组合式筛选工具栏。
- 支持 Primary Element、Secondary Element 下拉选择。
- 支持时间范围滑块，格式化为类似 `2.13` 的日期标签。
- 设置弹层包含分类细度、展示数量、关键词开关和 Renew 操作。

备注：

- 当前状态均为组件本地 state，尚未接入 `uiStore.panelFilter`。

### ProjectHistoryCard

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/ProjectHistoryCard.tsx` |
| 导出 | `ProjectHistoryCard`, `ProjectHistoryCardProps`, `CardTheme` |
| 当前状态 | `ProjectHistoryList` 使用，当前主入口有一套内联 History 卡片 |
| 主要依赖 | `cn`, `lucide-react` |

功能：

- MemoryLib/Project 历史卡片。
- 支持 blue、yellow、green、purple、red 五种主题。
- 使用斜角 date ribbon、标签胶囊和 hover 抬升效果。
- `isNew` 时展示新建遮罩和加号按钮。

Props：

```ts
export interface ProjectHistoryCardProps {
  title: string;
  theme: CardTheme;
  dateRange: string;
  tags: string[];
  onClick?: () => void;
  className?: string;
  isNew?: boolean;
}
```

### ProjectHistoryList

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/ProjectHistoryList.tsx` |
| 导出 | `ProjectHistoryList` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `ProjectHistoryCard` |

功能：

- 使用 mock 数据按年份分组展示历史卡片。
- 当前没有接入 API 或 store。
- 可作为当前 `App.tsx` 内联 `MemoryLibHistory` 的组件化替代基础。

### TimelineCoordinateView

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/layout/TimelineCoordinateView.tsx` |
| 导出 | `TimelineCoordinateView` |
| 当前状态 | 原型/展示组件 |
| 主要依赖 | 无外部业务依赖 |

功能：

- 时间坐标轴展示原型。
- 包含 X/Y 轴、时间刻度、Working/Resting 标签和若干事件块占位。
- 当前禁用交互：`select-none pointer-events-none opacity-80`。

## 项目管理组件

### ProjectManagement

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/projects/ProjectManagement.tsx` |
| 导出 | `ProjectManagement` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `projectStore`, `eventStore`, `framer-motion` |

功能：

- 左侧项目列表，右侧项目详情。
- 支持新建、编辑、删除项目。
- 支持项目搜索和状态筛选：all、active、archived、completed。
- 展示项目创建时间、事件数量、总时长。
- 右侧详情展示项目关联事件列表。
- 事件可从项目中移除。

内部组件：

| 内部组件 | 功能 |
| --- | --- |
| `StatusBadge` | 项目状态徽标 |
| `ProjectDetail` | 项目详情和关联事件列表 |
| `ProjectForm` | 创建/编辑项目弹窗 |

关键特性：

- `projectStore` 使用原生 IndexedDB `MemoryLibProjects`。
- 项目与事件通过 `project.eventIds` 关联。
- 删除项目会二次确认。

## 导航组件

### NavigationPanel

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/navigation/NavigationPanel.tsx` |
| 导出 | `NavigationPanel`, `NavTriggerButton` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `framer-motion`, `lucide-react` |

功能：

- 快速导航弹窗，包含页面和组件两类条目。
- 支持搜索 label 和 description。
- 支持键盘操作：ArrowUp、ArrowDown、Enter、Escape。
- 当前页面高亮。
- 点击条目后调用 `onNavigate(id)` 并关闭面板。

Props：

```ts
interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (id: string) => void;
}
```

`NavTriggerButton`：

```ts
interface NavTriggerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}
```

备注：

- Footer 显示快捷键为 `Ctrl+Shift+X`，旧文档曾提到 Cmd/Ctrl+K，当前代码以组件内显示为准。
- `NAV_ITEMS` 仍对应早期 App View、Projects、Cold Start、Canvas、Components 视图。

## 聊天组件

### Chatbot

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/chatbot/Chatbot.tsx` |
| 导出 | `Chatbot` |
| 当前状态 | `MainLayout` 使用，当前主入口使用的是 `ChatbotPanel` |
| 主要依赖 | `chatStore`, `eventStore`, `framer-motion` |

功能：

- 右下角浮动聊天按钮和聊天窗口。
- 支持最小化、新建会话、关闭。
- 支持将事件卡片拖入聊天窗口，形成 attached events。
- 发送消息时调用 `chatStore.sendMessage(input, attachedEventIds, attachedEvents)`。
- 消息内容支持轻量 Markdown 渲染：
  - `##`
  - `###`
  - `**bold**`
  - `- list`
  - `1. numbered`
- 显示事件 attachment 标签和时间戳。

与 `ChatbotPanel` 的区别：

| 项 | Chatbot | ChatbotPanel |
| --- | --- | --- |
| 展示方式 | 右下角浮动窗 | 右侧滑入全高面板 |
| 事件依赖 | 依赖 `eventStore`，支持拖入事件 | 不依赖 `eventStore` |
| 页面上下文 | 不携带 `pageContextStore` | 发送时携带当前页面上下文 |
| 当前入口 | `MainLayout` | `App.tsx` |

## 认证组件

### LoginPage

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/auth/LoginPage.tsx` |
| 导出 | `LoginPage` |
| 当前状态 | 可复用，当前 `App.tsx` 使用内联 `AuthScreen` |
| 主要依赖 | `User`, `framer-motion`, `lucide-react` |

功能：

- 邮箱密码登录页 UI。
- 支持密码可见性切换。
- 支持 Remember me 本地状态。
- 有加载状态和错误提示。
- 第三方登录按钮为禁用占位。
- 当前实现使用模拟登录，邮箱包含 `@` 且密码长度至少 6 即通过。
- 登录成功后构造 `User` 并调用 `onLogin(user)`。

Props：

```ts
interface LoginPageProps {
  onLogin: (user: User) => void;
}
```

## UI 基础组件

### Select

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ui/select.tsx` |
| 导出 | `Select`, `SelectProps`, `SelectOption` |
| 当前状态 | `ColdStart`、`FilterToolbar` 使用 |
| 主要依赖 | `@radix-ui/react-dropdown-menu`, `lucide-react` |

功能：

- 基于 Radix Dropdown Menu 的单选下拉组件。
- 展示当前选项 label 或 placeholder。
- 选中项显示 Check 图标。
- 支持 disabled、className 覆盖。

Props：

```ts
export interface SelectProps {
  value?: string;
  onChange?: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}
```

维护提示：

- `frontend/package.json` 当前没有列出 `@radix-ui/react-dropdown-menu`，若构建报缺依赖，需要补依赖或替换实现。

### RangeSlider

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ui/slider.tsx` |
| 导出 | `RangeSlider`, `RangeSliderProps` |
| 当前状态 | `FilterToolbar` 使用 |
| 主要依赖 | `cn` |

功能：

- 双端范围滑块。
- 通过 pointer events 拖动 start/end thumb。
- 自动限制两个 thumb 至少保留 5% 间距。
- 支持 hover 时显示格式化 label。

Props：

```ts
export interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (val: number) => string;
  className?: string;
}
```

### ThemeProvider 和 useTheme

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ui/theme-provider.tsx` |
| 导出 | `ThemeProvider`, `useTheme` |
| 当前状态 | 可复用，当前 `main.tsx` 未包裹 |
| 主要依赖 | React context, localStorage |

功能：

- 维护 `light`、`dark`、`system` 三种主题。
- 将主题写入 `localStorage`。
- 根据主题在 `document.documentElement` 上切换 `light`/`dark` class。
- `system` 模式读取 `prefers-color-scheme`。

维护提示：

- `ModeToggle` 使用 `useTheme`，因此挂载 `ModeToggle` 的树必须被 `ThemeProvider` 包裹。当前 `main.tsx` 没有包裹，若直接使用 `MainLayout` 需要补上。

### ModeToggle

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ui/mode-toggle.tsx` |
| 导出 | `ModeToggle` |
| 当前状态 | `MainLayout` 使用 |
| 主要依赖 | `useTheme`, `lucide-react` |

功能：

- 明暗主题切换按钮。
- light 时点击切到 dark，其他情况点击切到 light。
- 用 Sun/Moon 图标通过 Tailwind dark class 做视觉切换。

### MemoryReflectionAction

| 项 | 内容 |
| --- | --- |
| 文件 | `frontend/src/components/ui/MemoryReflectionAction.tsx` |
| 导出 | `MemoryReflectionAction` |
| 当前状态 | 可复用，当前主入口未直接挂载 |
| 主要依赖 | `framer-motion`, `lucide-react`, `cn` |

功能：

- 左下角浮动 Memory Reflection 操作入口。
- 点击展开任务菜单。
- 支持点击外部关闭。
- 内置四种任务：
  - Color Diary
  - Event Logic
  - Decision Making
  - Emotion Healing

备注：

- 当前任务按钮没有绑定业务回调，属于 UI action launcher 原型。

## Store 与数据依赖

### eventStore

| 文件 | `frontend/src/stores/eventStore.ts` |
| --- | --- |
| 主要职责 | 管理事件列表、选中事件、导入导出、同步 Memory Core |

核心能力：

- `loadEvents()`：从 Dexie `db.events` 加载事件，并按 `startSec` 排序。
- `selectEvent(id)`：设置选中事件。
- `updateEvent(id, changes)`：更新事件并刷新列表。
- `importTimeline(timeline, filename)`：清空旧事件，导入 JSON timeline。
- `importFromVideoAnalysis(events)`：将视频分析结果转换为 timeline。
- `exportData()`：导出当前 events 为 `memorylib_export.json`。
- `clearEvents()`：清空 events 和 videos。
- `syncToMemoryCore()`：经 `/api/memory-core/api/v1/timeline/import` 同步到 memory-core。

主要消费者：

- `EventList`
- `EventCard`
- `EventEditor`
- `DataPanel`
- `DiaryCanvas`
- `Chatbot`
- `ProjectManagement`

### chatStore

| 文件 | `frontend/src/stores/chatStore.ts` |
| --- | --- |
| 主要职责 | 管理聊天会话、消息、AI 请求、Memory Core 流式对话 |

核心能力：

- 原生 IndexedDB `MemoryLibChat` 持久化会话。
- `createSession(projectId?)`
- `loadSessions()`
- `sendMessage(content, attachedEventIds?, events?, context?)`
- 默认请求 `/api/chat/completions`。
- 开启 `localStorage.memoryCoreRag=1` 时，请求 `/api/memory-core/api/v1/chat/stream`。
- AI 返回 `appliedActions` 时调用 `pageContextStore.triggerRefresh()`。
- 内置 120 秒请求超时。

主要消费者：

- `ChatbotPanel`
- `Chatbot`

### pageContextStore

| 文件 | `frontend/src/stores/pageContextStore.ts` |
| --- | --- |
| 主要职责 | 向聊天助手暴露当前页面上下文，并承接 AI action 后的刷新触发 |

上下文类型：

- `history`
- `conceptGraph`

主要消费者：

- `App.tsx` 中的 `MemoryLibHistory`
- `ConceptGraphView`
- `ChatbotPanel`
- `chatStore`

### canvasStore

| 文件 | `frontend/src/stores/canvasStore.ts` |
| --- | --- |
| 主要职责 | 管理日记画布 entry、元素、选中状态、缩放和层级 |

核心能力：

- `createNewEntry(title, canvasSize?)`
- `addElement(element)`
- `updateElement(id, changes)`
- `removeElement(id)`
- `selectElement(id)`
- `setZoom(zoom)`，范围限制为 0.1 到 3。
- `bringToFront(id)`
- `sendToBack(id)`
- `duplicateElement(id)`
- `exportAsImage()` 当前返回 `null`，尚未实现。

主要消费者：

- `DiaryCanvas`
- `CanvasToolbar`
- `TaskCanvas`

### projectStore

| 文件 | `frontend/src/stores/projectStore.ts` |
| --- | --- |
| 主要职责 | 管理项目列表和项目事件关系 |

核心能力：

- 使用原生 IndexedDB `MemoryLibProjects`。
- `loadProjects()`
- `createProject(name, description?)`
- `updateProject(id, changes)`
- `deleteProject(id)`
- `addEventToProject(projectId, eventId)`
- `removeEventFromProject(projectId, eventId)`
- `getProjectEvents(projectId)`

主要消费者：

- `ProjectManagement`

### uiStore

| 文件 | `frontend/src/stores/uiStore.ts` |
| --- | --- |
| 主要职责 | 管理旧工作台的用户、冷启动、面板和通知状态 |

核心能力：

- 登录/退出的 UI state。
- 冷启动完成状态。
- 左右面板宽度。
- `panelZoomLevel`、`panelLayout`、`panelFilter`。
- 通知添加、标记已读、清空。
- 通过 Zustand persist 保存部分字段到 `memorylib-ui-storage`。

主要消费者：

- `MainLayout`
- `DataPanel`

### Dexie 数据库

| 文件 | `frontend/src/db/index.ts` |
| --- | --- |
| 数据库名 | `MemoryLibDB` |

表结构：

| 表 | 索引 | 内容 |
| --- | --- | --- |
| `events` | `id, videoId, eventIndex, *tags` | 导入后的扩展事件 |
| `videos` | `id, filename, importedAt` | 视频元数据 |
| `tags` | `id, name` | 标签 |

## 类型模型

### 事件类型

| 文件 | `frontend/src/types/event.ts` |
| --- | --- |

主要类型：

- `MediaItem`
- `Event`
- `Timeline`
- `EventExtended`
- `VideoMeta`
- `Project`
- `ChatMessage`
- `ChatSession`

注意：

- 原始导入事件使用 snake_case 字段，例如 `start_sec`、`start_hms`。
- 前端 store 转换后使用 camelCase 字段，例如 `startSec`、`startHms`。
- `EventNodeCard` 的 `MemoryLibEvent` 独立定义，仍保留 snake_case 风格，用于 `/api/memorylibs/:id` 返回数据。

### 画布类型

| 文件 | `frontend/src/types/canvas.ts` |
| --- | --- |

主要类型：

- `CanvasElementType`
- `Position`
- `CanvasElement`
- `ElementStyle`
- `DiaryEntry`

### 全局 UI 类型

| 文件 | `frontend/src/types/global.ts` |
| --- | --- |

主要类型：

- `ColdStartConfig`
- `IndexType`
- `User`
- `UserPreferences`
- `ZoomLevel`
- `LayoutType`
- `PanelFilter`
- `TaskType`
- `ActivePanel`
- `Notification`
- `DragItem`
- `DropZone`

## 导出入口

当前存在的 barrel 文件：

| 文件 | 导出内容 |
| --- | --- |
| `components/auth/index.ts` | `LoginPage` |
| `components/canvas/index.ts` | `DiaryCanvas`, `CanvasToolbar`, `ElementSidebar` |
| `components/chatbot/index.ts` | `Chatbot` |
| `components/layout/index.ts` | `MainLayout`, `DataPanel`, `TaskCanvas`, `ColdStart`, `FilterToolbar`, `ProjectHistoryList`, `ProjectHistoryCard`, `TimelineCoordinateView` |
| `components/navigation/index.ts` | `NavigationPanel`, `NavTriggerButton` |
| `components/projects/index.ts` | `ProjectManagement` |

未通过 barrel 文件统一导出的当前主流程组件：

- `ConceptGraphView`
- `EventNodeCard`
- `EventEditorPopup`
- `ChatbotPanel`

如果后续要形成真正的组件库，可以考虑补一个 `components/index.ts` 统一导出。

## 当前入口与历史组件关系

| 组件/流程 | 当前 `App.tsx` 是否使用 | 说明 |
| --- | --- | --- |
| 内联 `AuthScreen` | 是 | 当前实际登录/注册 UI |
| 内联 `MemoryLibHistory` | 是 | 当前实际 History 页 |
| `ConceptGraphView` | 是 | 当前 MemoryLib 详情页 |
| `ChatbotPanel` | 是 | 当前右侧聊天面板 |
| `LoginPage` | 否 | 可复用认证页，模拟登录 |
| `MainLayout` | 否 | 旧工作台主布局 |
| `DataPanel` | 间接否 | 由 `MainLayout` 使用 |
| `TaskCanvas` | 间接否 | 由 `MainLayout` 使用 |
| `DiaryCanvas` | 间接否 | 由 `TaskCanvas` 使用 |
| `Chatbot` | 间接否 | 由 `MainLayout` 使用 |
| `ProjectManagement` | 否 | 独立项目管理界面 |
| `NavigationPanel` | 否 | 旧多视图快速导航 |



## 非 Web 目录说明

仓库中的 `Mobile/` 和 `Glass/` 是 Android/Kotlin 示例工程，包含 Activities、ViewModel、DataBeans 等，不属于本 React 前端组件库。旧 `doc/DEVELOPMENT.md` 中有移动端和眼镜端说明，可作为多端文档参考，但本文档只整理 Web 前端组件。
