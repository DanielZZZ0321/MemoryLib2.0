const apiPrefix = import.meta.env.VITE_API_BASE_URL ?? "";

export type UploadSourceResult = {
  sourceId: string;
  objectKey: string;
  fileType: string;
};

export type UploadResponse = {
  ok: boolean;
  sources: UploadSourceResult[];
  sourceId?: string;
};

export function postAdminUpload(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${apiPrefix}/api/admin/upload`);

    /**
     * multipart/form-data 下，不少浏览器 upload 事件的 lengthComputable 为 false，
     * 若只依赖 (loaded/total) 会永远停在 0%。
     */
    let indeterminateStep = 8;
    xhr.upload.onloadstart = () => onProgress(2);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(99, Math.round((100 * e.loaded) / e.total)));
        return;
      }
      if (e.loaded > 0) {
        indeterminateStep = Math.min(94, indeterminateStep + 6);
        onProgress(indeterminateStep);
      }
    };

    xhr.onload = () => {
      let body: unknown;
      try {
        body = JSON.parse(xhr.responseText) as unknown;
      } catch {
        reject(new Error(xhr.responseText || "响应解析失败"));
        return;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve(body as UploadResponse);
        return;
      }
      const o = body as { message?: string; error?: string; hint?: string };
      const parts = [
        typeof o.message === "string" ? o.message : "",
        typeof o.hint === "string" ? o.hint : "",
      ].filter(Boolean);
      const msg =
        parts.join("\n") ||
        (typeof o.error === "string" ? o.error : "") ||
        `上传失败 (${xhr.status})`;
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error("网络错误"));
    xhr.send(formData);
  });
}

export type QueueStatusResponse = {
  videoProcessing: Record<string, number> | null;
  message?: string;
};

export async function fetchQueueStatus(): Promise<QueueStatusResponse> {
  const res = await fetch(`${apiPrefix}/api/admin/queue/status`);
  return (await res.json()) as QueueStatusResponse;
}
