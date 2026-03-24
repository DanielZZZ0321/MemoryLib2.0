/**
 * 必须作为 index 的第一个 import：ESM 会提升 import，若先加载 routes 再 dotenv.config，
 * 则 chat 等模块在顶层读取的 process.env 永远是空的。
 */
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });
