# MemoryLib2.0 技术栈与依赖

## 前端技术栈

### 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |

### 样式与动画
| 技术 | 版本 | 用途 |
|------|------|------|
| TailwindCSS | 3.x | 样式框架 |
| Framer Motion | 11.x | 动画库（缩放、弹窗、过渡动效） |

### 状态管理
| 技术 | 版本 | 用途 |
|------|------|------|
| Zustand | 4.x | 轻量状态管理（跨组件状态共享） |
| React Query | 5.x | 服务端状态管理、缓存 |

### 可视化与图形
| 技术 | 版本 | 用途 |
|------|------|------|
| d3-force | 3.x | 力导向布局（气泡网络图） |
| React Flow | 11.x | 事件网络图、流程编辑器 |
| Konva.js | 9.x | Canvas 画布（多模态日记编辑） |

### 交互组件
| 技术 | 版本 | 用途 |
|------|------|------|
| dnd-kit | 6.x | 拖拽功能（跨组件元素拖拽） |
| react-zoom-pan-pinch | 3.x | 缩放功能（三层 zoom） |
| react-photo-album | 2.x | 照片网格展示 |
| yet-another-react-lightbox | 4.x | 图片预览灯箱 |

### UI 组件库
| 技术 | 版本 | 用途 |
|------|------|------|
| Radix UI | - | 无样式组件基础（下拉菜单、弹窗等） |
| Lucide React | - | 图标库 |

---

## 后端技术栈

### 核心框架
| 技术 | 版本 | 用途 |
|------|------|------|
| Express.js | 4.x | Web 框架 |
| TypeScript | 5.x | 类型安全 |

### 数据库
| 技术 | 版本 | 用途 |
|------|------|------|
| PostgreSQL | 15.x | 主数据库（关系型 + JSONB 文档存储） |
| Redis | 7.x | 缓存、会话管理（可选，后期再加） |

> **架构简化说明**：初期统一使用 PostgreSQL。JSONB 类型足以处理多模态记忆数据，支持复杂查询和 GIN 索引。避免双数据库的运维复杂度和跨库事务问题。待数据量增长遇到瓶颈时，再考虑拆分 MongoDB。

### 云服务（腾讯云）
| 服务 | 用途 |
|------|------|
| 云服务器 CVM | 应用部署 |
| 对象存储 COS | 图片、视频存储 |

### AI 服务
| 服务 | 用途 |
|------|------|
| Claude API | 事件摘要、智能搜索 |
| OpenAI Whisper | 语音转文字 |

---

## package.json 示例

### 前端 (package.json)

```json
{
  "name": "memorylib-frontend",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "zustand": "^4.5.0",
    "@tanstack/react-query": "^5.17.0",
    "framer-motion": "^11.0.0",
    "d3-force": "^3.0.0",
    "@xyflow/react": "^12.0.0",
    "react-konva": "^18.2.0",
    "@dnd-kit/core": "^6.1.0",
    "@dnd-kit/sortable": "^8.0.0",
    "react-zoom-pan-pinch": "^3.4.0",
    "react-photo-album": "^2.3.0",
    "yet-another-react-lightbox": "^4.1.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "@radix-ui/react-dialog": "^1.0.0",
    "lucide-react": "^0.312.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/d3-force": "^3.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

### 后端 (package.json)

```json
{
  "name": "memorylib-backend",
  "version": "0.1.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.0",
    "pg": "^8.11.0",
    "@anthropic-ai/sdk": "^0.27.0",
    "multer": "^1.4.5-lts.1",
    "jsonwebtoken": "^9.0.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    "@types/multer": "^1.4.0",
    "@types/jsonwebtoken": "^9.0.0",
    "@types/bcryptjs": "^2.4.0",
    "@types/node": "^20.0.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 技术选型理由

### 为什么选择 React Flow + d3-force？

Figma 原型中的气泡网络图（Page 8, 14）和事件逻辑编辑器（Page 10）需要：
- 力导向布局自动排列节点
- 可拖拽节点重新定位
- 连线显示事件关系
- 缩放和平移浏览大型网络

React Flow 提供开箱即用的节点/边管理，d3-force 提供物理模拟布局。

### 为什么选择 Zustand？

三大组件（Panel、Canvas、Chatbot）需要共享拖拽元素状态：
- 比 Redux 更轻量，无需 action/reducer 样板代码
- 支持 TypeScript，类型推断友好
- 适合中小型应用的复杂状态管理

### 为什么选择 Konva.js？

Canvas 日记编辑需要：
- 拖拽照片、文字元素
- 自由绘制和标注
- 导出为图片
- 支持撤销/重做

Konva 提供声明式 API，与 React 集成良好。

---

## 开发环境配置

### 前端
```bash
cd frontend
npm install
npm run dev
```

### 后端
```bash
cd backend
npm install
npm run dev
```

### 环境变量 (.env)
```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/memorylib

# 服务
PORT=4000

# 腾讯云
TENCENT_SECRET_ID=xxx
TENCENT_SECRET_KEY=xxx
COS_BUCKET=memorylib-xxx

# AI
ANTHROPIC_API_KEY=xxx
```

---

## 架构演进路线

### Phase 1: 单库架构（当前）
- PostgreSQL 作为唯一数据存储
- JSONB 存储多模态记忆数据
- 应用层缓存（内存/文件）

### Phase 2: 性能优化（用户量 > 1000）
- 引入 Redis 做缓存和会话管理
- 添加数据库读写分离

### Phase 3: 规模化（如有必要）
- 单表 JSONB 超过 500 万条且查询变慢时，考虑拆分 MongoDB
- 或使用 PostgreSQL 分区表