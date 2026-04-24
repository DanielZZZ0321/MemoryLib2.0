import type { EventListItem } from "@/lib/api";

export type SharedMemoryElement =
  | {
      kind: "event";
      eventId: string;
      title: string;
      summary?: string;
      thumbnailUrl?: string;
    }
  | {
      kind: "media";
      mediaId: string;
      eventId?: string;
      mediaType: "image" | "video" | "audio";
      url: string;
    }
  | {
      kind: "note";
      noteId: string;
      eventId?: string;
      content: string;
    }
  | {
      kind: "keyword";
      keyword: string;
      sourceIndex: string;
    };

export const sharedMemoryMime = "application/x-memoria-element";

export function eventToSharedElement(
  event: EventListItem,
): SharedMemoryElement {
  return {
    kind: "event",
    eventId: event.id,
    title: event.title,
    summary: event.summary ?? undefined,
  };
}

export function writeSharedElementDragData(
  dataTransfer: DataTransfer,
  element: SharedMemoryElement,
): void {
  const payload = JSON.stringify(element);
  dataTransfer.setData(sharedMemoryMime, payload);
  dataTransfer.setData("application/json", payload);
  dataTransfer.setData(
    "text/plain",
    element.kind === "event"
      ? element.title
      : element.kind === "keyword"
        ? element.keyword
        : payload,
  );
  dataTransfer.effectAllowed = "copy";
}

export function readSharedElementDragData(
  dataTransfer: DataTransfer,
): SharedMemoryElement | null {
  const raw =
    dataTransfer.getData(sharedMemoryMime) ||
    dataTransfer.getData("application/json");
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as SharedMemoryElement;
    if (!parsed || typeof parsed !== "object" || !("kind" in parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
