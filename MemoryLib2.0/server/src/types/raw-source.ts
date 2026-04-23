/** 与上传表单 metadata.memoria 对齐：决定 raw 归入哪条记忆（非「一文件一事件」） */
export type MemoriaUploadMetadata = {
  /** 追加到已有事件 ID */
  targetEventId?: string;
  /** 多文件同键 → 同一事件 */
  eventGroupKey?: string;
  /** 仅入库，事件由后续 LLM/VLM 批量生成 */
  deferEventExtraction?: boolean;
};

/** 与上传表单 metadata 字段对齐（JSON） */
export type UploadMetadata = {
  occurredAt?: string;
  occurredEndAt?: string;
  location?: string;
  gpsCoordinates?: { lat: number; lng: number };
  eventType?: string;
  people?: string[];
  tags?: string[];
  description?: string;
  /** 视频：fpv | screen → raw_file_type */
  captureKind?: "fpv" | "screen";
  memoria?: MemoriaUploadMetadata;
};

export type RawFileType =
  | "video_fpv"
  | "screen_recording"
  | "photo"
  | "document"
  | "audio";

export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";
