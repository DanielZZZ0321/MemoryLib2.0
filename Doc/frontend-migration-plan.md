# MemoryLib2.0 前端组件与交互迁移计划

本文档用于指导把 `feature/frontend-backend` 分支中较完整的前端组件与交互流程，分阶段迁移到 `main` 分支现有的 `MemoryLib2.0/client` 与 `MemoryLib2.0/server` 架构中。

## 参考资料

- 完整需求文档：`Doc/Development Document/DevelopmentDocument.html`
- 低保真原型图片：`Doc/Development Document/images/*.png`
- 不完整旧版 PDF：`Doc/Development Document (2).pdf`，仅作补充参考
- 现有主线前端：`MemoryLib2.0/client`
- 现有主线后端：`MemoryLib2.0/server`
- 待迁移参考实现：`feature/frontend-backend` 分支的顶层 `frontend/`、`backend/`、`data/`

## 最终需求理解

完整 HTML 文档定义的核心体验不是单个页面，而是由三个共享元素体系组成的主界面：

- Data Organization Panel：负责冷启动、数据组织、可视化、搜索、CRUD、事件编辑、review 和给任务画布准备原始材料。
- Task Canvas：负责承载最终记忆任务产物，MVP 只要求多模态日记模板。
- Chatbot Agent：负责低认知负担的控制入口，可理解当前页面上下文，并能操作 panel 与 canvas。

三个部分的事件、图片、视频、音频、笔记等元素应当共享。用户可以把元素跨 panel、canvas、chatbot 拖动，虽然同一元素在不同区域的视觉形态可以不同。

## 从 HTML 与图片确认的功能需求

### MemoryLib 管理入口

`image2.png` 展示了 MemoryLib History 入口：按年份分组的 MemoryLib 卡片，卡片包含标题、日期范围、标签和主题颜色，并有 New MemoryLib 入口。

这个入口适合作为 `main` 当前首页的升级方向，但不应替代后端真实数据结构。它应打开一个 MemoryLib/workspace 的主工作界面。

### 冷启动

`image7.png` 展示三步冷启动：

- 选择时间范围与时间粒度：Hourly、Daily、Weekly、Monthly。
- 选择 primary index：Color、Time、People、Emotion、Event、Workflow、Custom。
- 选择 secondary index：同类选项，允许默认或 N/A。

前端需要收集：

```ts
{
  start_time: Date;
  end_time: Date;
  granularity: "hourly" | "daily" | "weekly" | "monthly";
  purpose: string;
  index: string[];
}
```

文档评论提醒：第一层、第二层也许都可以 default，不一定叫 N/A。这个命名需要后续确认。

### Organization Panel 初始界面

`image8.png` 与 `image3.png` 展示初始组织界面：

- 顶部 toolbar 包含 Primary Element、Secondary Element、Time Period、Setting。
- Setting 打开后包含 Classification Fineness、Memory Display Count、Key Words 开关、Renew。
- 用户确认后重新生成布局。文档评论指出，重新排列可能不适合实时触发，需要一个确认按钮。
- 主体可以是语义图、气泡图、时间坐标图等固定模板。
- MVP 可先固定布局，不要求用户手动重排事件。

`image9.png` 是当前非常早期的点位原型，后续实现应替换为真实主照片与关键词 layout。

### Layout 与 Zoom

文档要求 MVP 支持三层 zoom-in / zoom-out：

- 第一层：冷启动后的初始 organization panel。
- 第二层：点击某个元素后查看该元素相关的更多事件，例如 `image6.png` 中 Sports 展开为 Running、Badminton、Volleyball 等子簇。
- 第三层：事件编辑界面。

旧 PDF 中把关键词 zoom-in 到时间线形式标为 optional。完整 HTML 中要求三层结构，但连续缩放、动态布局编辑属于 advanced goals。

### 事件编辑

`image10.png` 展示从 Sports 聚合进入事件列表/编辑的界面。需求要点：

- 事件编辑需要模块化，按 modality 分类。
- 固定模块：标题、关键照片、事件 summary。
- 可增减模块：视频、音频。
- 还需要支持 notes、原始多模态数据等扩展模块。
- Server 备注明确写了：事件编辑界面需要变成新界面，而非新加图层。

因此迁移时不应直接把 `feature/frontend-backend` 的 `EventEditorPopup` 作为最终交互。它可以提供字段、视觉和 media 分组参考，但最终应落成路由页或独立编辑页面。

### Canvas

`image5.png` 展示 Memory Reflection / task launcher，包含 Color Diary、Event Logic、Decision Making、Emotion Healing。

`image4.png` 展示 Event Logic 模板画布，右侧像一个文档/流程图模板，支持把事件或元素放入节点。

用户已明确要求：Canvas 用 `main` 中已有的新版本自动排布能力，旧版本 canvas 不需要复用。当前 `main` 的自动排布核心在 `MemoryLib2.0/client/src/pages/GeneralReviewPage.tsx`，使用 `react-force-graph-2d` 对 keyword/event 图谱进行自动布局，并已接入 `/api/keywords/graph`、`/api/events`、缩略图渲染与事件跳转。

因此迁移策略不是从零新建 Canvas，也不是复用 `feature/frontend-backend` 中的旧 `DiaryCanvas/react-konva`，而是：

- 以 `main` 的 `GeneralReviewPage` 自动排布图谱为新版 organization/canvas 编排底座。
- 从 `feature/frontend-backend` 迁移更完整的视觉组织、toolbar、zoom layer、事件卡片和交互流程。
- 在这个底座上补任务入口，例如 `MemoryReflectionLauncher`。
- 在后续任务画布中增加 `MultimodalDiaryTemplate`、`EventLogicTemplate` 和 drop zone。
- 统一 shared element payload，用于 panel、canvas、chatbot 之间拖拽。

MVP 先实现多模态日记模板，其他任务可作为后续扩展。

### Chatbot

文档要求 Chatbot 是控制入口：

- 能理解当前打开页面的 context。
- 能做事件总结。
- 能接收从 panel 拖入的事件。
- advanced goals 包含事件搜索、从 chatbot drag out 事件到 panel/canvas、canvas agent、panel agent。

`image11.png` 展示后端视频问答/细节挖掘能力已经有命令行验证：定位事件、基于全局视频和局部视频做细节挖掘、多视频共用 memory context、人脸/人物 tracking 等仍在测试。

`main` 当前 `/api/chat` 是 SSE 流式接口，`feature/frontend-backend` 的 `ChatbotPanel` 使用 `/api/chat/completions` 非流式接口。迁移时要保留 `main` 的流式能力，并把 page context、event attachment、后续 tool/action 机制接上。

### 后端与部署

文档提到 Express backend，云端计划是腾讯云 VM，而非 Cloud Run。迁移计划当前只覆盖本地工程结构和接口适配，不直接处理部署。

后端相关明确需求：

- Chatbot aware of 当前打开页面的 context。
- 事件编辑应是新页面。
- 需要任务 canvas 模板。
- 后端需要 logging function，记录每次数据传输 log。
- 需要明确前端布局生成需要从后端接收什么数据；模板可以固定，例如 layout 和每个模块多少 events。

## 迁移原则

- 不直接 merge `feature/frontend-backend` 整个分支。
- 以 `main` 的 `MemoryLib2.0/client` 和 `MemoryLib2.0/server` 为目标架构。
- 优先迁移组件思想与交互，而不是照搬旧数据模型。
- `feature/frontend-backend/backend` 中的 JSON 文件型 MemoryLib 接口只作参考，不作为主数据源。
- `main` 已有的事件、模块、上传、关键词图谱、workspace、chat 能力应尽量保留。
- Figma/HTML 图是低保真原型，表达信息架构和交互意图，不要求 1:1 视觉复刻。

## 组件迁移矩阵

| 来源组件/模块 | 迁移策略 | 目标 |
| --- | --- | --- |
| `ProjectHistoryCard`, `ProjectHistoryList` | 部分复用 | 作为 MemoryLib History 入口基础，接真实 workspace / MemoryLib 数据 |
| `ColdStart` | 部分复用/重写 | 接入冷启动配置，字段对齐完整 HTML |
| `FilterToolbar` | 部分复用 | 作为 organization panel 顶部 toolbar，补确认式 Renew |
| `ConceptGraphView` | 部分复用 | 改造为 organization panel 的语义图/关键词图，而非 JSON 文件 MemoryLib |
| `EventNodeCard` | 部分复用 | 事件节点用主照片、摘要、标签展示 |
| `EventEditorPopup` | 不直接复用弹窗 | 抽取字段和 media 分组思想，落到新事件编辑页面 |
| `ChatbotPanel` | 重点复用并适配 | 改接 `main` 流式 chat API，支持 page context 和 event attachment |
| `chatStore` | 部分复用 | 保留 session 和消息管理，改 API 层 |
| `pageContextStore` | 复用并扩展 | 覆盖 history、panel、zoom layer、event editor、canvas |
| `GeneralReviewPage` 中的 `react-force-graph-2d` 图谱 | 作为新版 Canvas/Panel 底座 | main 已有自动排布能力，应继续扩展 |
| `DiaryCanvas`, `CanvasToolbar`, `ElementSidebar`, `canvasStore` | 不复用 | 这是 feature 分支旧 Canvas，不符合新版本方向 |
| `MainLayout`, `DataPanel`, `TaskCanvas` | 只作参考 | 旧三栏工作台思路可参考，但不整体迁 |
| `ProjectManagement` | 暂缓 | 后续映射到 `main` 的 `/api/workspaces` |
| `LoginPage` | 暂缓 | 当前为模拟登录，不可直接替换真实认证 |

## 分阶段执行计划

### Phase 0：迁移基线与保护现场

目标：建立安全迁移环境。

- 从 `main` 创建迁移分支。
- 记录当前未提交改动，避免覆盖用户改动。
- 保留 `Doc/Development Document/` 作为需求来源。
- 不切换工作树到 `feature/frontend-backend`，用 `git show` 或按文件 cherry-pick 读取。

验收：

- 有独立迁移分支。
- 当前工作树改动被明确区分：用户已有改动、迁移新增改动、临时文件。

### Phase 1：MemoryLib History 与主工作界面入口

目标：把当前 `main` 首页从简单导航升级为 MemoryLib 管理入口。

- 引入或重建 `ProjectHistoryCard` / `ProjectHistoryList`。
- 设计 `MemoryLibHistoryPage`。
- 卡片点击进入某个 MemoryLib/workspace 的 organization panel。
- 保留 `/review`、`/workspace`、`/admin`，但降低为导航入口或调试入口。
- 新增 `pageContextStore`，让 Chatbot 知道当前在 history 页面。

验收：

- 首页显示按年份组织的 MemoryLib 卡片。
- 点击卡片能进入主工作界面。
- Chatbot 能获得 history context。

### Phase 2：Cold Start 与 Organization Toolbar

目标：实现完整 HTML 中的冷启动与 toolbar 基础。

- 新建或改造 `ColdStartWizard`。
- 字段包含时间范围、时间粒度、目的、primary index、secondary index。
- 新建 `OrganizationToolbar`，包含 Primary Element、Secondary Element、Time Period、Setting、Renew。
- Renew 使用确认触发，而不是每次调整实时重排。
- 后端先可将 cold start config 存入 workspace/filter criteria；长期是否独立建表待确认。

验收：

- 新 MemoryLib 或空 workspace 会先进入 cold start。
- 完成后进入 organization panel。
- 修改 toolbar 后点击 Renew 可触发布局刷新。

### Phase 3：Organization Panel 第一层与第二层

目标：实现以真实事件/关键词为基础的数据组织面板。

- 改造 `ConceptGraphView` / `conceptLayout` 为 `OrganizationGraph`。
- 第一层支持 1-9 个关键词，重点优化 3-9 个关键词的自动布局。
- 事件节点用主照片替代占位小球。
- 关键词节点用可读 label 替代蓝色小球。
- 支持布局 autosave。
- 支持点击关键词进入第二层详情，例如 Sports 展开到 Running、Badminton、Volleyball。

后端适配：

- 优先复用 `main` 的 `/api/events`、`/api/keywords/graph`。
- 如现有 API 不足，新增 layout-specific API，而不是迁入 `feature` 的 `/api/page-config` JSON 文件模型。

验收：

- Panel 第一层能根据 primary index 展示图或时间坐标模板。
- 点击关键词可进入第二层。
- 布局刷新与 autosave 可用。

### Phase 4：事件编辑新页面

目标：把事件编辑从简易表单升级为模块化编辑页面。

- 基于 `main` 当前 `EventEditPage` 重构。
- 不采用 overlay 作为最终形态。
- 固定模块：标题、关键照片、summary。
- 可增减模块：video、audio、notes、raw media。
- 保留 `main` 的 event module 数据结构，使用 `event_module` 承载多模态模块。
- 支持从 organization panel 第三层进入，也支持从现有事件列表进入。

验收：

- 编辑事件是新页面。
- 能保存事件基本信息。
- 能保存至少一种 media module。
- 返回 organization panel 后能刷新对应节点展示。

### Phase 5：Chatbot Context 与 Panel 控制

目标：让 Chatbot 成为跨界面控制入口。

- 迁移并适配 `ChatbotPanel`。
- 保留 `main` `/api/chat` 的 SSE 流式体验。
- `pageContextStore` 扩展为 history、organization layer1、organization layer2、event editor、canvas。
- Chatbot 支持事件总结。
- 支持 panel 中事件拖入 Chatbot，形成 attachment。
- 后续再做 Chatbot action：搜索事件、触发 renew、打开事件、更新布局。

验收：

- Chatbot 能知道当前页面和选中 MemoryLib/keyword/event。
- 从 panel 拖入事件后，发送消息包含事件上下文。
- Chatbot 响应仍为流式输出。

### Phase 6：基于 main 自动排布的新版 Canvas MVP

目标：以 `main` 当前自动排布图谱为基础扩展新版 Canvas/任务界面，而不是复用旧 DiaryCanvas，也不是另起一套独立画布引擎。

- 梳理 `GeneralReviewPage` 中的 force graph 自动排布逻辑，抽成可复用的 `AutoLayoutGraph` 或 `OrganizationCanvas`。
- 保留 `/api/keywords/graph`、`/api/events` 的真实数据来源。
- 新建 `MemoryReflectionLauncher`，包含 Color Diary、Event Logic、Decision Making、Emotion Healing。
- MVP 只落地多模态日记模板。
- 支持从 organization panel 拖入事件、照片、视频、音频、notes。
- 每个 drop zone 明确接受的元素类型。
- 初期可使用固定模板，不做自由画布引擎。

验收：

- 能在 main 的自动排布图谱基础上打开任务 Canvas。
- 能从 panel/图谱拖事件到 Canvas。
- Canvas 中能生成多模态日记草稿结构。
- Canvas 状态可保存和恢复。

### Phase 7：跨组件 Drag and Drop 协议

目标：统一 panel、canvas、chatbot 之间的元素交换格式。

建议共享 payload：

```ts
type SharedMemoryElement =
  | { kind: "event"; eventId: string; title: string; summary?: string; thumbnailUrl?: string }
  | { kind: "media"; mediaId: string; eventId?: string; mediaType: "image" | "video" | "audio"; url: string }
  | { kind: "note"; noteId: string; eventId?: string; content: string }
  | { kind: "keyword"; keyword: string; sourceIndex: string };
```

验收：

- 同一事件可在 panel、canvas、chatbot 中用不同视觉形态显示。
- 拖动失败有明确 UI 状态。
- 类型不匹配时不会静默丢失。

### Phase 8：Project Management、Login 与高级能力

目标：补齐完整文档中的非 MVP 或平台能力。

- Project Management 映射到 `main` 的 `/api/workspaces`。
- Basic login 需要确认真实认证方案后再做。
- Advanced panel：连续 zoom、动态 layout 编辑。
- Advanced chatbot：事件搜索、从 Chatbot drag out、panel agent、canvas agent。
- 后端 logging：记录布局生成、数据同步、chat action、event save。
- Glasses 打点能力独立规划。

验收：

- Project/workspace 管理与主工作界面互通。
- Login 不再是 mock。
- 后端关键数据流有日志。

## 需要避免的路径

- 不把 `feature/frontend-backend` 顶层 `frontend/` 整体复制进 `MemoryLib2.0/client`。
- 不把 `feature/frontend-backend/backend` 的 JSON 文件 MemoryLib 服务作为主后端。
- 不把旧 `DiaryCanvas/react-konva` 作为新 Canvas 基础；新版 Canvas 以 `main` 的自动排布图谱能力为底座。
- 不把事件编辑继续做成只在图层上的 popup。
- 不让 toolbar 每个细节变化都实时重排，Renew 应有用户确认。

## 待澄清问题

1. MemoryLib History 是否作为正式首页，还是作为 `/workspace` 内的一个管理页？
2. 冷启动和 layout 配置应存在哪里：workspace 的 `filter_criteria`、新表，还是文件型配置？
3. primary/secondary index 的默认值是否使用 `default`，还是保留 `N/A`？
4. 自动布局支持范围应统一为 1-9 个关键词，还是严格按 3-9 个关键词？
5. 事件编辑页面的 media module 保存粒度：每个视频/音频一个 module，还是每种 modality 一个 module？
6. Canvas 产物保存在哪里：workspace、event module、还是独立 task/canvas 数据结构？

## 建议下一步

先执行 Phase 0 和 Phase 1。它们风险最低，可以快速把迁移从“组件堆叠”变成“真实产品入口”。完成后再进入 Phase 2/3，把完整 HTML 中最核心的 organization panel 跑通。
