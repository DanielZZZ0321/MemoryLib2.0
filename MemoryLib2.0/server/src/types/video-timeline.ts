/** VLM 输出的时间线片段 → 每条可对应一个最小记忆单元（Event） */
export type TimelineSegment = {
  startSec: number;
  endSec: number;
  title: string;
  summary: string;
  tags?: string[];
};
