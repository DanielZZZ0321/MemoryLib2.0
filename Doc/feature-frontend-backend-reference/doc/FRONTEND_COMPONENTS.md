# MemoryLib 2.0 鍓嶇缁勪欢鏂囨。

鏈枃妗ｅ熀浜庡綋鍓嶅垎鏀唬鐮佹暣鐞嗭紝涓昏瑕嗙洊 `frontend/src/components` 涓嬬殑 React + TypeScript 缁勪欢锛屼互鍙婂畠浠緷璧栫殑 store銆佺被鍨嬪拰鏁版嵁娴併€?
## 缁勪欢搴撴瑙?
褰撳墠鍓嶇鏈変袱濂楀苟瀛樼殑缁勪欢褰㈡€侊細

1. 褰撳墠涓诲叆鍙ｆ祦绋嬶細`frontend/src/App.tsx` 鐩存帴鎵胯浇鐧诲綍銆丮emoryLib History 鍒楄〃銆佹蹇靛浘璇︽儏椤靛拰 `ChatbotPanel`銆?2. 鏃╂湡宸ヤ綔鍙板紡缁勪欢搴擄細`MainLayout`銆乣DataPanel`銆乣DiaryCanvas`銆乣ProjectManagement`銆乣NavigationPanel` 绛変粛鍦ㄤ唬鐮佷腑淇濈暀骞跺鍑猴紝閫傚悎浣滀负鍙鐢ㄧ粍浠舵垨鍚庣画鏁村悎鍏ュ彛銆?
鎶€鏈爤涓庣粍浠剁浉鍏充緷璧栵細

| 绫诲埆 | 浣跨敤 |
| --- | --- |
| UI 妗嗘灦 | React 18, TypeScript |
| 鏍峰紡 | TailwindCSS, 鍏ㄥ眬 CSS |
| 鍔ㄦ晥 | Framer Motion |
| 鍥炬爣 | lucide-react |
| 鐘舵€佺鐞?| Zustand |
| 鏈湴瀛樺偍 | Dexie IndexedDB, 鍘熺敓 IndexedDB, localStorage |
| 鐢诲竷 | react-konva |
| 涓嬫媺鑿滃崟 | `@radix-ui/react-dropdown-menu` 琚?`Select` 浣跨敤 |

## 褰撳墠涓诲叆鍙?
### App

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/App.tsx` |
| 瀵煎嚭 | `default function App()` |
| 褰撳墠鐘舵€?| 褰撳墠 `main.tsx` 鐩存帴鎸傝浇鐨勫敮涓€鍏ュ彛 |
| 涓昏渚濊禆 | `auth.ts`, `ConceptGraphView`, `ChatbotPanel`, `pageContextStore` |

鍔熻兘锛?
- 妫€鏌ュ綋鍓嶇櫥褰曠姸鎬侊紝鏈櫥褰曟椂鏄剧ず鍐呰仈 `AuthScreen`銆?- 鐧诲綍鍚庡睍绀?MemoryLib History 鍗＄墖鍒楄〃锛屾暟鎹潵鑷?`/api/page-config`锛屽け璐ユ椂浣跨敤鍐呯疆鏍蜂緥銆?- 鐐瑰嚮 MemoryLib 鍗＄墖鍚庤繘鍏?`ConceptGraphView`銆?- 鍦?History 鍜屾蹇靛浘椤甸潰閮藉彲鎵撳紑 `ChatbotPanel`銆?- 閫氳繃 `pageContextStore` 鍛婄煡鑱婂ぉ鍔╂墜褰撳墠澶勪簬 History 椤点€?
鍏抽敭鍐呰仈缁勪欢锛?
| 缁勪欢 | 鍔熻兘 | 澶囨敞 |
| --- | --- | --- |
| `AuthScreen` | 鐧诲綍/娉ㄥ唽琛ㄥ崟锛岃皟鐢?`authApi.login/register/getMe` | 褰撳墠鍏ュ彛瀹為檯浣跨敤鐨勮璇佺晫闈紝涓嶆槸 `components/auth/LoginPage` |
| `MemoryLibHistory` | 鎸夊勾浠藉睍绀?MemoryLib 鍗＄墖锛屾敮鎸佹墦寮€鑱婂ぉ鍜岄€€鍑虹櫥褰?| 浣跨敤 `page-config` 鎴?`SAMPLE_MEMORYLIBS` |

### ConceptGraphView

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ConceptGraphView.tsx` |
| 瀵煎嚭 | `ConceptGraphView` |
| 褰撳墠鐘舵€?| 褰撳墠涓绘祦绋嬫鍦ㄤ娇鐢?|
| 涓昏渚濊禆 | `conceptLayout`, `EventNodeCard`, `EventEditorPopup`, `pageContextStore` |

鍔熻兘锛?
- 灞曠ず MemoryLib 鐨勬蹇靛浘锛屾敮鎸佷袱绉嶆ā寮忥細
  - 鏍囩妯″紡锛氭牴鎹?MemoryLib 鏍囬鍜?tags 鐢熸垚鑺傜偣銆?  - 浜嬩欢妯″紡锛氫粠 `/api/memorylibs/:id` 鍔犺浇 events 鍚庯紝鎸変簨浠剁敓鎴愯妭鐐广€?- 浣跨敤 `computeConceptLayout` 鑷姩甯冨眬锛屼娇鐢?SVG 缁樺埗鑺傜偣杩炵嚎銆?- 浜嬩欢妯″紡涓嬬敤 `foreignObject` 宓屽叆 `EventNodeCard`銆?- 鏀寔鎷栧姩鑺傜偣锛屽苟灏嗗竷灞€瑕嗙洊鍊间繚瀛樺埌 `localStorage`銆?- 鍙屽嚮浜嬩欢鑺傜偣鎵撳紑 `EventEditorPopup`銆?- 灏嗗綋鍓嶉〉闈€佷簨浠躲€佽妭鐐?ID銆佽妭鐐逛綅缃啓鍏?`pageContextStore`锛屼緵 AI 鑱婂ぉ鐞嗚В褰撳墠涓婁笅鏂囥€?- 褰?AI action 涓嚭鐜?`layout_reset` 鏃舵竻闄ゆ湰鍦板竷灞€銆?
Props锛?
```ts
interface ConceptGraphViewProps {
  entry: { id: string; title: string; tags: string[]; color: string; sourceFile?: string };
  onBack: () => void;
  onOpenChat?: () => void;
  width?: number;
  height?: number;
}
```

鍏抽敭鐗规€э細

- 鑷姩鍝嶅簲瀹瑰櫒灏哄鍙樺寲銆?- 鏀寔鏍囩鍥句笌浜嬩欢鍥剧殑鐙珛甯冨眬缂撳瓨銆?- 棰滆壊鐢?MemoryLib entry 鐨?`color` 鏄犲皠鍒?accent 鑹层€?- 褰撳墠缂栬緫淇濆瓨鍙洿鏂版湰鍦?`memoryLib` state锛屾病鏈夌洿鎺ユ寔涔呭寲鍥炲悗绔€?
### EventNodeCard

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/EventNodeCard.tsx` |
| 瀵煎嚭 | `EventNodeCard`, `MemoryLibEvent` |
| 褰撳墠鐘舵€?| `ConceptGraphView` 涓娇鐢?|
| 涓昏渚濊禆 | `lucide-react` |

鍔熻兘锛?
- 鍦ㄦ蹇靛浘涓互绱у噾鍗＄墖褰㈠紡灞曠ず鍗曚釜浜嬩欢銆?- 鍙睍绀洪涓獟浣撹祫婧愶紝鍥剧墖鐢?`img`锛岃棰戠敤闈欓煶 `video`銆?- 灞曠ず鏍囬銆佸紑濮嬫椂闂淬€佹憳瑕佸拰鏈€澶?3 涓爣绛俱€?
Props锛?
```ts
interface EventNodeCardProps {
  event: MemoryLibEvent;
  accent: string;
  isCenter?: boolean;
  onClick?: () => void;
}
```

### EventEditorPopup

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/EventEditorPopup.tsx` |
| 瀵煎嚭 | `EventEditorPopup`, `EventEditorData`, `MediaItem` |
| 褰撳墠鐘舵€?| `ConceptGraphView` 涓娇鐢?|
| 涓昏渚濊禆 | `lucide-react` |

鍔熻兘锛?
- 浜嬩欢璇︽儏寮圭獥锛屾敮鎸?`overview` 鍜?`edit` 涓ょ妯″紡銆?- 灞曠ず涓庣紪杈戞爣棰樸€佽捣姝㈡椂闂淬€佹爣绛俱€佹憳瑕併€佺瑪璁般€?- 鍒嗗尯灞曠ず瑙嗛銆侀煶棰戙€佺収鐗囥€?- 鏀寔缂栬緫 media 鐨?URL 鍜?caption銆?- 鐐瑰嚮閬僵鍏抽棴锛岀偣鍑诲脊绐楀唴閮ㄩ樆姝㈠啋娉°€?
Props锛?
```ts
interface EventEditorPopupProps {
  event: EventEditorData;
  eventIndex: number;
  accent: string;
  onClose: () => void;
  onSave?: (event: EventEditorData) => void;
}
```

鍏抽敭鐗规€э細

- `accent` 鎺у埗寮圭獥澶撮儴娓愬彉鍜岀紪杈戞€佹寜閽鑹层€?- `onSave` 鏄彲閫夊洖璋冿紝缁勪欢鏈韩涓嶇粦瀹氬悗绔繚瀛樸€?
### ChatbotPanel

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/chatbot/ChatbotPanel.tsx` |
| 瀵煎嚭 | `ChatbotPanel` |
| 褰撳墠鐘舵€?| 褰撳墠涓绘祦绋嬫鍦ㄤ娇鐢?|
| 涓昏渚濊禆 | `chatStore`, `pageContextStore`, `localStorage` |

鍔熻兘锛?
- 鍙充晶婊戝叆寮忚亰澶╅潰鏉裤€?- 浣跨敤 `chatStore` 缁存姢浼氳瘽銆佹秷鎭€佸姞杞界姸鎬併€?- 鍙戦€佹秷鎭椂鎼哄甫褰撳墠 `pageContextStore.context`锛岃鍚庣鎴?AI 鑳芥劅鐭ュ綋鍓嶉〉闈€?- 鏀寔鏂板缓瀵硅瘽銆佸叧闂潰鏉裤€佽嚜鍔ㄦ粴鍔ㄥ埌搴曢儴銆?- 鏀寔 `Memory Core RAG` 寮€鍏筹紝鐘舵€佷繚瀛樺湪 `localStorage.memoryCoreRag`銆?- 杈撳叆鏀寔 Enter 鍙戦€併€丆trl+Enter 鍙戦€併€丼hift+Enter 鎹㈣銆?
Props锛?
```ts
interface ChatbotPanelProps {
  open: boolean;
  onClose: () => void;
}
```

鍏抽敭鐗规€э細

- 闈㈡澘浣跨敤寰堥珮鐨?`z-index`锛岄伩鍏嶈鍥捐妭鐐瑰拰寮圭獥閬尅銆?- 鏈夊鐢ㄢ€滅偣鍑绘澶勫彂閫佲€濆尯鍩燂紝瑙ｅ喅閮ㄥ垎鐜鎸夐挳鐐瑰嚮涓嶇ǔ瀹氱殑闂銆?- 璇ョ粍浠朵笉渚濊禆 `eventStore`锛屽畠渚濊禆椤甸潰涓婁笅鏂囧拰鑱婂ぉ store銆?
## 浜嬩欢缁勪欢

### EventList

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/events/EventList.tsx` |
| 瀵煎嚭 | `EventList` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠 `App.tsx` 鏈洿鎺ユ寕杞?|
| 涓昏渚濊禆 | `eventStore`, `EventCard`, `JSONUploader` |

鍔熻兘锛?
- 鍔犺浇骞跺睍绀?IndexedDB 涓殑浜嬩欢銆?- 鏃犱簨浠舵椂鏄剧ず `JSONUploader`銆?- 鏈変簨浠舵椂浠ュ搷搴斿紡缃戞牸灞曠ず `EventCard`銆?- 鎻愪緵鈥滃悓姝ュ埌 Memory Core鈥濇寜閽紝璋冪敤 `eventStore.syncToMemoryCore()`銆?- 灞曠ず鍚屾涓€佸悓姝ユ垚鍔熴€佸悓姝ュけ璐ョ姸鎬併€?
### EventCard

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/events/EventCard.tsx` |
| 瀵煎嚭 | `EventCard` |
| 褰撳墠鐘舵€?| `EventList`銆乣DataPanel` 浣跨敤 |
| 涓昏渚濊禆 | `EventExtended`, `lucide-react` |

鍔熻兘锛?
- 灞曠ず鍗曚釜浜嬩欢鐨勬爣棰樸€佹椂闂淬€佹憳瑕併€佹爣绛惧拰濯掍綋澶村浘銆?- 鏀寔鍗曞獟浣撳拰澶氬獟浣撳竷灞€锛屽濯掍綋鏈€澶氬睍绀哄墠 4 涓紝瓒呰繃鏄剧ず鏁伴噺閬僵銆?- 鏀寔 HTML5 drag and drop锛屽啓鍏?`eventData`銆乣type=event-card`銆乣eventId`銆?- 鑷畾涔夋嫋鎷介瑙堛€?
Props锛?
```ts
interface EventCardProps {
  event: EventExtended;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent, event: EventExtended) => void;
}
```

### EventEditor

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/events/EventEditor.tsx` |
| 瀵煎嚭 | `EventEditor` |
| 褰撳墠鐘舵€?| `DataPanel` 浣跨敤 |
| 涓昏渚濊禆 | `eventStore`, `framer-motion` |

鍔熻兘锛?
- 鏍规嵁 `eventStore.selectedEventId` 鎵撳紑鍙充晶缂栬緫鎶藉眽銆?- 鏀寔缂栬緫 `userTitle`銆乣userSummary`銆乣notes`銆?- 灞曠ず棣栦釜濯掍綋璧勬簮锛屽浘鐗囨垨瑙嗛銆?- 淇濆瓨鏃惰皟鐢?`eventStore.updateEvent()`锛屽苟娓呯┖閫変腑浜嬩欢銆?
鍏抽敭鐗规€э細

- 鐢ㄦ埛鏍囬鍜屾憳瑕佷笌鍘熷鏍囬鎽樿鍒嗗紑淇濆瓨銆?- 浣跨敤 Framer Motion 鍋氶伄缃╁拰鎶藉眽杩涘嚭鍦哄姩鐢汇€?
### JSONUploader

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/events/JSONUploader.tsx` |
| 瀵煎嚭 | `JSONUploader` |
| 褰撳墠鐘舵€?| `EventList`銆乣DataPanel` 浣跨敤 |
| 涓昏渚濊禆 | `eventStore.importTimeline` |

鍔熻兘锛?
- 鎺ユ敹 `application/json` 鏂囦欢銆?- 璇诲彇骞惰В鏋?JSON銆?- 鍙帴鍙楁暟缁勬牸寮忥紝鏁扮粍浼氫紶缁?`importTimeline(json, file.name)`銆?- 瑙ｆ瀽澶辫触鎴栨牸寮忎笉姝ｇ‘鏃剁敤 `alert` 鎻愮ず銆?
### MemoryNode

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/events/MemoryNode.tsx` |
| 瀵煎嚭 | `MemoryNode`, `MemoryNodeProps` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `cn` |

鍔熻兘锛?
- 閫氱敤璁板繂鑺傜偣灞曠ず缁勪欢銆?- 鏀寔涓夌瑙嗚鍙樹綋锛?  - `pill`锛氳兌鍥婅妭鐐广€?  - `detail`锛氳鎯呭崱鐗囷紝鏀寔鍥剧墖銆佹棩鏈熴€佹弿杩般€?  - `image-cluster`锛氬浘鐗囬泦缇ょ缉鐣ヨ妭鐐广€?- 鏀寔閫変腑鎬佸拰鐐瑰嚮鍥炶皟銆?
Props锛?
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

## 鐢诲竷缁勪欢

### DiaryCanvas

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/canvas/DiaryCanvas.tsx` |
| 瀵煎嚭 | `DiaryCanvas` |
| 褰撳墠鐘舵€?| `TaskCanvas` 浣跨敤 |
| 涓昏渚濊禆 | `react-konva`, `canvasStore`, `eventStore`, `CanvasToolbar`, `ElementSidebar` |

鍔熻兘锛?
- 澶氭ā鎬佹棩璁扮敾甯冪紪杈戝櫒銆?- 鑻ユ病鏈夊綋鍓?entry锛屼細鑷姩鍒涘缓 `Untitled Diary`銆?- 鏍规嵁瀹瑰櫒灏哄鑷姩鏇存柊鐢诲竷灏哄銆?- 鏀寔浠庝簨浠朵晶鏍忔嫋鍏ヤ簨浠跺崱鐗囨垨濯掍綋銆?- 鏀寔娣诲姞鏂囨湰銆佹坊鍔犲浘鐗囥€佺缉鏀俱€侀€変腑銆佹嫋鍔ㄣ€佸彉鎹€?- 浣跨敤 Konva `Transformer` 绠＄悊閫変腑鍏冪礌鐨?resize/rotate銆?
鍐呴儴娓叉煋鍣細

| 鍐呴儴缁勪欢 | 鍔熻兘 |
| --- | --- |
| `CanvasElementRenderer` | 鎸夊厓绱犵被鍨嬪垎鍙戞覆鏌?|
| `EventCardRenderer` | 鍦?Konva 涓覆鏌撲簨浠跺崱鐗?|
| `ImageElement` | 鍔犺浇鍥剧墖骞舵覆鏌撲负 `KonvaImage` |
| `MediaRenderer` | 娓叉煋鐙珛鍥剧墖鍏冪礌 |

鏀寔鍏冪礌绫诲瀷锛?
```ts
type CanvasElementType = 'text' | 'image' | 'video' | 'event-card';
```

鍏抽敭闄愬埗锛?
- `video` 绫诲瀷鍦ㄧ被鍨嬩腑瀛樺湪锛屼絾褰撳墠 `DiaryCanvas` 涓昏瀹炵幇浜?text銆乮mage銆乪vent-card銆?- `CanvasToolbar` 鐨?Save 鍜?Download 鎸夐挳鐩墠涓昏鏄?UI锛屽崰浣嶈涓烘湭鎺ュ叆瀹屾暣淇濆瓨/瀵煎嚭閫昏緫銆?
### CanvasToolbar

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/canvas/CanvasToolbar.tsx` |
| 瀵煎嚭 | `CanvasToolbar` |
| 褰撳墠鐘舵€?| `DiaryCanvas` 浣跨敤 |
| 涓昏渚濊禆 | `canvasStore`, `lucide-react` |

鍔熻兘锛?
- 鎺у埗渚ф爮鏄鹃殣銆?- 娣诲姞鏂囨湰鍏冪礌銆?- 閫氳繃鏂囦欢閫夋嫨娣诲姞鍥剧墖鍏冪礌锛屽浘鐗囪浆涓?data URL 瀛樺叆 canvas element銆?- 璋冩暣缂╂斁锛屾樉绀虹櫨鍒嗘瘮銆?- 灞曠ず鏃ヨ妯℃澘鏍囬銆?- 鎻愪緵 Save 鍜?Download 鎸夐挳 UI銆?
Props锛?
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

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/canvas/ElementSidebar.tsx` |
| 瀵煎嚭 | `ElementSidebar` |
| 褰撳墠鐘舵€?| `DiaryCanvas` 浣跨敤 |
| 涓昏渚濊禆 | `EventExtended`, `framer-motion` |

鍔熻兘锛?
- 鐢诲竷宸︿晶浜嬩欢璧勬簮闈㈡澘銆?- 鎼滅储浜嬩欢鏍囬銆佹憳瑕佸拰鏍囩銆?- 鎸夊垱寤烘椂闂寸矖鍒嗕负 `today`銆乣this-week`銆乣this-month`銆乣older`銆?- 鏀寔鎶樺彔/灞曞紑鍒嗙粍銆?- 浜嬩欢鍙嫋鎷藉埌鐢诲竷锛屽獟浣撲篃鍙崟鐙嫋鎷藉埌鐢诲竷銆?- 鐐瑰嚮浜嬩欢鍙缃€変腑浜嬩欢銆?
Props锛?
```ts
interface ElementSidebarProps {
  events: EventExtended[];
  selectedEventId: string | null;
  onSelectEvent: (id: string | null) => void;
  onAddEventCard: (eventId: string) => void;
}
```

澶囨敞锛?
- `onAddEventCard` 鍦?Props 涓畾涔夛紝浣嗗綋鍓嶇粍浠跺唴閮ㄦ病鏈夌洿鎺ヨ皟鐢紝涓昏閫氳繃鎷栨嫿浜や簰娣诲姞銆?
## 甯冨眬涓庡伐浣滃彴缁勪欢

### MainLayout

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/MainLayout.tsx` |
| 瀵煎嚭 | `MainLayout` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠 `App.tsx` 鏈洿鎺ユ寕杞?|
| 涓昏渚濊禆 | `DataPanel`, `TaskCanvas`, `Chatbot`, `ModeToggle`, `uiStore`, `eventStore` |

鍔熻兘锛?
- 鏃╂湡涓夋爮宸ヤ綔鍙颁富甯冨眬銆?- 椤堕儴 Header 鍖呭惈 logo銆丳anel/Canvas 瑙嗗浘鍒囨崲銆佷簨浠惰鏁般€佷富棰樺垏鎹€佺敤鎴峰ご鍍忓拰閫€鍑烘寜閽€?- 宸︿晶 `DataPanel` 鍙睍寮€銆佹敹璧峰拰鎷栧姩璋冩暣瀹藉害銆?- 涓棿鍖哄煙鎵胯浇 `TaskCanvas`銆?- 鍙充笅瑙掓寕杞芥诞鍔ㄧ増 `Chatbot`銆?
Props锛?
```ts
interface MainLayoutProps {
  onLogout?: () => void;
}
```

### DataPanel

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/DataPanel.tsx` |
| 瀵煎嚭 | `DataPanel` |
| 褰撳墠鐘舵€?| `MainLayout` 浣跨敤 |
| 涓昏渚濊禆 | `eventStore`, `uiStore`, `EventCard`, `EventEditor`, `JSONUploader` |

鍔熻兘锛?
- 宸︿晶鏁版嵁缁勭粐鍜屼簨浠剁鐞嗛潰鏉裤€?- 鏃犱簨浠舵椂鏄剧ず `JSONUploader`銆?- 鏀寔鎼滅储浜嬩欢銆?- 浠?tag 灏嗕簨浠跺垎缁勩€?- 鏀寔涓夊眰缂╂斁缁撴瀯锛?  - Level 1锛氭瑙堝眰锛実raph/grid/list 涓夌甯冨眬銆?  - Level 2锛氬垎绫昏鎯呭眰锛屽睍绀烘煇涓?tag 涓嬩簨浠躲€?  - Level 3锛氫簨浠剁紪杈戝眰锛屽祵鍏?`EventEditor`銆?- 浜嬩欢鏀寔鎷栨嫿锛宒rag data 涓?`EventCard` 淇濇寔涓€鑷淬€?
瑙嗗浘妯″紡锛?
| 妯″紡 | 鍐呴儴缁勪欢 | 鍔熻兘 |
| --- | --- | --- |
| `graph` | `GraphView` | 鎸?tag 鏁伴噺娓叉煋鍦嗗舰鍒嗙被鑺傜偣 |
| `grid` | `GridView` | 鍙屽垪绠€鍗′簨浠剁綉鏍?|
| `list` | `ListView` | 鍗曞垪浜嬩欢鍒楄〃 |

鍏抽敭鐘舵€侊細

- `uiStore.panelZoomLevel`
- `uiStore.panelLayout`
- 鏈湴 `searchQuery`
- 鏈湴 `selectedCategory`

### TaskCanvas

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/TaskCanvas.tsx` |
| 瀵煎嚭 | `TaskCanvas` |
| 褰撳墠鐘舵€?| `MainLayout` 浣跨敤 |
| 涓昏渚濊禆 | `DiaryCanvas`, `canvasStore` |

鍔熻兘锛?
- 浠诲姟鎵ц鍖哄叆鍙ｃ€?- 鏃犲綋鍓嶄换鍔℃垨鐢诲竷 entry 鏃舵樉绀烘ā鏉块€夋嫨銆?- 鏀寔鍥涚妯℃澘锛欴iary銆丷eflection銆丼lides銆丆ustom銆?- 閫夋嫨妯℃澘鍚庤皟鐢?`canvasStore.createNewEntry()`锛岃繘鍏?`DiaryCanvas`銆?
Props锛?
```ts
interface TaskCanvasProps {
  activeView: 'panel' | 'canvas';
}
```

澶囨敞锛?
- 褰撳墠瀹炵幇涓?`_props` 鏈疄闄呬娇鐢紝Panel/Canvas 鍒囨崲鐘舵€佹病鏈夊奖鍝嶆覆鏌撻€昏緫銆?
### ColdStart

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/ColdStart.tsx` |
| 瀵煎嚭 | `ColdStart` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `Select`, `lucide-react` |

鍔熻兘锛?
- 鍐峰惎鍔ㄩ厤缃悜瀵笺€?- 鍥涙娴佺▼锛氭椂闂磋寖鍥淬€佹椂闂寸矑搴︺€佷娇鐢ㄧ洰鐨勩€佺粍缁囩储寮曘€?- 姣忔鏈夊繀濉牎楠岋紝婊¤冻鏉′欢鎵嶅厑璁镐笅涓€姝ャ€?- 瀹屾垚鏃惰皟鐢?`onComplete(config)`銆?- 瀹屾垚鍚庡睍绀洪厤缃憳瑕侊紝骞跺厑璁搁噸缃噸鏂板紑濮嬨€?
Props锛?
```ts
interface ColdStartProps {
  onComplete?: (config: ColdStartConfig) => void;
}
```

娉ㄦ剰锛?
- 璇ユ枃浠跺唴閮ㄥ畾涔夌殑 `ColdStartConfig` 浣跨敤 `day | week | month`锛屼笌 `types/global.ts` 涓殑 `daily | weekly | monthly | event` 涓嶅畬鍏ㄤ竴鑷淬€傚悗缁帴鍏ュ叏灞€ store 鏃跺缓璁粺涓€銆?
### FilterToolbar

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/FilterToolbar.tsx` |
| 瀵煎嚭 | `FilterToolbar` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `Select`, `RangeSlider` |

鍔熻兘锛?
- 缁勫悎寮忕瓫閫夊伐鍏锋爮銆?- 鏀寔 Primary Element銆丼econdary Element 涓嬫媺閫夋嫨銆?- 鏀寔鏃堕棿鑼冨洿婊戝潡锛屾牸寮忓寲涓虹被浼?`2.13` 鐨勬棩鏈熸爣绛俱€?- 璁剧疆寮瑰眰鍖呭惈鍒嗙被缁嗗害銆佸睍绀烘暟閲忋€佸叧閿瘝寮€鍏冲拰 Renew 鎿嶄綔銆?
澶囨敞锛?
- 褰撳墠鐘舵€佸潎涓虹粍浠舵湰鍦?state锛屽皻鏈帴鍏?`uiStore.panelFilter`銆?
### ProjectHistoryCard

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/ProjectHistoryCard.tsx` |
| 瀵煎嚭 | `ProjectHistoryCard`, `ProjectHistoryCardProps`, `CardTheme` |
| 褰撳墠鐘舵€?| `ProjectHistoryList` 浣跨敤锛屽綋鍓嶄富鍏ュ彛鏈変竴濂楀唴鑱?History 鍗＄墖 |
| 涓昏渚濊禆 | `cn`, `lucide-react` |

鍔熻兘锛?
- MemoryLib/Project 鍘嗗彶鍗＄墖銆?- 鏀寔 blue銆亂ellow銆乬reen銆乸urple銆乺ed 浜旂涓婚銆?- 浣跨敤鏂滆 date ribbon銆佹爣绛捐兌鍥婂拰 hover 鎶崌鏁堟灉銆?- `isNew` 鏃跺睍绀烘柊寤洪伄缃╁拰鍔犲彿鎸夐挳銆?
Props锛?
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

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/ProjectHistoryList.tsx` |
| 瀵煎嚭 | `ProjectHistoryList` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `ProjectHistoryCard` |

鍔熻兘锛?
- 浣跨敤 mock 鏁版嵁鎸夊勾浠藉垎缁勫睍绀哄巻鍙插崱鐗囥€?- 褰撳墠娌℃湁鎺ュ叆 API 鎴?store銆?- 鍙綔涓哄綋鍓?`App.tsx` 鍐呰仈 `MemoryLibHistory` 鐨勭粍浠跺寲鏇夸唬鍩虹銆?
### TimelineCoordinateView

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/layout/TimelineCoordinateView.tsx` |
| 瀵煎嚭 | `TimelineCoordinateView` |
| 褰撳墠鐘舵€?| 鍘熷瀷/灞曠ず缁勪欢 |
| 涓昏渚濊禆 | 鏃犲閮ㄤ笟鍔′緷璧?|

鍔熻兘锛?
- 鏃堕棿鍧愭爣杞村睍绀哄師鍨嬨€?- 鍖呭惈 X/Y 杞淬€佹椂闂村埢搴︺€乄orking/Resting 鏍囩鍜岃嫢骞蹭簨浠跺潡鍗犱綅銆?- 褰撳墠绂佺敤浜や簰锛歚select-none pointer-events-none opacity-80`銆?
## 椤圭洰绠＄悊缁勪欢

### ProjectManagement

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/projects/ProjectManagement.tsx` |
| 瀵煎嚭 | `ProjectManagement` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `projectStore`, `eventStore`, `framer-motion` |

鍔熻兘锛?
- 宸︿晶椤圭洰鍒楄〃锛屽彸渚ч」鐩鎯呫€?- 鏀寔鏂板缓銆佺紪杈戙€佸垹闄ら」鐩€?- 鏀寔椤圭洰鎼滅储鍜岀姸鎬佺瓫閫夛細all銆乤ctive銆乤rchived銆乧ompleted銆?- 灞曠ず椤圭洰鍒涘缓鏃堕棿銆佷簨浠舵暟閲忋€佹€绘椂闀裤€?- 鍙充晶璇︽儏灞曠ず椤圭洰鍏宠仈浜嬩欢鍒楄〃銆?- 浜嬩欢鍙粠椤圭洰涓Щ闄ゃ€?
鍐呴儴缁勪欢锛?
| 鍐呴儴缁勪欢 | 鍔熻兘 |
| --- | --- |
| `StatusBadge` | 椤圭洰鐘舵€佸窘鏍?|
| `ProjectDetail` | 椤圭洰璇︽儏鍜屽叧鑱斾簨浠跺垪琛?|
| `ProjectForm` | 鍒涘缓/缂栬緫椤圭洰寮圭獥 |

鍏抽敭鐗规€э細

- `projectStore` 浣跨敤鍘熺敓 IndexedDB `MemoryLibProjects`銆?- 椤圭洰涓庝簨浠堕€氳繃 `project.eventIds` 鍏宠仈銆?- 鍒犻櫎椤圭洰浼氫簩娆＄‘璁ゃ€?
## 瀵艰埅缁勪欢

### NavigationPanel

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/navigation/NavigationPanel.tsx` |
| 瀵煎嚭 | `NavigationPanel`, `NavTriggerButton` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `framer-motion`, `lucide-react` |

鍔熻兘锛?
- 蹇€熷鑸脊绐楋紝鍖呭惈椤甸潰鍜岀粍浠朵袱绫绘潯鐩€?- 鏀寔鎼滅储 label 鍜?description銆?- 鏀寔閿洏鎿嶄綔锛欰rrowUp銆丄rrowDown銆丒nter銆丒scape銆?- 褰撳墠椤甸潰楂樹寒銆?- 鐐瑰嚮鏉＄洰鍚庤皟鐢?`onNavigate(id)` 骞跺叧闂潰鏉裤€?
Props锛?
```ts
interface NavigationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigate: (id: string) => void;
}
```

`NavTriggerButton`锛?
```ts
interface NavTriggerButtonProps {
  onClick: () => void;
  isOpen: boolean;
}
```

澶囨敞锛?
- Footer 鏄剧ず蹇嵎閿负 `Ctrl+Shift+X`锛屾棫鏂囨。鏇炬彁鍒?Cmd/Ctrl+K锛屽綋鍓嶄唬鐮佷互缁勪欢鍐呮樉绀轰负鍑嗐€?- `NAV_ITEMS` 浠嶅搴旀棭鏈?App View銆丳rojects銆丆old Start銆丆anvas銆丆omponents 瑙嗗浘銆?
## 鑱婂ぉ缁勪欢

### Chatbot

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/chatbot/Chatbot.tsx` |
| 瀵煎嚭 | `Chatbot` |
| 褰撳墠鐘舵€?| `MainLayout` 浣跨敤锛屽綋鍓嶄富鍏ュ彛浣跨敤鐨勬槸 `ChatbotPanel` |
| 涓昏渚濊禆 | `chatStore`, `eventStore`, `framer-motion` |

鍔熻兘锛?
- 鍙充笅瑙掓诞鍔ㄨ亰澶╂寜閽拰鑱婂ぉ绐楀彛銆?- 鏀寔鏈€灏忓寲銆佹柊寤轰細璇濄€佸叧闂€?- 鏀寔灏嗕簨浠跺崱鐗囨嫋鍏ヨ亰澶╃獥鍙ｏ紝褰㈡垚 attached events銆?- 鍙戦€佹秷鎭椂璋冪敤 `chatStore.sendMessage(input, attachedEventIds, attachedEvents)`銆?- 娑堟伅鍐呭鏀寔杞婚噺 Markdown 娓叉煋锛?  - `##`
  - `###`
  - `**bold**`
  - `- list`
  - `1. numbered`
- 鏄剧ず浜嬩欢 attachment 鏍囩鍜屾椂闂存埑銆?
涓?`ChatbotPanel` 鐨勫尯鍒細

| 椤?| Chatbot | ChatbotPanel |
| --- | --- | --- |
| 灞曠ず鏂瑰紡 | 鍙充笅瑙掓诞鍔ㄧ獥 | 鍙充晶婊戝叆鍏ㄩ珮闈㈡澘 |
| 浜嬩欢渚濊禆 | 渚濊禆 `eventStore`锛屾敮鎸佹嫋鍏ヤ簨浠?| 涓嶄緷璧?`eventStore` |
| 椤甸潰涓婁笅鏂?| 涓嶆惡甯?`pageContextStore` | 鍙戦€佹椂鎼哄甫褰撳墠椤甸潰涓婁笅鏂?|
| 褰撳墠鍏ュ彛 | `MainLayout` | `App.tsx` |

## 璁よ瘉缁勪欢

### LoginPage

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/auth/LoginPage.tsx` |
| 瀵煎嚭 | `LoginPage` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠 `App.tsx` 浣跨敤鍐呰仈 `AuthScreen` |
| 涓昏渚濊禆 | `User`, `framer-motion`, `lucide-react` |

鍔熻兘锛?
- 閭瀵嗙爜鐧诲綍椤?UI銆?- 鏀寔瀵嗙爜鍙鎬у垏鎹€?- 鏀寔 Remember me 鏈湴鐘舵€併€?- 鏈夊姞杞界姸鎬佸拰閿欒鎻愮ず銆?- 绗笁鏂圭櫥褰曟寜閽负绂佺敤鍗犱綅銆?- 褰撳墠瀹炵幇浣跨敤妯℃嫙鐧诲綍锛岄偖绠卞寘鍚?`@` 涓斿瘑鐮侀暱搴﹁嚦灏?6 鍗抽€氳繃銆?- 鐧诲綍鎴愬姛鍚庢瀯閫?`User` 骞惰皟鐢?`onLogin(user)`銆?
Props锛?
```ts
interface LoginPageProps {
  onLogin: (user: User) => void;
}
```

## UI 鍩虹缁勪欢

### Select

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ui/select.tsx` |
| 瀵煎嚭 | `Select`, `SelectProps`, `SelectOption` |
| 褰撳墠鐘舵€?| `ColdStart`銆乣FilterToolbar` 浣跨敤 |
| 涓昏渚濊禆 | `@radix-ui/react-dropdown-menu`, `lucide-react` |

鍔熻兘锛?
- 鍩轰簬 Radix Dropdown Menu 鐨勫崟閫変笅鎷夌粍浠躲€?- 灞曠ず褰撳墠閫夐」 label 鎴?placeholder銆?- 閫変腑椤规樉绀?Check 鍥炬爣銆?- 鏀寔 disabled銆乧lassName 瑕嗙洊銆?
Props锛?
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

缁存姢鎻愮ず锛?
- `frontend/package.json` 褰撳墠娌℃湁鍒楀嚭 `@radix-ui/react-dropdown-menu`锛岃嫢鏋勫缓鎶ョ己渚濊禆锛岄渶瑕佽ˉ渚濊禆鎴栨浛鎹㈠疄鐜般€?
### RangeSlider

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ui/slider.tsx` |
| 瀵煎嚭 | `RangeSlider`, `RangeSliderProps` |
| 褰撳墠鐘舵€?| `FilterToolbar` 浣跨敤 |
| 涓昏渚濊禆 | `cn` |

鍔熻兘锛?
- 鍙岀鑼冨洿婊戝潡銆?- 閫氳繃 pointer events 鎷栧姩 start/end thumb銆?- 鑷姩闄愬埗涓や釜 thumb 鑷冲皯淇濈暀 5% 闂磋窛銆?- 鏀寔 hover 鏃舵樉绀烘牸寮忓寲 label銆?
Props锛?
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

### ThemeProvider 鍜?useTheme

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ui/theme-provider.tsx` |
| 瀵煎嚭 | `ThemeProvider`, `useTheme` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠 `main.tsx` 鏈寘瑁?|
| 涓昏渚濊禆 | React context, localStorage |

鍔熻兘锛?
- 缁存姢 `light`銆乣dark`銆乣system` 涓夌涓婚銆?- 灏嗕富棰樺啓鍏?`localStorage`銆?- 鏍规嵁涓婚鍦?`document.documentElement` 涓婂垏鎹?`light`/`dark` class銆?- `system` 妯″紡璇诲彇 `prefers-color-scheme`銆?
缁存姢鎻愮ず锛?
- `ModeToggle` 浣跨敤 `useTheme`锛屽洜姝ゆ寕杞?`ModeToggle` 鐨勬爲蹇呴』琚?`ThemeProvider` 鍖呰９銆傚綋鍓?`main.tsx` 娌℃湁鍖呰９锛岃嫢鐩存帴浣跨敤 `MainLayout` 闇€瑕佽ˉ涓娿€?
### ModeToggle

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ui/mode-toggle.tsx` |
| 瀵煎嚭 | `ModeToggle` |
| 褰撳墠鐘舵€?| `MainLayout` 浣跨敤 |
| 涓昏渚濊禆 | `useTheme`, `lucide-react` |

鍔熻兘锛?
- 鏄庢殫涓婚鍒囨崲鎸夐挳銆?- light 鏃剁偣鍑诲垏鍒?dark锛屽叾浠栨儏鍐电偣鍑诲垏鍒?light銆?- 鐢?Sun/Moon 鍥炬爣閫氳繃 Tailwind dark class 鍋氳瑙夊垏鎹€?
### MemoryReflectionAction

| 椤?| 鍐呭 |
| --- | --- |
| 鏂囦欢 | `frontend/src/components/ui/MemoryReflectionAction.tsx` |
| 瀵煎嚭 | `MemoryReflectionAction` |
| 褰撳墠鐘舵€?| 鍙鐢紝褰撳墠涓诲叆鍙ｆ湭鐩存帴鎸傝浇 |
| 涓昏渚濊禆 | `framer-motion`, `lucide-react`, `cn` |

鍔熻兘锛?
- 宸︿笅瑙掓诞鍔?Memory Reflection 鎿嶄綔鍏ュ彛銆?- 鐐瑰嚮灞曞紑浠诲姟鑿滃崟銆?- 鏀寔鐐瑰嚮澶栭儴鍏抽棴銆?- 鍐呯疆鍥涚浠诲姟锛?  - Color Diary
  - Event Logic
  - Decision Making
  - Emotion Healing

澶囨敞锛?
- 褰撳墠浠诲姟鎸夐挳娌℃湁缁戝畾涓氬姟鍥炶皟锛屽睘浜?UI action launcher 鍘熷瀷銆?
## Store 涓庢暟鎹緷璧?
### eventStore

| 鏂囦欢 | `frontend/src/stores/eventStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 绠＄悊浜嬩欢鍒楄〃銆侀€変腑浜嬩欢銆佸鍏ュ鍑恒€佸悓姝?Memory Core |

鏍稿績鑳藉姏锛?
- `loadEvents()`锛氫粠 Dexie `db.events` 鍔犺浇浜嬩欢锛屽苟鎸?`startSec` 鎺掑簭銆?- `selectEvent(id)`锛氳缃€変腑浜嬩欢銆?- `updateEvent(id, changes)`锛氭洿鏂颁簨浠跺苟鍒锋柊鍒楄〃銆?- `importTimeline(timeline, filename)`锛氭竻绌烘棫浜嬩欢锛屽鍏?JSON timeline銆?- `importFromVideoAnalysis(events)`锛氬皢瑙嗛鍒嗘瀽缁撴灉杞崲涓?timeline銆?- `exportData()`锛氬鍑哄綋鍓?events 涓?`memorylib_export.json`銆?- `clearEvents()`锛氭竻绌?events 鍜?videos銆?- `syncToMemoryCore()`锛氱粡 `/api/memory-core/api/v1/timeline/import` 鍚屾鍒?memory-core銆?
涓昏娑堣垂鑰咃細

- `EventList`
- `EventCard`
- `EventEditor`
- `DataPanel`
- `DiaryCanvas`
- `Chatbot`
- `ProjectManagement`

### chatStore

| 鏂囦欢 | `frontend/src/stores/chatStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 绠＄悊鑱婂ぉ浼氳瘽銆佹秷鎭€丄I 璇锋眰銆丮emory Core 娴佸紡瀵硅瘽 |

鏍稿績鑳藉姏锛?
- 鍘熺敓 IndexedDB `MemoryLibChat` 鎸佷箙鍖栦細璇濄€?- `createSession(projectId?)`
- `loadSessions()`
- `sendMessage(content, attachedEventIds?, events?, context?)`
- 榛樿璇锋眰 `/api/chat/completions`銆?- 寮€鍚?`localStorage.memoryCoreRag=1` 鏃讹紝璇锋眰 `/api/memory-core/api/v1/chat/stream`銆?- AI 杩斿洖 `appliedActions` 鏃惰皟鐢?`pageContextStore.triggerRefresh()`銆?- 鍐呯疆 120 绉掕姹傝秴鏃躲€?
涓昏娑堣垂鑰咃細

- `ChatbotPanel`
- `Chatbot`

### pageContextStore

| 鏂囦欢 | `frontend/src/stores/pageContextStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 鍚戣亰澶╁姪鎵嬫毚闇插綋鍓嶉〉闈笂涓嬫枃锛屽苟鎵挎帴 AI action 鍚庣殑鍒锋柊瑙﹀彂 |

涓婁笅鏂囩被鍨嬶細

- `history`
- `conceptGraph`

涓昏娑堣垂鑰咃細

- `App.tsx` 涓殑 `MemoryLibHistory`
- `ConceptGraphView`
- `ChatbotPanel`
- `chatStore`

### canvasStore

| 鏂囦欢 | `frontend/src/stores/canvasStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 绠＄悊鏃ヨ鐢诲竷 entry銆佸厓绱犮€侀€変腑鐘舵€併€佺缉鏀惧拰灞傜骇 |

鏍稿績鑳藉姏锛?
- `createNewEntry(title, canvasSize?)`
- `addElement(element)`
- `updateElement(id, changes)`
- `removeElement(id)`
- `selectElement(id)`
- `setZoom(zoom)`锛岃寖鍥撮檺鍒朵负 0.1 鍒?3銆?- `bringToFront(id)`
- `sendToBack(id)`
- `duplicateElement(id)`
- `exportAsImage()` 褰撳墠杩斿洖 `null`锛屽皻鏈疄鐜般€?
涓昏娑堣垂鑰咃細

- `DiaryCanvas`
- `CanvasToolbar`
- `TaskCanvas`

### projectStore

| 鏂囦欢 | `frontend/src/stores/projectStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 绠＄悊椤圭洰鍒楄〃鍜岄」鐩簨浠跺叧绯?|

鏍稿績鑳藉姏锛?
- 浣跨敤鍘熺敓 IndexedDB `MemoryLibProjects`銆?- `loadProjects()`
- `createProject(name, description?)`
- `updateProject(id, changes)`
- `deleteProject(id)`
- `addEventToProject(projectId, eventId)`
- `removeEventFromProject(projectId, eventId)`
- `getProjectEvents(projectId)`

涓昏娑堣垂鑰咃細

- `ProjectManagement`

### uiStore

| 鏂囦欢 | `frontend/src/stores/uiStore.ts` |
| --- | --- |
| 涓昏鑱岃矗 | 绠＄悊鏃у伐浣滃彴鐨勭敤鎴枫€佸喎鍚姩銆侀潰鏉垮拰閫氱煡鐘舵€?|

鏍稿績鑳藉姏锛?
- 鐧诲綍/閫€鍑虹殑 UI state銆?- 鍐峰惎鍔ㄥ畬鎴愮姸鎬併€?- 宸﹀彸闈㈡澘瀹藉害銆?- `panelZoomLevel`銆乣panelLayout`銆乣panelFilter`銆?- 閫氱煡娣诲姞銆佹爣璁板凡璇汇€佹竻绌恒€?- 閫氳繃 Zustand persist 淇濆瓨閮ㄥ垎瀛楁鍒?`memorylib-ui-storage`銆?
涓昏娑堣垂鑰咃細

- `MainLayout`
- `DataPanel`

### Dexie 鏁版嵁搴?
| 鏂囦欢 | `frontend/src/db/index.ts` |
| --- | --- |
| 鏁版嵁搴撳悕 | `MemoryLibDB` |

琛ㄧ粨鏋勶細

| 琛?| 绱㈠紩 | 鍐呭 |
| --- | --- | --- |
| `events` | `id, videoId, eventIndex, *tags` | 瀵煎叆鍚庣殑鎵╁睍浜嬩欢 |
| `videos` | `id, filename, importedAt` | 瑙嗛鍏冩暟鎹?|
| `tags` | `id, name` | 鏍囩 |

## 绫诲瀷妯″瀷

### 浜嬩欢绫诲瀷

| 鏂囦欢 | `frontend/src/types/event.ts` |
| --- | --- |

涓昏绫诲瀷锛?
- `MediaItem`
- `Event`
- `Timeline`
- `EventExtended`
- `VideoMeta`
- `Project`
- `ChatMessage`
- `ChatSession`

娉ㄦ剰锛?
- 鍘熷瀵煎叆浜嬩欢浣跨敤 snake_case 瀛楁锛屼緥濡?`start_sec`銆乣start_hms`銆?- 鍓嶇 store 杞崲鍚庝娇鐢?camelCase 瀛楁锛屼緥濡?`startSec`銆乣startHms`銆?- `EventNodeCard` 鐨?`MemoryLibEvent` 鐙珛瀹氫箟锛屼粛淇濈暀 snake_case 椋庢牸锛岀敤浜?`/api/memorylibs/:id` 杩斿洖鏁版嵁銆?
### 鐢诲竷绫诲瀷

| 鏂囦欢 | `frontend/src/types/canvas.ts` |
| --- | --- |

涓昏绫诲瀷锛?
- `CanvasElementType`
- `Position`
- `CanvasElement`
- `ElementStyle`
- `DiaryEntry`

### 鍏ㄥ眬 UI 绫诲瀷

| 鏂囦欢 | `frontend/src/types/global.ts` |
| --- | --- |

涓昏绫诲瀷锛?
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

## 瀵煎嚭鍏ュ彛

褰撳墠瀛樺湪鐨?barrel 鏂囦欢锛?
| 鏂囦欢 | 瀵煎嚭鍐呭 |
| --- | --- |
| `components/auth/index.ts` | `LoginPage` |
| `components/canvas/index.ts` | `DiaryCanvas`, `CanvasToolbar`, `ElementSidebar` |
| `components/chatbot/index.ts` | `Chatbot` |
| `components/layout/index.ts` | `MainLayout`, `DataPanel`, `TaskCanvas`, `ColdStart`, `FilterToolbar`, `ProjectHistoryList`, `ProjectHistoryCard`, `TimelineCoordinateView` |
| `components/navigation/index.ts` | `NavigationPanel`, `NavTriggerButton` |
| `components/projects/index.ts` | `ProjectManagement` |

鏈€氳繃 barrel 鏂囦欢缁熶竴瀵煎嚭鐨勫綋鍓嶄富娴佺▼缁勪欢锛?
- `ConceptGraphView`
- `EventNodeCard`
- `EventEditorPopup`
- `ChatbotPanel`

濡傛灉鍚庣画瑕佸舰鎴愮湡姝ｇ殑缁勪欢搴擄紝鍙互鑰冭檻琛ヤ竴涓?`components/index.ts` 缁熶竴瀵煎嚭銆?
## 褰撳墠鍏ュ彛涓庡巻鍙茬粍浠跺叧绯?
| 缁勪欢/娴佺▼ | 褰撳墠 `App.tsx` 鏄惁浣跨敤 | 璇存槑 |
| --- | --- | --- |
| 鍐呰仈 `AuthScreen` | 鏄?| 褰撳墠瀹為檯鐧诲綍/娉ㄥ唽 UI |
| 鍐呰仈 `MemoryLibHistory` | 鏄?| 褰撳墠瀹為檯 History 椤?|
| `ConceptGraphView` | 鏄?| 褰撳墠 MemoryLib 璇︽儏椤?|
| `ChatbotPanel` | 鏄?| 褰撳墠鍙充晶鑱婂ぉ闈㈡澘 |
| `LoginPage` | 鍚?| 鍙鐢ㄨ璇侀〉锛屾ā鎷熺櫥褰?|
| `MainLayout` | 鍚?| 鏃у伐浣滃彴涓诲竷灞€ |
| `DataPanel` | 闂存帴鍚?| 鐢?`MainLayout` 浣跨敤 |
| `TaskCanvas` | 闂存帴鍚?| 鐢?`MainLayout` 浣跨敤 |
| `DiaryCanvas` | 闂存帴鍚?| 鐢?`TaskCanvas` 浣跨敤 |
| `Chatbot` | 闂存帴鍚?| 鐢?`MainLayout` 浣跨敤 |
| `ProjectManagement` | 鍚?| 鐙珛椤圭洰绠＄悊鐣岄潰 |
| `NavigationPanel` | 鍚?| 鏃у瑙嗗浘蹇€熷鑸?|



## 闈?Web 鐩綍璇存槑

浠撳簱涓殑 `Mobile/` 鍜?`Glass/` 鏄?Android/Kotlin 绀轰緥宸ョ▼锛屽寘鍚?Activities銆乂iewModel銆丏ataBeans 绛夛紝涓嶅睘浜庢湰 React 鍓嶇缁勪欢搴撱€傛棫 `doc/DEVELOPMENT.md` 涓湁绉诲姩绔拰鐪奸暅绔鏄庯紝鍙綔涓哄绔枃妗ｅ弬鑰冿紝浣嗘湰鏂囨。鍙暣鐞?Web 鍓嶇缁勪欢銆?
