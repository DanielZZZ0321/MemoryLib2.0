# MemoryLib2.0 鎶€鏈爤涓庝緷璧?
## 鍓嶇鎶€鏈爤

### 鏍稿績妗嗘灦
| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| React | 18.x | UI 妗嗘灦 |
| TypeScript | 5.x | 绫诲瀷瀹夊叏 |
| Vite | 5.x | 鏋勫缓宸ュ叿 |

### 鏍峰紡涓庡姩鐢?| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| TailwindCSS | 3.x | 鏍峰紡妗嗘灦 |
| Framer Motion | 11.x | 鍔ㄧ敾搴擄紙缂╂斁銆佸脊绐椼€佽繃娓″姩鏁堬級 |

### 鐘舵€佺鐞?| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| Zustand | 4.x | 杞婚噺鐘舵€佺鐞嗭紙璺ㄧ粍浠剁姸鎬佸叡浜級 |
| React Query | 5.x | 鏈嶅姟绔姸鎬佺鐞嗐€佺紦瀛?|

### 鍙鍖栦笌鍥惧舰
| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| d3-force | 3.x | 鍔涘鍚戝竷灞€锛堟皵娉＄綉缁滃浘锛?|
| React Flow | 11.x | 浜嬩欢缃戠粶鍥俱€佹祦绋嬬紪杈戝櫒 |
| Konva.js | 9.x | Canvas 鐢诲竷锛堝妯℃€佹棩璁扮紪杈戯級 |

### 浜や簰缁勪欢
| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| dnd-kit | 6.x | 鎷栨嫿鍔熻兘锛堣法缁勪欢鍏冪礌鎷栨嫿锛?|
| react-zoom-pan-pinch | 3.x | 缂╂斁鍔熻兘锛堜笁灞?zoom锛?|
| react-photo-album | 2.x | 鐓х墖缃戞牸灞曠ず |
| yet-another-react-lightbox | 4.x | 鍥剧墖棰勮鐏 |

### UI 缁勪欢搴?| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| Radix UI | - | 鏃犳牱寮忕粍浠跺熀纭€锛堜笅鎷夎彍鍗曘€佸脊绐楃瓑锛?|
| Lucide React | - | 鍥炬爣搴?|

---

## 鍚庣鎶€鏈爤

### 鏍稿績妗嗘灦
| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| Express.js | 4.x | Web 妗嗘灦 |
| TypeScript | 5.x | 绫诲瀷瀹夊叏 |

### 鏁版嵁搴?| 鎶€鏈?| 鐗堟湰 | 鐢ㄩ€?|
|------|------|------|
| PostgreSQL | 15.x | 涓绘暟鎹簱锛堝叧绯诲瀷 + JSONB 鏂囨。瀛樺偍锛?|
| Redis | 7.x | 缂撳瓨銆佷細璇濈鐞嗭紙鍙€夛紝鍚庢湡鍐嶅姞锛?|

> **鏋舵瀯绠€鍖栬鏄?*锛氬垵鏈熺粺涓€浣跨敤 PostgreSQL銆侸SONB 绫诲瀷瓒充互澶勭悊澶氭ā鎬佽蹇嗘暟鎹紝鏀寔澶嶆潅鏌ヨ鍜?GIN 绱㈠紩銆傞伩鍏嶅弻鏁版嵁搴撶殑杩愮淮澶嶆潅搴﹀拰璺ㄥ簱浜嬪姟闂銆傚緟鏁版嵁閲忓闀块亣鍒扮摱棰堟椂锛屽啀鑰冭檻鎷嗗垎 MongoDB銆?
### 浜戞湇鍔★紙鑵捐浜戯級
| 鏈嶅姟 | 鐢ㄩ€?|
|------|------|
| 浜戞湇鍔″櫒 CVM | 搴旂敤閮ㄧ讲 |
| 瀵硅薄瀛樺偍 COS | 鍥剧墖銆佽棰戝瓨鍌?|

### AI 鏈嶅姟
| 鏈嶅姟 | 鐢ㄩ€?|
|------|------|
| Claude API | 浜嬩欢鎽樿銆佹櫤鑳芥悳绱?|
| OpenAI Whisper | 璇煶杞枃瀛?|

---

## package.json 绀轰緥

### 鍓嶇 (package.json)

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

### 鍚庣 (package.json)

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

## 鎶€鏈€夊瀷鐞嗙敱

### 涓轰粈涔堥€夋嫨 React Flow + d3-force锛?
Figma 鍘熷瀷涓殑姘旀场缃戠粶鍥撅紙Page 8, 14锛夊拰浜嬩欢閫昏緫缂栬緫鍣紙Page 10锛夐渶瑕侊細
- 鍔涘鍚戝竷灞€鑷姩鎺掑垪鑺傜偣
- 鍙嫋鎷借妭鐐归噸鏂板畾浣?- 杩炵嚎鏄剧ず浜嬩欢鍏崇郴
- 缂╂斁鍜屽钩绉绘祻瑙堝ぇ鍨嬬綉缁?
React Flow 鎻愪緵寮€绠卞嵆鐢ㄧ殑鑺傜偣/杈圭鐞嗭紝d3-force 鎻愪緵鐗╃悊妯℃嫙甯冨眬銆?
### 涓轰粈涔堥€夋嫨 Zustand锛?
涓夊ぇ缁勪欢锛圥anel銆丆anvas銆丆hatbot锛夐渶瑕佸叡浜嫋鎷藉厓绱犵姸鎬侊細
- 姣?Redux 鏇磋交閲忥紝鏃犻渶 action/reducer 鏍锋澘浠ｇ爜
- 鏀寔 TypeScript锛岀被鍨嬫帹鏂弸濂?- 閫傚悎涓皬鍨嬪簲鐢ㄧ殑澶嶆潅鐘舵€佺鐞?
### 涓轰粈涔堥€夋嫨 Konva.js锛?
Canvas 鏃ヨ缂栬緫闇€瑕侊細
- 鎷栨嫿鐓х墖銆佹枃瀛楀厓绱?- 鑷敱缁樺埗鍜屾爣娉?- 瀵煎嚭涓哄浘鐗?- 鏀寔鎾ら攢/閲嶅仛

Konva 鎻愪緵澹版槑寮?API锛屼笌 React 闆嗘垚鑹ソ銆?
---

## 寮€鍙戠幆澧冮厤缃?
### 鍓嶇
```bash
cd frontend
npm install
npm run dev
```

### 鍚庣
```bash
cd backend
npm install
npm run dev
```

### 鐜鍙橀噺 (.env)
```env
# 鏁版嵁搴?DATABASE_URL=postgresql://user:password@localhost:5432/memorylib

# 鏈嶅姟
PORT=4000

# 鑵捐浜?TENCENT_SECRET_ID=xxx
TENCENT_SECRET_KEY=xxx
COS_BUCKET=memorylib-xxx

# AI
ANTHROPIC_API_KEY=xxx
```

---

## 鏋舵瀯婕旇繘璺嚎

### Phase 1: 鍗曞簱鏋舵瀯锛堝綋鍓嶏級
- PostgreSQL 浣滀负鍞竴鏁版嵁瀛樺偍
- JSONB 瀛樺偍澶氭ā鎬佽蹇嗘暟鎹?- 搴旂敤灞傜紦瀛橈紙鍐呭瓨/鏂囦欢锛?
### Phase 2: 鎬ц兘浼樺寲锛堢敤鎴烽噺 > 1000锛?- 寮曞叆 Redis 鍋氱紦瀛樺拰浼氳瘽绠＄悊
- 娣诲姞鏁版嵁搴撹鍐欏垎绂?
### Phase 3: 瑙勬ā鍖栵紙濡傛湁蹇呰锛?- 鍗曡〃 JSONB 瓒呰繃 500 涓囨潯涓旀煡璇㈠彉鎱㈡椂锛岃€冭檻鎷嗗垎 MongoDB
- 鎴栦娇鐢?PostgreSQL 鍒嗗尯琛
