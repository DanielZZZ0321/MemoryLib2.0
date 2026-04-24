# MemoryLib 2.0 寮€鍙戞枃妗?
## 椤圭洰姒傝堪

MemoryLib 2.0 鏄竴涓绔蹇嗙鐞嗗簲鐢紝鍖呭惈 Web 鍓嶇銆佸悗绔湇鍔°€丄ndroid 鎵嬫満绔拰 AR 鐪奸暅绔洓涓儴鍒嗐€?
## 鎶€鏈爤

### 鍓嶇 (Frontend)
- **妗嗘灦**: React 18 + TypeScript
- **鏋勫缓宸ュ叿**: Vite 5
- **鏍峰紡**: TailwindCSS + Framer Motion
- **鐘舵€佺鐞?*: Zustand
- **鏁版嵁瀛樺偍**: Dexie (IndexedDB)
- **鐢诲竷娓叉煋**: React Konva
- **鎷栨嫿**: @dnd-kit
- **鍥捐〃**: @xyflow/react

### 鍚庣 (Backend)
- **妗嗘灦**: Express.js + TypeScript
- **鏁版嵁搴?*: PostgreSQL (pg)
- **璁よ瘉**: JWT (jsonwebtoken) + bcryptjs
- **鏂囦欢涓婁紶**: Multer
- **AI闆嗘垚**: @anthropic-ai/sdk

### 绉诲姩绔?(Mobile - Android)
- **璇█**: Kotlin
- **UI妗嗘灦**: Jetpack Compose
- **鏋舵瀯**: MVVM (ViewModel)

### 鐪奸暅绔?(Glass - Android)
- **璇█**: Kotlin
- **UI妗嗘灦**: Jetpack Compose
- **鐗规€?*: 鎵嬪娍浜や簰銆佹寜閿簨浠跺鐞?
---

## 鐩綍缁撴瀯

```
MemoryLib2.0/
鈹溾攢鈹€ frontend/           # Web 鍓嶇
鈹溾攢鈹€ backend/            # Node.js 鍚庣
鈹溾攢鈹€ Mobile/             # Android 鎵嬫満搴旂敤
鈹溾攢鈹€ Glass/              # Android AR 鐪奸暅搴旂敤
鈹溾攢鈹€ Server Functions/   # 鏈嶅姟绔嚱鏁?鈹斺攢鈹€ doc/               # 寮€鍙戞枃妗?```

---

## 鍓嶇缁勪欢鏂囨。

### 鏍稿績椤甸潰缁勪欢

#### App.tsx
涓诲簲鐢ㄥ叆鍙ｏ紝鍖呭惈浜斾釜涓昏瑙嗗浘鍒囨崲锛?- **App View**: 浜嬩欢鍒楄〃瑙嗗浘
- **Projects**: 椤圭洰绠＄悊鐣岄潰
- **Cold Start**: 鍐峰惎鍔ㄩ厤缃悜瀵?- **Canvas**: 鐢诲竷缂栬緫鍣?- **Components**: 缁勪欢灞曠ず

鍏ㄥ眬缁勪欢:
- **Chatbot**: 娴姩鑱婂ぉ鏈哄櫒浜猴紙濮嬬粓鍙锛?- **EventEditor**: 浜嬩欢缂栬緫寮圭獥

璺緞: `frontend/src/App.tsx`

---

### Events 浜嬩欢缁勪欢

#### EventList
**璺緞**: `frontend/src/components/events/EventList.tsx`

**鍔熻兘**:
- 灞曠ず浜嬩欢鍗＄墖缃戞牸鍒楄〃
- 鏃犱簨浠舵椂鏄剧ず JSON 涓婁紶缁勪欢
- 鍝嶅簲寮忓竷灞€ (1-4鍒?

**渚濊禆**: EventCard, JSONUploader, eventStore

---

#### EventCard
**璺緞**: `frontend/src/components/events/EventCard.tsx`

**鍔熻兘**:
- 灞曠ず鍗曚釜浜嬩欢鍗＄墖
- 鏀寔鎷栨嫿鍒扮敾甯?- 鏄剧ず濯掍綋鍐呭锛堝浘鐗?瑙嗛锛?- 鏄剧ず鏍囩銆佹椂闂淬€佹憳瑕?
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
**璺緞**: `frontend/src/components/events/EventEditor.tsx`

**鍔熻兘**: 浜嬩欢缂栬緫寮圭獥锛屽厑璁哥敤鎴蜂慨鏀逛簨浠舵爣棰樸€佹憳瑕併€佹爣绛剧瓑

---

#### JSONUploader
**璺緞**: `frontend/src/components/events/JSONUploader.tsx`

**鍔熻兘**: JSON 鏂囦欢涓婁紶缁勪欢锛屾敮鎸佸鍏ユ椂闂磋酱鏁版嵁

---

#### MemoryNode
**璺緞**: `frontend/src/components/events/MemoryNode.tsx`

**鍔熻兘**: 璁板繂鑺傜偣缁勪欢锛岀敤浜庡浘瑙嗗浘涓睍绀轰簨浠跺叧绯?
**鍙樹綋**:
- `pill`: 鑳跺泭褰㈢姸
- `detail`: 璇︽儏鍗＄墖
- `image-cluster`: 鍥剧墖闆嗙兢

---

### Canvas 鐢诲竷缁勪欢

#### DiaryCanvas
**璺緞**: `frontend/src/components/canvas/DiaryCanvas.tsx`

**鍔熻兘**:
- 鍩轰簬 Konva 鐨勭敾甯冪紪杈戝櫒
- 鏀寔娣诲姞鏂囨湰銆佷簨浠跺崱鐗囥€佸浘鐗?- 鎷栨嫿鍜屽彉鎹㈠厓绱?- 缂╂斁鍔熻兘

**涓昏鍔熻兘**:
- `addTextElement()`: 娣诲姞鏂囨湰鍏冪礌
- `addEventCard()`: 娣诲姞浜嬩欢鍗＄墖
- `handleDrop()`: 澶勭悊鎷栨斁浜嬩欢

---

#### CanvasToolbar
**璺緞**: `frontend/src/components/canvas/CanvasToolbar.tsx`

**鍔熻兘**: 鐢诲竷宸ュ叿鏍忥紝鎻愪緵缂╂斁銆佹坊鍔犲厓绱犵瓑鎿嶄綔

---

#### ElementSidebar
**璺緞**: `frontend/src/components/canvas/ElementSidebar.tsx`

**鍔熻兘**: 宸︿晶鍏冪礌闈㈡澘锛屾樉绀哄彲鎷栨嫿鐨勪簨浠跺垪琛?
---

### Layout 甯冨眬缁勪欢

#### ColdStart
**璺緞**: `frontend/src/components/layout/ColdStart.tsx`

**鍔熻兘**: 鍐峰惎鍔ㄩ厤缃悜瀵硷紝寮曞鐢ㄦ埛璁剧疆锛?1. **鏃堕棿鑼冨洿**: 閫夋嫨璁板繂鐨勮捣姝㈡棩鏈?2. **绮掑害**: 鏃?鍛?鏈?3. **鐩殑**: 璁板繂鍥為【/鏃ヨ/骞荤伅鐗?鍙嶆€?4. **绱㈠紩**: 涓?娆＄储寮曞瓧娈?
**鐘舵€佺鐞?*:
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
**璺緞**: `frontend/src/components/layout/FilterToolbar.tsx`

**鍔熻兘**: 绛涢€夊伐鍏锋爮锛屾彁渚涙椂闂淬€佹爣绛剧瓑绛涢€夋潯浠?
---

#### TimelineCoordinateView
**璺緞**: `frontend/src/components/layout/TimelineCoordinateView.tsx`

**鍔熻兘**: 鏃堕棿杞村潗鏍囪鍥撅紝鍙鍖栧睍绀轰簨浠舵椂闂寸嚎

---

#### ProjectHistoryList
**璺緞**: `frontend/src/components/layout/ProjectHistoryList.tsx`

**鍔熻兘**: 椤圭洰鍘嗗彶鍒楄〃锛屽睍绀虹敤鎴风殑椤圭洰璁板綍

---

#### ProjectHistoryCard
**璺緞**: `frontend/src/components/layout/ProjectHistoryCard.tsx`

**鍔熻兘**: 椤圭洰鍘嗗彶鍗＄墖锛屾樉绀哄崟涓」鐩俊鎭?
---

#### MainLayout
**璺緞**: `frontend/src/components/layout/MainLayout.tsx`

**鍔熻兘**: 涓诲竷灞€缁勪欢锛屽疄鐜颁笁鏍忕粨鏋勶細
- **宸︿晶**: DataPanel (鏁版嵁缁勭粐闈㈡澘)
- **涓棿**: TaskCanvas (浠诲姟鐢诲竷)
- **鍙充晶**: Chatbot (娴姩AI鍔╂墜)

**鐗规€?*:
- 鍙皟鏁村乏渚ч潰鏉垮搴?- 闈㈡澘灞曞紑/鏀惰捣鍒囨崲
- 鍝嶅簲寮忚璁?
**Props**:
```typescript
interface MainLayoutProps {
  onLogout?: () => void;
}
```

---

#### DataPanel
**璺緞**: `frontend/src/components/layout/DataPanel.tsx`

**鍔熻兘**: 鏁版嵁缁勭粐闈㈡澘锛屽疄鐜颁笁灞傜缉鏀剧粨鏋勶細
1. **Level 1 (姒傝灞?**: 鏄剧ず浜嬩欢绫诲埆/鏍囩鐨勫浘褰㈠寲瑙嗗浘
2. **Level 2 (璇︽儏灞?**: 鏄剧ず鐗瑰畾绫诲埆涓嬬殑浜嬩欢鍒楄〃
3. **Level 3 (缂栬緫灞?**: 浜嬩欢缂栬緫鐣岄潰

**瑙嗗浘妯″紡**:
- `graph`: 鍥惧舰瑙嗗浘 (姘旀场甯冨眬)
- `grid`: 缃戞牸瑙嗗浘 (2鍒楀崱鐗?
- `list`: 鍒楄〃瑙嗗浘 (鍗曞垪)

**鐗规€?*:
- 浜嬩欢鎼滅储杩囨护
- 浜嬩欢鎷栨嫿鏀寔
- 缂╂斁灞傜骇瀵艰埅

---

#### TaskCanvas
**璺緞**: `frontend/src/components/layout/TaskCanvas.tsx`

**鍔熻兘**: 浠诲姟鐢诲竷鍏ュ彛缁勪欢

**鐗规€?*:
- 浠诲姟妯℃澘閫夋嫨 (鏃ヨ/鍙嶆€?骞荤伅鐗?鑷畾涔?
- 闆嗘垚 DiaryCanvas 缁勪欢
- 绌虹姸鎬佸紩瀵?
---

### UI 缁勪欢

#### MemoryReflectionAction
**璺緞**: `frontend/src/components/ui/MemoryReflectionAction.tsx`

**鍔熻兘**: 璁板繂鍙嶆€濇搷浣滈潰鏉?
---

#### ModeToggle
**璺緞**: `frontend/src/components/ui/mode-toggle.tsx`

**鍔熻兘**: 鏄庢殫涓婚鍒囨崲鎸夐挳

---

#### theme-provider
**璺緞**: `frontend/src/components/ui/theme-provider.tsx`

**鍔熻兘**: 涓婚涓婁笅鏂囨彁渚涜€?
---

#### Select
**璺緞**: `frontend/src/components/ui/select.tsx`

**鍔熻兘**: 涓嬫媺閫夋嫨缁勪欢

---

#### Slider
**璺緞**: `frontend/src/components/ui/slider.tsx`

**鍔熻兘**: 婊戝姩鏉＄粍浠?
---

### Projects 椤圭洰缁勪欢

#### ProjectManagement
**璺緞**: `frontend/src/components/projects/ProjectManagement.tsx`

**鍔熻兘**:
- 椤圭洰绠＄悊涓荤晫闈?- 宸︿晶椤圭洰鍒楄〃锛堟敮鎸佹悳绱€佺姸鎬佺瓫閫夛級
- 鍙充晶椤圭洰璇︽儏瑙嗗浘
- 鍒涘缓/缂栬緫/鍒犻櫎椤圭洰

**鐘舵€佺鐞?*: `projectStore`

**鐗规€?*:
- 椤圭洰鐘舵€? active / archived / completed
- 浜嬩欢鍏宠仈绠＄悊
- 椤圭洰鏃堕暱缁熻
- IndexedDB 鎸佷箙鍖?
**Props**: 鏃狅紙鑷寘鍚粍浠讹級

---

### Navigation 瀵艰埅缁勪欢

#### NavigationPanel
**璺緞**: `frontend/src/components/navigation/NavigationPanel.tsx`

**鍔熻兘**:
- 蹇€熷鑸潰鏉匡紙椤堕儴鎸夐挳瑙﹀彂锛?- 鎼滅储椤甸潰鍜岀粍浠?- 閿洏瀵艰埅鏀寔锛堚啈鈫撱€丒nter銆丒sc锛?- Cmd/Ctrl + K 蹇嵎閿墦寮€

**鐗规€?*:
- 褰撳墠椤甸潰楂樹寒鏄剧ず
- 鍒嗙被灞曠ず锛堥〉闈?/ 缁勪欢锛?- 妯＄硦鎼滅储

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
**璺緞**: `frontend/src/components/navigation/NavigationPanel.tsx`

**鍔熻兘**: 瀵艰埅鎸夐挳锛屾樉绀哄湪 Header 涓?
---

### Chatbot 鑱婂ぉ缁勪欢

#### Chatbot
**璺緞**: `frontend/src/components/chatbot/Chatbot.tsx`

**鍔熻兘**:
- AI 鑱婂ぉ鏈哄櫒浜虹粍浠?- 娴姩闈㈡澘锛屽彲鏈€灏忓寲
- 浜嬩欢鎷栨嫿鏀寔
- 娑堟伅鍘嗗彶璁板綍

**鐘舵€佺鐞?*: `chatStore`

**鐗规€?*:
- 浜嬩欢鎽樿鐢熸垚锛圡ock AI锛?- 妯″紡鍒嗘瀽
- Markdown 鏍煎紡鏀寔
- 澶氫簨浠朵笂涓嬫枃
- 鎵撳瓧鍔ㄧ敾鏁堟灉

**浜や簰**:
- 浠?Panel 鎷栨嫿浜嬩欢鍒?Chatbot
- 鎸?Enter 鍙戦€佹秷鎭?- Shift+Enter 鎹㈣

---

### Auth 璁よ瘉缁勪欢

#### LoginPage
**璺緞**: `frontend/src/components/auth/LoginPage.tsx`

**鍔熻兘**:
- 鐢ㄦ埛鐧诲綍椤甸潰
- 閭/瀵嗙爜璁よ瘉
- 绗笁鏂圭櫥褰曞崰浣嶏紙Google, GitHub, WeChat锛?- 璁颁綇鎴戦€夐」
- 鍔犺浇鐘舵€佸拰閿欒鎻愮ず

**鐘舵€佺鐞?*: `uiStore`

**Props**:
```typescript
interface LoginPageProps {
  onLogin: (user: User) => void;
}
```

**娴佺▼**:
1. 鐢ㄦ埛杈撳叆閭鍜屽瘑鐮?2. 鐐瑰嚮鐧诲綍鎸夐挳
3. 楠岃瘉閫氳繃鍚庤皟鐢?`onLogin` 鍥炶皟
4. UI Store 鏇存柊璁よ瘉鐘舵€?
---

---

## 鐘舵€佺鐞?(Stores)

### eventStore
**璺緞**: `frontend/src/stores/eventStore.ts`

**鐘舵€?*:
```typescript
interface EventState {
  events: EventExtended[];
  selectedEventId: string | null;
}
```

**鏂规硶**:
| 鏂规硶 | 鎻忚堪 |
|------|------|
| `loadEvents()` | 浠?IndexedDB 鍔犺浇浜嬩欢 |
| `selectEvent(id)` | 閫夋嫨浜嬩欢 |
| `updateEvent(id, changes)` | 鏇存柊浜嬩欢 |
| `importTimeline(timeline, filename)` | 瀵煎叆鏃堕棿杞?JSON |
| `exportData()` | 瀵煎嚭鏁版嵁涓?JSON |
| `clearEvents()` | 娓呴櫎鎵€鏈変簨浠?|

---

### canvasStore
**璺緞**: `frontend/src/stores/canvasStore.ts`

**鍔熻兘**: 鐢诲竷鐘舵€佺鐞嗭紝鍖呭惈鍏冪礌浣嶇疆銆佺缉鏀俱€侀€変腑鐘舵€佺瓑

---

### projectStore
**璺緞**: `frontend/src/stores/projectStore.ts`

**鐘舵€?*:
```typescript
interface ProjectState {
  projects: Project[];
  selectedProjectId: string | null;
  isLoading: boolean;
}
```

**鏂规硶**:
| 鏂规硶 | 鎻忚堪 |
|------|------|
| `loadProjects()` | 鍔犺浇鎵€鏈夐」鐩?|
| `createProject(name, description)` | 鍒涘缓鏂伴」鐩?|
| `updateProject(id, changes)` | 鏇存柊椤圭洰 |
| `deleteProject(id)` | 鍒犻櫎椤圭洰 |
| `addEventToProject(projectId, eventId)` | 娣诲姞浜嬩欢鍒伴」鐩?|
| `removeEventFromProject(projectId, eventId)` | 浠庨」鐩Щ闄や簨浠?|
| `getProjectEvents(projectId)` | 鑾峰彇椤圭洰鐨勪簨浠跺垪琛?|

---

### chatStore
**璺緞**: `frontend/src/stores/chatStore.ts`

**鐘舵€?*:
```typescript
interface ChatState {
  sessions: ChatSession[];
  currentSessionId: string | null;
  isLoading: boolean;
  isTyping: boolean;
}
```

**鏂规硶**:
| 鏂规硶 | 鎻忚堪 |
|------|------|
| `createSession(projectId?)` | 鍒涘缓鏂颁細璇?|
| `setCurrentSession(id)` | 璁剧疆褰撳墠浼氳瘽 |
| `addMessage(sessionId, message)` | 娣诲姞娑堟伅 |
| `sendMessage(content, attachedEventIds, events)` | 鍙戦€佹秷鎭苟鑾峰彇 AI 鍥炲 |
| `deleteSession(id)` | 鍒犻櫎浼氳瘽 |
| `clearCurrentSession()` | 娓呯┖褰撳墠浼氳瘽 |

---

### uiStore
**璺緞**: `frontend/src/stores/uiStore.ts`

**鍔熻兘**: UI 鐘舵€佺鐞嗭紙璁よ瘉銆佷富棰樸€侀潰鏉跨姸鎬佺瓑锛?
**鐘舵€?*:
```typescript
interface UIState {
  // 璁よ瘉鐘舵€?  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;

  // 鍐峰惎鍔?  coldStartCompleted: boolean;
  coldStartConfig: ColdStartConfig | null;

  // UI 鐘舵€?  activePanel: ActivePanel;
  sidebarCollapsed: boolean;
  rightPanelWidth: number;
  leftPanelWidth: number;

  // 闈㈡澘鐘舵€?  panelZoomLevel: ZoomLevel;  // 1 | 2 | 3
  panelLayout: LayoutType;    // 'graph' | 'timeline' | 'grid' | 'list'
  panelFilter: PanelFilter;

  // 閫氱煡
  notifications: Notification[];
}
```

**鏂规硶**:
| 鏂规硶 | 鎻忚堪 |
|------|------|
| `login(user)` | 鐧诲綍鐢ㄦ埛 |
| `logout()` | 鐧诲嚭鐢ㄦ埛 |
| `completeColdStart(config)` | 瀹屾垚鍐峰惎鍔ㄩ厤缃?|
| `resetColdStart()` | 閲嶇疆鍐峰惎鍔ㄧ姸鎬?|
| `setActivePanel(panel)` | 璁剧疆娲诲姩闈㈡澘 |
| `toggleSidebar()` | 鍒囨崲渚ц竟鏍?|
| `setPanelZoomLevel(level)` | 璁剧疆闈㈡澘缂╂斁灞傜骇 |
| `setPanelLayout(layout)` | 璁剧疆闈㈡澘甯冨眬妯″紡 |
| `setPanelFilter(filter)` | 璁剧疆闈㈡澘杩囨护鍣?|

---

## 鏁版嵁绫诲瀷 (Types)

### Global 绫诲瀷
**璺緞**: `frontend/src/types/global.ts`

```typescript
// 鍐峰惎鍔ㄩ厤缃?interface ColdStartConfig {
  startTime: Date | null;
  endTime: Date | null;
  granularity: 'daily' | 'weekly' | 'monthly' | 'event';
  purpose: 'review' | 'diary' | 'project' | 'reflection' | 'custom';
  primaryIndex: IndexType;
  secondaryIndex?: IndexType;
}

// 绱㈠紩绫诲瀷
type IndexType = 'time' | 'event_type' | 'emotion' | 'person' | 'location' | 'keyword';

// 鐢ㄦ埛
interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  coldStartCompleted: boolean;
}

// 闈㈡澘鐘舵€?type ZoomLevel = 1 | 2 | 3;
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

### Event 绫诲瀷
**璺緞**: `frontend/src/types/event.ts`

```typescript
// 濯掍綋椤?interface MediaItem {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  timestamp?: string;
  caption?: string;
  duration?: number;
}

// 鍘熷浜嬩欢
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
  // ... 鍏朵粬瀛楁
}

// 鎵╁睍浜嬩欢
interface EventExtended extends Event {
  id: string;
  videoId: string;
  userTitle: string | null;
  userSummary: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

// 椤圭洰
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

// 鑱婂ぉ娑堟伅
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachedEventIds?: string[];
}

// 鑱婂ぉ浼氳瘽
interface ChatSession {
  id: string;
  projectId: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
```

---

### Canvas 绫诲瀷
**璺緞**: `frontend/src/types/canvas.ts`

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

## 鏁版嵁搴?(Database)

### MemoryLibDB
**璺緞**: `frontend/src/db/index.ts`

浣跨敤 Dexie.js 灏佽 IndexedDB锛?
```typescript
class MemoryLibDB extends Dexie {
  events!: Table<EventExtended>;
  videos!: Table<VideoMeta>;
  tags!: Table<Tag>;
}
```

**琛ㄧ粨鏋?*:
| 琛ㄥ悕 | 绱㈠紩 | 鎻忚堪 |
|------|------|------|
| events | id, videoId, eventIndex, *tags | 浜嬩欢鏁版嵁 |
| videos | id, filename, importedAt | 瑙嗛鍏冩暟鎹?|
| tags | id, name | 鏍囩 |

---

## 鍚庣 API 鏂囨。

### 鍩虹璺敱

#### GET /health
鍋ュ悍妫€鏌?
**鍝嶅簲**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

#### GET /api
API 淇℃伅

**鍝嶅簲**:
```json
{
  "message": "MemoryLib API"
}
```

---

## 绉诲姩绔粍浠?(Mobile - Android)

### Activities

#### MainActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/main/MainActivity.kt`

**鍔熻兘**:
- 搴旂敤鍏ュ彛
- 钃濈墮鏉冮檺璇锋眰
- 钃濈墮鐘舵€佹鏌?
**鐘舵€?*:
- `PERMISSION_REQUIRED`: 闇€瑕佹潈闄?- `BLUETOOTH_DISABLED`: 钃濈墮鏈紑鍚?- `BLUETOOTH_READY`: 钃濈墮灏辩华

---

#### BluetoothInitActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/bluetoothConnection/BluetoothInitActivity.kt`

**鍔熻兘**: 钃濈墮杩炴帴鍒濆鍖栧拰璁惧閰嶅

---

#### AudioUsageActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/audio/AudioUsageActivity.kt`

**鍔熻兘**: 闊抽鍔熻兘婕旂ず

---

#### CustomViewActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/customView/CustomViewActivity.kt`

**鍔熻兘**: 鑷畾涔夎鍥炬紨绀?
---

#### DeviceInformationActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/deviceInformation/DeviceInformationActivity.kt`

**鍔熻兘**: 璁惧淇℃伅灞曠ず

---

#### CustomProtocolActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/customProtocol/CustomProtocolActivity.kt`

**鍔熻兘**: 鑷畾涔夊崗璁€氫俊

---

#### UsageSelectionActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/usageSelection/UsageSelectionActivity.kt`

**鍔熻兘**: 鐢ㄤ緥閫夋嫨鐣岄潰

---

#### TTSAndNotificationActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/ttsAndNotification/TTSAndNotificationActivity.kt`

**鍔熻兘**: TTS 璇煶鍜岄€氱煡鍔熻兘

---

#### AISceneActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/useAIScene/AISceneActivity.kt`

**鍔熻兘**: AI 鍦烘櫙婕旂ず

---

#### PictureActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/picture/PictureActivity.kt`

**鍔熻兘**: 鍥剧墖鎷嶆憚鍜屾祻瑙?
---

#### TeleprompterSceneActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/useTeleprompter/TeleprompterSceneActivity.kt`

**鍔熻兘**: 鎻愯瘝鍣ㄥ満鏅?
---

#### VideoActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/video/VideoActivity.kt`

**鍔熻兘**: 瑙嗛褰曞埗鍜屾挱鏀?
---

#### MediaFileActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/mediaFile/MediaFileActivity.kt`

**鍔熻兘**: 濯掍綋鏂囦欢绠＄悊

---

#### TranslationSceneActivity
**璺緞**: `Mobile/CXRMSamples/.../activities/useTranslation/TranslationSceneActivity.kt`

**鍔熻兘**: 缈昏瘧鍦烘櫙

---

### DataBeans (鏁版嵁妯″瀷)

#### UsageType
**璺緞**: `Mobile/CXRMSamples/.../dataBeans/UsageType.kt`

**鍔熻兘**: 鐢ㄤ緥绫诲瀷鏋氫妇

---

#### SelfView 鏁版嵁妯″瀷
**璺緞**: `Mobile/CXRMSamples/.../dataBeans/selfView/`

鍖呭惈:
- `SelfViewJson`: 鑷畾涔夎鍥?JSON 瑙ｆ瀽
- `TextViewProps`: 鏂囨湰瑙嗗浘灞炴€?- `ImageViewProps`: 鍥剧墖瑙嗗浘灞炴€?- `LinearLayoutProps`: 绾挎€у竷灞€灞炴€?- `RelativeLayoutProps`: 鐩稿甯冨眬灞炴€?
---

## 鐪奸暅绔粍浠?(Glass - Android)

### Activities

#### MainActivity
**璺緞**: `Glass/CXRSSDKSamples/.../activities/main/MainActivity.kt`

**鍔熻兘**:
- 鐪奸暅绔叆鍙?- 鏀寔鎵嬪娍瀵艰埅锛堝墠婊?鍚庢粦锛?- 鎸夐敭浜嬩欢澶勭悊

**鎵嬪娍鏄犲皠**:
- 鍙抽敭 + 涓嬮敭 = 鍓嶆粦 鈫?杩涘叆 SelfCMD
- 宸﹂敭 + 涓婇敭 = 鍚庢粦 鈫?杩涘叆 Keys

---

#### SelfCMDActivity
**璺緞**: `Glass/CXRSSDKSamples/.../activities/selfCMD/SelfCMDActivity.kt`

**鍔熻兘**: 鑷畾涔夊懡浠ゆ紨绀?
---

#### KeysActivity
**璺緞**: `Glass/CXRSSDKSamples/.../activities/keys/KeysActivity.kt`

**鍔熻兘**: 鎸夐敭浜嬩欢婕旂ず

---

#### AudioRecordActivity
**璺緞**: `Glass/CXRSSDKSamples/.../activities/audioRecord/AudioRecordActivity.kt`

**鍔熻兘**: 闊抽褰曞埗

---

#### VideoRecordActivity
**璺緞**: `Glass/CXRSSDKSamples/.../activities/videoRecord/VideoRecordActivity.kt`

**鍔熻兘**: 瑙嗛褰曞埗

---

## 杩愯鎸囧崡

### 鍓嶇
```bash
cd MemoryLib2.0/frontend
npm install
npm run dev
```

### 鍚庣
```bash
cd MemoryLib2.0/backend
npm install
npm run dev
```

### Android 搴旂敤
浣跨敤 Android Studio 鎵撳紑 `Mobile/CXRMSamples` 鎴?`Glass/CXRSSDKSamples` 鐩綍銆?
---

## 鏇存柊鏃ュ織

| 鏃ユ湡 | 鏇存柊鍐呭 |
|------|----------|
| 2026-03-13 | 鏂板 NavigationPanel 蹇€熷鑸潰鏉?(Cmd+K) |
| 2026-03-13 | 瀹屾垚鐢ㄦ埛浜や簰鍏ㄦ祦绋嬫牳蹇冪粍浠?|
| 2026-03-13 | 鏂板 MainLayout 涓夋爮甯冨眬 |
| 2026-03-13 | 鏂板 DataPanel 鏁版嵁缁勭粐闈㈡澘 (涓夊眰缂╂斁) |
| 2026-03-13 | 鏂板 TaskCanvas 浠诲姟鐢诲竷鍏ュ彛 |
| 2026-03-13 | 鏂板 LoginPage 鐧诲綍椤甸潰 |
| 2026-03-13 | 瀹屽杽 uiStore 鐘舵€佺鐞?|
| 2026-03-13 | 鏂板 global.ts 绫诲瀷瀹氫箟 |
| 2026-03-13 | 瀹屾垚 Chatbot 缁勪欢鍜?ProjectManagement 鐣岄潰 |
| 2026-03-13 | 鏂板 projectStore, chatStore 鐘舵€佺鐞?|
| 2026-03-13 | EventCard 鏀寔鎷栨嫿鍒?Chatbot |
| 2026-03-13 | 鏇存柊寮€鍙戞枃妗ｏ紝瀹屽杽缁勪欢璇存槑 |
| 2024-03-13 | 鍒濆鏂囨。鍒涘缓 |

---

## 璐＄尞鎸囧崡

1. 鏂板缁勪欢鏃惰鏇存柊姝ゆ枃妗?2. 閬靛惊鐜版湁浠ｇ爜椋庢牸
3. 浣跨敤 TypeScript 绫诲瀷瀹氫箟
4. 缁勪欢鍛藉悕閲囩敤 PascalCase
