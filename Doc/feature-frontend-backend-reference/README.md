# feature/frontend-backend 参考代码索引

本目录由脚本从 `feature/frontend-backend` 分支提取，用于在 `codex/frontend-migration-phase-1` 迁移过程中阅读参考。**不要直接修改本目录下的文件**，所有改动应写入 `MemoryLib2.0/client` 和 `MemoryLib2.0/server`。

提取时间：2026-04-25

## 目录结构

```
Doc/feature-frontend-backend-reference/
├── doc/                           # feature 分支的开发文档
│   ├── DEVELOPMENT.md             # 开发指南
│   ├── FRONTEND_COMPONENTS.md     # 前端组件文档
│   ├── dependency.md              # 依赖说明
│   └── 用户交互全流程设计.md       # 用户交互流程
├── frontend/                      # feature/frontend-backend 的 frontend/src
│   ├── App.tsx                    # 路由入口
│   ├── index.css                  # 全局样式
│   ├── components/
│   │   ├── ConceptGraphView.tsx   # 概念图（重点参考）
│   │   ├── EventEditorPopup.tsx   # 事件编辑弹窗（字段参考，不直接复用）
│   │   ├── EventNodeCard.tsx      # 事件节点卡片（重点参考）
│   │   ├── layout/
│   │   │   ├── ColdStart.tsx              # 冷启动向导（重点参考）
│   │   │   ├── DataPanel.tsx              # 数据面板
│   │   │   ├── FilterToolbar.tsx          # 过滤工具栏（重点参考）
│   │   │   ├── MainLayout.tsx             # 三栏主布局（参考信息架构）
│   │   │   ├── ProjectHistoryCard.tsx     # MemoryLib 卡片（重点参考）
│   │   │   ├── ProjectHistoryList.tsx     # MemoryLib 列表（重点参考）
│   │   │   ├── TaskCanvas.tsx             # 任务画布容器（参考）
│   │   │   └── TimelineCoordinateView.tsx # 时间线视图（参考）
│   │   ├── chatbot/
│   │   │   ├── Chatbot.tsx        # Chatbot 入口（重点参考）
│   │   │   └── ChatbotPanel.tsx   # Chatbot 面板（重点参考，需改接流式 API）
│   │   ├── canvas/
│   │   │   ├── DiaryCanvas.tsx    # 旧 Diary Canvas（不复用，仅参考结构）
│   │   │   ├── CanvasToolbar.tsx  # Canvas 工具栏（参考）
│   │   │   └── ElementSidebar.tsx # 元素侧边栏（参考）
│   │   ├── events/
│   │   │   ├── EventCard.tsx      # 事件卡片
│   │   │   ├── EventEditor.tsx    # 事件编辑器（字段参考）
│   │   │   ├── EventList.tsx      # 事件列表
│   │   │   ├── JSONUploader.tsx   # JSON 上传
│   │   │   └── MemoryNode.tsx     # Memory 节点
│   │   ├── auth/
│   │   │   └── LoginPage.tsx      # 登录页（暂缓）
│   │   ├── projects/
│   │   │   └── ProjectManagement.tsx # 项目管理（暂缓）
│   │   ├── navigation/
│   │   │   └── NavigationPanel.tsx
│   │   └── ui/
│   │       └── MemoryReflectionAction.tsx # Memory Reflection 入口（重点参考）
│   ├── stores/
│   │   ├── chatStore.ts           # 聊天状态（重点参考）
│   │   ├── pageContextStore.ts    # 页面上下文（重点参考）
│   │   ├── eventStore.ts          # 事件状态
│   │   ├── canvasStore.ts         # 画布状态（不复用，参考结构）
│   │   ├── projectStore.ts        # 项目状态
│   │   └── uiStore.ts             # UI 状态
│   ├── types/
│   │   ├── event.ts               # 事件类型（重点参考）
│   │   ├── canvas.ts              # Canvas 类型（参考）
│   │   └── global.ts              # 全局类型
│   └── lib/
│       ├── conceptLayout.ts       # 概念图布局算法（重点参考）
│       └── utils.ts               # 工具函数
└── backend/                       # feature/frontend-backend 的 backend/src
    ├── index.ts                   # Express 入口
    ├── routes/
    │   ├── events.ts              # 事件路由（参考 API 设计）
    │   ├── eventsGlobal.ts        # 全局事件路由
    │   ├── chat.ts                # 聊天路由（非流式，参考字段）
    │   ├── memorylib.ts           # MemoryLib 路由（参考）
    │   ├── pageConfig.ts          # 页面配置路由（JSON 文件型，不直接复用）
    │   ├── cards.ts               # 卡片路由
    │   └── video.ts               # 视频路由
    ├── services/
    │   ├── memorylibService.ts    # MemoryLib 服务
    │   ├── videoIngestService.ts  # 视频导入服务
    │   └── dataServerClient.ts    # 数据服务客户端
    ├── types/
    │   └── index.ts               # 后端类型定义
    └── db/
        └── database.ts            # 数据库连接

## 迁移优先级

| 优先级 | 文件 | 对应 Phase |
|--------|------|------------|
| 🔴 高 | `ProjectHistoryCard.tsx`, `ProjectHistoryList.tsx` | Phase 1 |
| 🔴 高 | `pageContextStore.ts` | Phase 1 |
| 🔴 高 | `ColdStart.tsx`, `FilterToolbar.tsx` | Phase 2 |
| 🔴 高 | `ConceptGraphView.tsx`, `conceptLayout.ts` | Phase 3 |
| 🔴 高 | `ChatbotPanel.tsx`, `chatStore.ts` | Phase 5 |
| 🟡 中 | `EventEditorPopup.tsx`, `EventEditor.tsx` | Phase 4 |
| 🟡 中 | `MemoryReflectionAction.tsx` | Phase 6 |
| 🟡 中 | `EventNodeCard.tsx`, `EventCard.tsx` | Phase 3 |
| 🟢 低 | `DiaryCanvas.tsx`, `CanvasToolbar.tsx`, `canvasStore.ts` | 不复用 |
| 🟢 低 | `LoginPage.tsx`, `ProjectManagement.tsx` | Phase 8 |
