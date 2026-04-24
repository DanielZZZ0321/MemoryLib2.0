import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Brain, HeartPulse, Palette, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EventListItem, WorkspaceRow } from "@/lib/api";
import {
  type SharedMemoryElement,
  readSharedElementDragData,
} from "@/lib/shared-memory-element";
import { cn } from "@/lib/utils";

export type TaskCanvasDraft = {
  template: "color-diary" | "event-logic" | "decision-making" | "emotion-healing";
  elements: SharedMemoryElement[];
  updatedAt?: string;
};

type Props = {
  workspace: WorkspaceRow;
  events: EventListItem[];
  saving?: boolean;
  onSave: (draft: TaskCanvasDraft) => void;
};

const templates: Array<{
  id: TaskCanvasDraft["template"];
  label: string;
  icon: typeof Palette;
}> = [
  { id: "color-diary", label: "Color Diary", icon: Palette },
  { id: "event-logic", label: "Event Logic", icon: BookOpenText },
  { id: "decision-making", label: "Decision Making", icon: Brain },
  { id: "emotion-healing", label: "Emotion Healing", icon: HeartPulse },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readCanvasDraft(workspace: WorkspaceRow): TaskCanvasDraft | null {
  const draft = workspace.filter_criteria.canvasDraft;
  if (!isRecord(draft) || typeof draft.template !== "string") {
    return null;
  }
  return {
    template: draft.template as TaskCanvasDraft["template"],
    elements: Array.isArray(draft.elements)
      ? (draft.elements as SharedMemoryElement[])
      : [],
    updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : undefined,
  };
}

function elementLabel(element: SharedMemoryElement): string {
  if (element.kind === "event") {
    return element.title;
  }
  if (element.kind === "keyword") {
    return element.keyword;
  }
  if (element.kind === "note") {
    return element.content.slice(0, 36);
  }
  return element.url;
}

export function TaskCanvas({ workspace, events, saving, onSave }: Props) {
  const savedDraft = useMemo(() => readCanvasDraft(workspace), [workspace]);
  const [template, setTemplate] = useState<TaskCanvasDraft["template"]>(
    savedDraft?.template ?? "color-diary",
  );
  const [elements, setElements] = useState<SharedMemoryElement[]>(
    savedDraft?.elements ?? [],
  );
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    setTemplate(savedDraft?.template ?? "color-diary");
    setElements(savedDraft?.elements ?? []);
  }, [savedDraft, workspace.id]);

  const fallbackElements = useMemo<SharedMemoryElement[]>(
    () =>
      events.slice(0, 3).map((event) => ({
        kind: "event",
        eventId: event.id,
        title: event.title,
        summary: event.summary ?? undefined,
      })),
    [events],
  );
  const workspaceEventIds = useMemo(
    () => new Set(events.map((event) => event.id)),
    [events],
  );
  const scopedElements = useMemo(
    () =>
      elements.filter(
        (element) =>
          element.kind !== "event" || workspaceEventIds.has(element.eventId),
      ),
    [elements, workspaceEventIds],
  );
  const visibleElements =
    scopedElements.length > 0 ? scopedElements : fallbackElements;

  return (
    <Card className="min-h-full shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-base">
          <span>Task Canvas</span>
          <Badge variant="outline">{workspace.name}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {templates.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition",
                  template === item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border hover:bg-muted",
                )}
                onClick={() => setTemplate(item.id)}
              >
                <Icon className="size-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        <div
          data-slot="task-canvas-dropzone"
          className={cn(
            "min-h-[560px] rounded-lg border border-dashed bg-background p-4 transition-colors",
            dragActive ? "border-primary bg-primary/5" : "border-border",
          )}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
            event.dataTransfer.dropEffect = "copy";
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const element = readSharedElementDragData(event.dataTransfer);
            if (!element) {
              return;
            }
            if (
              element.kind === "event" &&
              !workspaceEventIds.has(element.eventId)
            ) {
              return;
            }
            setElements((current) => [...current, element]);
          }}
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <Badge variant="secondary">
              {templates.find((item) => item.id === template)?.label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Drop events, media, notes, or keywords
            </span>
          </div>
          <div className="grid min-h-[470px] gap-3 md:grid-cols-3">
            {["Memory", "Color / Mood", "Diary Draft"].map((zone, zoneIndex) => (
              <div key={zone} className="rounded-md border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">
                  {zone}
                </p>
                <div className="space-y-2">
                  {visibleElements
                    .filter((_, index) => index % 3 === zoneIndex)
                    .map((element, index) => (
                      <div
                        key={`${element.kind}-${elementLabel(element)}-${index}`}
                        className="rounded-md bg-muted/50 p-2 text-sm"
                      >
                        <p className="font-medium">{elementLabel(element)}</p>
                        {element.kind === "event" && element.summary ? (
                          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                            {element.summary}
                          </p>
                        ) : null}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button
          type="button"
          variant="secondary"
          disabled={saving}
          onClick={() =>
            onSave({
              template,
              elements: visibleElements,
              updatedAt: new Date().toISOString(),
            })
          }
        >
          <Save className="size-4" />
          {saving ? "Saving..." : "Save Canvas"}
        </Button>
      </CardContent>
    </Card>
  );
}
