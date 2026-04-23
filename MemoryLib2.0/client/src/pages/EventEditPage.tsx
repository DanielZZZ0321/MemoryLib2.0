import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type EventDetail,
  fetchEvent,
  setEventHighlight,
  updateEvent,
  updateEventModule,
} from "@/lib/api";

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moduleEdits, setModuleEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const e = await fetchEvent(id);
      setEv(e);
      setTitle(e.title);
      setSummary(e.summary ?? "");
      setTagsStr(e.tags.join(", "));
      const edits: Record<string, string> = {};
      for (const m of e.modules) {
        edits[m.id] = JSON.stringify(m.content ?? {}, null, 2);
      }
      setModuleEdits(edits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
      setEv(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveMeta = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const tags = tagsStr
        .split(/[,，;；\s]+/)
        .map((t) => t.trim())
        .filter(Boolean);
      const updated = await updateEvent(id, {
        title,
        summary: summary || null,
        tags,
      });
      setEv(updated);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleHighlight = async () => {
    if (!id || !ev) {
      return;
    }
    setErr(null);
    try {
      await setEventHighlight(id, !ev.is_highlighted);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  };

  const saveModule = async (moduleId: string) => {
    if (!id) {
      return;
    }
    const raw = moduleEdits[moduleId] ?? "{}";
    setErr(null);
    try {
      const content = JSON.parse(raw) as unknown;
      const updated = await updateEventModule(id, moduleId, { content });
      setEv(updated);
    } catch (e) {
      setErr(
        e instanceof SyntaxError
          ? "模块 JSON 无效"
          : e instanceof Error
            ? e.message
            : String(e),
      );
    }
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-destructive">缺少事件 ID</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to="/review"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← 图谱
          </Link>
          <span className="text-lg font-semibold">编辑事件</span>
        </div>
        <Link
          to="/workspace"
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          工作区
        </Link>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-6">
        {loading ? (
          <p className="text-muted-foreground">…</p>
        ) : !ev ? (
          <p className="text-destructive">{err ?? "未找到事件"}</p>
        ) : (
          <>
            {err ? (
              <p className="text-sm text-destructive" role="alert">
                {err}
              </p>
            ) : null}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">标题</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">摘要</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">标签</Label>
                  <Input
                    id="tags"
                    value={tagsStr}
                    onChange={(e) => setTagsStr(e.target.value)}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => void saveMeta()}
                    disabled={saving}
                  >
                    {saving ? "保存中…" : "保存"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void toggleHighlight()}
                  >
                    {ev.is_highlighted ? "取消高亮" : "设为高亮"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void navigate("/review")}
                  >
                    返回
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>模块</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {ev.modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">—</p>
                ) : (
                  ev.modules.map((m) => (
                    <div key={m.id} className="space-y-2 rounded-lg border p-3">
                      <p className="text-sm font-medium">
                        {m.module_type}
                        {m.title ? ` · ${m.title}` : ""}
                      </p>
                      <Textarea
                        className="font-mono text-xs"
                        rows={8}
                        value={moduleEdits[m.id] ?? "{}"}
                        onChange={(e) =>
                          setModuleEdits((prev) => ({
                            ...prev,
                            [m.id]: e.target.value,
                          }))
                        }
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => void saveModule(m.id)}
                      >
                        保存该模块
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}
