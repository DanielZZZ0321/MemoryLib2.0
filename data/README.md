# 页面构建配置文件说明

## page-config.json

每次读取此文件生成页面。修改配置后刷新页面即可看到更新。

### 结构说明

| 字段 | 说明 |
|------|------|
| `version` | 配置版本 |
| `title` | 页面标题 |
| `viewBox` | SVG 画布尺寸 (width, height) |
| `conceptGraph` | 概念组织模板数据 |
| `quadrant` | 象限坐标模板数据 |
| `memoryLibs` | MemoryLib 历史卡片 |
| `wavyPathAmplitude` | 关键词连线波浪幅度 |

### conceptGraph（概念组织）

- **conceptOrder**: 关键词连接顺序（用于绘制波浪线）
- **concepts**: 关键词列表
  - `id`: 唯一标识
  - `label`: 显示文字
  - `x`, `y`: 二维位置（viewBox 坐标）
  - **photos**: 关联的事件/照片
    - `checker`: 是否有棋盘格样式
    - `src`: 源文件地址（图片路径）
    - `title`: 事件标题
- **dates**: 日期节点
  - `label`: 日期文字
  - `x`, `y`: 位置
  - `linkTo`: 关联的关键词 id
  - `sourceFile`: 源文件地址（可选）

### quadrant（象限坐标）

- **timeline**: 时间轴刻度
- **events**: 事件列表
  - `time`: 0–1，横向位置比例
  - `category`: "working" | "resting"
  - `highlight`: 是否高亮
  - `sourceFile`: 源文件地址（可选）

### memoryLibs

- `sourceFile`: 源文件地址（可选）

### 源文件地址

- **src**: 图片路径，如 `/assets/photos/xxx.jpg`
- **sourceFile**: 事件/数据 JSON 路径，如 `/data/events/xxx.json`
