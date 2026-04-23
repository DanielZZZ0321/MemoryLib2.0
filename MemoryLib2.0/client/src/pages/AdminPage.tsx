import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UploadDropzone } from "@/components/admin/UploadDropzone";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteAdminSource,
  fetchAdminSources,
  reprocessAdminSource,
  type RawSourceDTO,
} from "@/lib/api";
import {
  fetchQueueStatus,
  postAdminUpload,
} from "@/lib/upload-admin";
import { useAdminUploadStore } from "@/stores/admin-upload-store";

const EVENT_TYPES = [
  "会议",
  "旅行",
  "日常",
  "学习",
  "工作",
  "运动",
  "其他",
] as const;

export default function AdminPage() {
  const {
    files,
    setFiles,
    progress,
    setProgress,
    uploading,
    setUploading,
    error,
    setError,
    lastResults,
    setLastResults,
    queueHint,
    setQueueHint,
  } = useAdminUploadStore();

  const [occurredAt, setOccurredAt] = useState("");
  const [occurredEndAt, setOccurredEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [people, setPeople] = useState("");
  const [tags, setTags] = useState("");
  const [description, setDescription] = useState("");
  const [captureKind, setCaptureKind] = useState<"fpv" | "screen">("fpv");
  const [targetEventId, setTargetEventId] = useState("");
  const [eventGroupKey, setEventGroupKey] = useState("");
  const [deferEventExtraction, setDeferEventExtraction] = useState(false);

  const splitList = (s: string) =>
    s
      .split(/[,，;；\s]+/)
      .map((x) => x.trim())
      .filter(Boolean);

  const metadata = useMemo(() => {
    const meta: Record<string, unknown> = {
      eventType,
      location: location || undefined,
      description: description || undefined,
      people: splitList(people),
      tags: splitList(tags),
      captureKind,
    };
    if (occurredAt) {
      meta.occurredAt = new Date(occurredAt).toISOString();
    }
    if (occurredEndAt) {
      meta.occurredEndAt = new Date(occurredEndAt).toISOString();
    }
    const memoria: Record<string, unknown> = {};
    if (targetEventId.trim()) {
      memoria.targetEventId = targetEventId.trim();
    }
    if (eventGroupKey.trim()) {
      memoria.eventGroupKey = eventGroupKey.trim();
    }
    if (deferEventExtraction) {
      memoria.deferEventExtraction = true;
    }
    if (Object.keys(memoria).length > 0) {
      meta.memoria = memoria;
    }
    return meta;
  }, [
    captureKind,
    deferEventExtraction,
    description,
    eventGroupKey,
    eventType,
    location,
    occurredAt,
    occurredEndAt,
    people,
    tags,
    targetEventId,
  ]);

  const refreshQueue = useCallback(async () => {
    try {
      const q = await fetchQueueStatus();
      if (q.videoProcessing) {
        setQueueHint(JSON.stringify(q.videoProcessing));
      } else {
        setQueueHint(q.message ?? "队列不可用");
      }
    } catch {
      setQueueHint("无法获取队列状态");
    }
  }, [setQueueHint]);

  useEffect(() => {
    void refreshQueue();
    const t = setInterval(() => void refreshQueue(), 8000);
    return () => clearInterval(t);
  }, [refreshQueue]);

  const [sources, setSources] = useState<RawSourceDTO[]>([]);
  const [sourcesTotal, setSourcesTotal] = useState(0);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesErr, setSourcesErr] = useState<string | null>(null);
  const [sourcesPage, setSourcesPage] = useState(1);
  const pageSize = 15;

  const refreshSources = useCallback(async () => {
    setSourcesLoading(true);
    setSourcesErr(null);
    try {
      const r = await fetchAdminSources({ page: sourcesPage, pageSize });
      setSources(r.items);
      setSourcesTotal(r.total);
    } catch (e) {
      setSourcesErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSourcesLoading(false);
    }
  }, [sourcesPage]);

  useEffect(() => {
    void refreshSources();
  }, [refreshSources]);

  const clearFiles = () => setFiles([]);

  const submit = async () => {
    if (files.length === 0) {
      setError("请先选择文件");
      return;
    }
    setError(null);
    setLastResults(null);
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    for (const f of files) {
      formData.append("files", f);
    }
    formData.append("metadata", JSON.stringify(metadata));
    try {
      const res = await postAdminUpload(formData, setProgress);
      setLastResults(res.sources);
      setFiles([]);
      void refreshQueue();
      void refreshSources();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 首页
          </Link>
          <span className="text-lg font-semibold">Memoria 后台</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/review"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            General Review
          </Link>
          <Link
            to="/workspace"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            工作区
          </Link>
          <Badge variant="secondary">上传</Badge>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl gap-6 p-6">
        <aside className="hidden w-48 shrink-0 flex-col gap-1 md:flex">
          <Button variant="secondary" size="sm" className="justify-start">
            上传数据
          </Button>
          <a
            href="#sources"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "inline-flex justify-start",
            )}
          >
            数据管理
          </a>
          <Button variant="ghost" size="sm" className="justify-start" disabled>
            处理队列
          </Button>
          <Link
            to="/review"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "justify-start",
            )}
          >
            General Review
          </Link>
          <Link
            to="/workspace"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "justify-start",
            )}
          >
            工作区
          </Link>
        </aside>

        <div className="min-w-0 flex-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>上传</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <UploadDropzone />

              {files.length > 0 ? (
                <ul className="max-h-40 space-y-1 overflow-auto rounded-lg border p-2 text-xs">
                  {files.map((f) => (
                    <li key={`${f.name}-${f.size}`} className="truncate">
                      {f.name}{" "}
                      <span className="text-muted-foreground">
                        ({Math.round(f.size / 1024)} KB)
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={clearFiles}
                  disabled={uploading || files.length === 0}
                >
                  清空列表
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="occurredAt">发生时间</Label>
                  <Input
                    id="occurredAt"
                    type="datetime-local"
                    value={occurredAt}
                    onChange={(e) => setOccurredAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="occurredEndAt">结束时间</Label>
                  <Input
                    id="occurredEndAt"
                    type="datetime-local"
                    value={occurredEndAt}
                    onChange={(e) => setOccurredEndAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="location">地点</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">事件类型</Label>
                  <select
                    id="eventType"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="captureKind">视频视角</Label>
                  <select
                    id="captureKind"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    value={captureKind}
                    onChange={(e) =>
                      setCaptureKind(e.target.value as "fpv" | "screen")
                    }
                  >
                    <option value="fpv">第一人称 / 通用</option>
                    <option value="screen">录屏</option>
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="people">人物</Label>
                  <Input
                    id="people"
                    value={people}
                    onChange={(e) => setPeople(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="description">描述</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2 rounded-lg border border-dashed border-border/80 p-4">
                  <p className="text-sm font-medium">归属</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetEventId">事件 ID</Label>
                      <Input
                        id="targetEventId"
                        value={targetEventId}
                        onChange={(e) => setTargetEventId(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventGroupKey">组号</Label>
                      <Input
                        id="eventGroupKey"
                        value={eventGroupKey}
                        onChange={(e) => setEventGroupKey(e.target.value)}
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={deferEventExtraction}
                      onChange={(e) => setDeferEventExtraction(e.target.checked)}
                      className="size-4 rounded border-input"
                    />
                    仅入库
                  </label>
                </div>
              </div>

              {uploading ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span />
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              ) : null}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}

              {lastResults && lastResults.length > 0 ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                  <ul className="space-y-1 font-mono text-xs">
                    {lastResults.map((s) => (
                      <li key={s.sourceId}>
                        {s.fileType} · {s.sourceId}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <Button
                type="button"
                onClick={() => void submit()}
                disabled={uploading || files.length === 0}
              >
                {uploading ? "上传中…" : "开始上传"}
              </Button>
            </CardContent>
          </Card>

          <Card id="sources">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
              <div>
                <CardTitle className="text-base">数据源</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sourcesLoading || sourcesPage <= 1}
                  onClick={() => setSourcesPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={
                    sourcesLoading || sourcesPage * pageSize >= sourcesTotal
                  }
                  onClick={() => setSourcesPage((p) => p + 1)}
                >
                  下一页
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={sourcesLoading}
                  onClick={() => void refreshSources()}
                >
                  刷新列表
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sourcesErr ? (
                <p className="mb-2 text-sm text-destructive">{sourcesErr}</p>
              ) : null}
              {sourcesLoading ? (
                <p className="text-sm text-muted-foreground">…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-2 pr-2">类型</th>
                        <th className="py-2 pr-2">状态</th>
                        <th className="py-2 pr-2">文件名</th>
                        <th className="py-2 pr-2">上传时间</th>
                        <th className="py-2">操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sources.map((s) => (
                        <tr key={s.id} className="border-b border-border/60">
                          <td className="py-2 pr-2 font-mono">{s.file_type}</td>
                          <td className="py-2 pr-2">{s.processing_status}</td>
                          <td className="max-w-[200px] truncate py-2 pr-2" title={s.original_filename}>
                            {s.original_filename}
                          </td>
                          <td className="py-2 pr-2 text-muted-foreground">
                            {s.upload_time?.slice(0, 19) ?? ""}
                          </td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => {
                                  void (async () => {
                                    try {
                                      await reprocessAdminSource(s.id);
                                      await refreshQueue();
                                      await refreshSources();
                                    } catch (e) {
                                      setSourcesErr(
                                        e instanceof Error
                                          ? e.message
                                          : String(e),
                                      );
                                    }
                                  })();
                                }}
                              >
                                重处理
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                className="h-7 text-xs"
                                onClick={() => {
                                  if (
                                    !window.confirm(
                                      `确定删除数据源 ${s.id.slice(0, 8)}…？`,
                                    )
                                  ) {
                                    return;
                                  }
                                  void (async () => {
                                    try {
                                      await deleteAdminSource(s.id);
                                      await refreshSources();
                                    } catch (e) {
                                      setSourcesErr(
                                        e instanceof Error
                                          ? e.message
                                          : String(e),
                                      );
                                    }
                                  })();
                                }}
                              >
                                删除
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {sourcesTotal} · {sourcesPage}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="text-base">队列</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={() => void refreshQueue()}>
                刷新
              </Button>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
                {queueHint ?? "…"}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
