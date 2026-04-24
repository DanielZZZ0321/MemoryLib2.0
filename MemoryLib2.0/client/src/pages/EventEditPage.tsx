import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Clock,
  FileJson,
  FileText,
  ImageIcon,
  LayoutList,
  Music,
  Plus,
  Save,
  Star,
  Video,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  apiUrl,
  type EventDetail,
  type EventModuleDTO,
  fetchEvent,
  setEventHighlight,
  updateEvent,
  updateEventModule,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePageContextStore } from "@/stores/page-context-store";

type EventDetailWithMeta = EventDetail & {
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  event_type?: string | null;
};

type MediaItem = {
  type: "image" | "video" | "audio";
  url: string;
  title?: string;
  caption?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mediaUrl(value: string): string {
  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value;
  }
  return apiUrl(value.startsWith("/") ? value : `/${value}`);
}

function eventThumbUrl(eventId: string): string {
  return apiUrl(`/api/files/event-thumb?eventId=${encodeURIComponent(eventId)}`);
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function extractModuleText(module: EventModuleDTO): string | null {
  const content = module.content;
  if (!isRecord(content)) {
    return null;
  }
  return (
    stringValue(content.markdown) ??
    stringValue(content.summary) ??
    stringValue(content.note) ??
    stringValue(content.text)
  );
}

function extractMedia(module: EventModuleDTO): MediaItem[] {
  const content = module.content;
  if (!isRecord(content)) {
    return [];
  }
  const buckets: Array<{ key: string; type: MediaItem["type"] }> = [
    { key: "images", type: "image" },
    { key: "photos", type: "image" },
    { key: "videos", type: "video" },
    { key: "audios", type: "audio" },
    { key: "audio", type: "audio" },
    { key: "media", type: "image" },
  ];
  return buckets.flatMap(({ key, type }) => {
    const value = content[key];
    if (!Array.isArray(value)) {
      return [];
    }
    return value.flatMap((item): MediaItem[] => {
      if (typeof item === "string") {
        return [{ type, url: item }];
      }
      if (!isRecord(item) || typeof item.url !== "string") {
        return [];
      }
      const itemType = stringValue(item.type);
      return [
        {
          type:
            itemType === "video" || itemType === "audio" || itemType === "image"
              ? itemType
              : type,
          url: item.url,
          title: stringValue(item.title) ?? undefined,
          caption: stringValue(item.caption) ?? undefined,
        },
      ];
    });
  });
}

function moduleGroup(module: EventModuleDTO): "summary" | "media" | "notes" | "raw" {
  if (module.module_type.includes("summary")) {
    return "summary";
  }
  if (
    module.module_type.includes("photo") ||
    module.module_type.includes("image") ||
    module.module_type.includes("video") ||
    module.module_type.includes("audio")
  ) {
    return "media";
  }
  if (module.module_type.includes("note")) {
    return "notes";
  }
  return "raw";
}

function dateLabel(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function moduleLabel(module: EventModuleDTO): string {
  return module.title ?? module.module_type.replace(/[_-]+/gu, " ");
}

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setPageContext = usePageContextStore((state) => state.setContext);
  const [ev, setEv] = useState<EventDetailWithMeta | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [moduleEdits, setModuleEdits] = useState<Record<string, string>>({});
  const [expandedRaw, setExpandedRaw] = useState<Record<string, boolean>>({});

  const fromWorkspaceId = searchParams.get("workspace");
  const returnTarget =
    searchParams.get("from") === "workspace" && fromWorkspaceId
      ? `/workspace?workspace=${encodeURIComponent(fromWorkspaceId)}`
      : "/review";
  const returnLabel = fromWorkspaceId ? "Back to Workspace" : "Back to Graph";

  const load = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const event = (await fetchEvent(id)) as EventDetailWithMeta;
      setEv(event);
      setTitle(event.title);
      setSummary(event.summary ?? "");
      setTagsStr(event.tags.join(", "));
      const edits: Record<string, string> = {};
      for (const module of event.modules) {
        edits[module.id] = JSON.stringify(module.content ?? {}, null, 2);
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

  useEffect(() => {
    setPageContext({
      kind: "event-editor",
      title: ev ? `Editing ${ev.title}` : "Event Editor",
      eventId: id,
      workspaceId: fromWorkspaceId ?? undefined,
      details: ev
        ? {
            tags: ev.tags,
            moduleCount: ev.modules.length,
            source: searchParams.get("from") ?? "direct",
          }
        : undefined,
    });
  }, [ev, fromWorkspaceId, id, searchParams, setPageContext]);

  const moduleBuckets = useMemo(() => {
    const buckets = {
      summary: [] as EventModuleDTO[],
      media: [] as EventModuleDTO[],
      notes: [] as EventModuleDTO[],
      raw: [] as EventModuleDTO[],
    };
    for (const module of ev?.modules ?? []) {
      buckets[moduleGroup(module)].push(module);
    }
    return buckets;
  }, [ev]);

  const media = useMemo(
    () => moduleBuckets.media.flatMap((module) => extractMedia(module)),
    [moduleBuckets.media],
  );
  const images = useMemo(
    () => media.filter((item) => item.type === "image"),
    [media],
  );
  const videos = useMemo(
    () => media.filter((item) => item.type === "video"),
    [media],
  );
  const audios = useMemo(
    () => media.filter((item) => item.type === "audio"),
    [media],
  );

  const summaryText = useMemo(() => {
    for (const module of moduleBuckets.summary) {
      const text = extractModuleText(module);
      if (text) {
        return text;
      }
    }
    return ev?.summary ?? "";
  }, [ev?.summary, moduleBuckets.summary]);
  const moduleSummary = useMemo<Array<{
    label: string;
    count: number;
    Icon: typeof FileText;
  }>>(
    () => [
      { label: "Summary", count: moduleBuckets.summary.length, Icon: FileText },
      { label: "Photos", count: images.length, Icon: ImageIcon },
      { label: "Videos", count: videos.length, Icon: Video },
      { label: "Audio", count: audios.length, Icon: Music },
      { label: "Raw", count: moduleBuckets.raw.length, Icon: FileJson },
    ],
    [audios.length, images.length, moduleBuckets.raw.length, moduleBuckets.summary.length, videos.length],
  );

  const saveMeta = async () => {
    if (!id) {
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const tags = tagsStr
        .split(/[,\s;]+/u)
        .map((tag) => tag.trim())
        .filter(Boolean);
      const updated = (await updateEvent(id, {
        title,
        summary: summary || null,
        tags,
      })) as EventDetailWithMeta;
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
      const updated = (await updateEventModule(id, moduleId, {
        content,
      })) as EventDetailWithMeta;
      setEv(updated);
    } catch (e) {
      setErr(
        e instanceof SyntaxError
          ? "Module JSON is invalid."
          : e instanceof Error
            ? e.message
            : String(e),
      );
    }
  };

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-destructive">Missing event id.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            to={returnTarget}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            {returnLabel}
          </Link>
          <span className="text-lg font-semibold">Edit Event</span>
        </div>
        <Link
          to={fromWorkspaceId ? returnTarget : "/workspace"}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Workspace
        </Link>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading...</p>
        ) : !ev ? (
          <p className="text-destructive">{err ?? "Event not found."}</p>
        ) : (
          <>
            {err ? (
              <p className="text-sm text-destructive" role="alert">
                {err}
              </p>
            ) : null}

            <section className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="space-y-4">
                <Card className="overflow-hidden">
                  {images[0] ? (
                    <img
                      className="aspect-[4/3] w-full object-cover"
                      src={mediaUrl(images[0].url)}
                      alt={images[0].caption ?? images[0].title ?? ev.title}
                      onError={(event) => {
                        event.currentTarget.src = eventThumbUrl(ev.id);
                      }}
                    />
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center border-b border-dashed text-sm text-muted-foreground">
                      No key photo
                    </div>
                  )}
                  <CardContent className="space-y-3 p-4">
                    <div>
                      <p className="text-xs font-medium uppercase text-muted-foreground">
                        Key Photo
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm">
                        {images[0]?.caption ?? images[0]?.title ?? ev.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ev.is_highlighted ? (
                        <Badge variant="secondary">highlighted</Badge>
                      ) : null}
                      {ev.event_type ? (
                        <Badge variant="outline">{ev.event_type}</Badge>
                      ) : null}
                      {ev.location ? (
                        <Badge variant="outline">{ev.location}</Badge>
                      ) : null}
                    </div>
                    {dateLabel(ev.start_time) ? (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Clock className="mt-0.5 size-4" />
                        <span>{dateLabel(ev.start_time)}</span>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Modules</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {moduleSummary.map(({ label, count, Icon }) => {
                      return (
                        <div
                          key={label}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <Icon className="size-4 text-muted-foreground" />
                            {label}
                          </span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </aside>

              <div className="space-y-4">
                <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LayoutList className="size-4" />
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="summary">Summary</Label>
                      <Textarea
                        id="summary"
                        value={summary}
                        onChange={(event) => setSummary(event.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="tags">Tags</Label>
                      <Input
                        id="tags"
                        value={tagsStr}
                        onChange={(event) => setTagsStr(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {dateLabel(ev.start_time) ? (
                      <Badge variant="outline">{dateLabel(ev.start_time)}</Badge>
                    ) : null}
                    {ev.location ? (
                      <Badge variant="outline">{ev.location}</Badge>
                    ) : null}
                    {ev.event_type ? (
                      <Badge variant="outline">{ev.event_type}</Badge>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => void saveMeta()}
                      disabled={saving}
                    >
                      <Save className="size-4" />
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void toggleHighlight()}
                    >
                      <Star className="size-4" />
                      {ev.is_highlighted ? "Remove highlight" : "Set highlight"}
                    </Button>
                    <Button type="button" variant="outline" disabled>
                      <Plus className="size-4" />
                      Add module
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => void navigate(returnTarget)}
                    >
                      Return
                    </Button>
                  </div>
                </CardContent>
              </Card>

                <section className="rounded-lg border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h2 className="flex items-center gap-2 font-medium">
                      <FileText className="size-4" />
                      Event Summary
                    </h2>
                    <Badge variant="secondary">fixed module</Badge>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {summaryText || "No summary content yet."}
                  </p>
                </section>
              </div>
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">Media Modules</h2>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{images.length} photos</Badge>
                  <Badge variant="outline">{videos.length} videos</Badge>
                  <Badge variant="outline">{audios.length} audio</Badge>
                </div>
              </div>
              {media.length > 0 ? (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {media.map((item) => (
                    <figure
                      key={`${item.type}-${item.url}-${item.caption ?? item.title ?? ""}`}
                      className="overflow-hidden rounded-lg border bg-card"
                    >
                      {item.type === "video" ? (
                        <video
                          className="aspect-[4/3] w-full bg-muted object-cover"
                          src={mediaUrl(item.url)}
                          controls
                        />
                      ) : item.type === "audio" ? (
                        <div className="flex aspect-[4/3] items-center justify-center bg-muted p-4">
                          <audio className="w-full" src={mediaUrl(item.url)} controls />
                        </div>
                      ) : (
                        <img
                          className="aspect-[4/3] w-full object-cover"
                          src={mediaUrl(item.url)}
                          alt={item.caption ?? item.title ?? "Event media"}
                          loading="lazy"
                          onError={(event) => {
                            event.currentTarget.src = eventThumbUrl(ev.id);
                          }}
                        />
                      )}
                      <figcaption className="p-3 text-sm text-muted-foreground">
                        <span className="mr-2 font-medium text-foreground">
                          {item.type}
                        </span>
                        {item.caption ?? item.title ?? "Event media"}
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                  No media modules are attached to this event.
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">Raw Modules</h2>
                <Badge variant="outline">{ev.modules.length} total</Badge>
              </div>
              <div className="space-y-3">
                {ev.modules.map((module) => {
                  const expanded = expandedRaw[module.id] ?? false;
                  return (
                    <div key={module.id} className="rounded-lg border bg-card p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-medium">
                          {moduleLabel(module)}
                          <span className="ml-2 text-xs text-muted-foreground">
                            {module.module_type}
                          </span>
                        </p>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setExpandedRaw((current) => ({
                              ...current,
                              [module.id]: !expanded,
                            }))
                          }
                        >
                          <FileJson className="size-4" />
                          {expanded ? "Hide JSON" : "Edit JSON"}
                        </Button>
                      </div>
                      {expanded ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            className="font-mono text-xs"
                            rows={10}
                            value={moduleEdits[module.id] ?? "{}"}
                            onChange={(event) =>
                              setModuleEdits((prev) => ({
                                ...prev,
                                [module.id]: event.target.value,
                              }))
                            }
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => void saveModule(module.id)}
                          >
                            Save module
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
