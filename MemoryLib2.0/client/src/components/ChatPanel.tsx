import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type ChatMessage, streamChatCompletion } from "@/lib/api";
import {
  type SharedMemoryElement,
  readSharedElementDragData,
} from "@/lib/shared-memory-element";
import { cn } from "@/lib/utils";

type Props = {
  systemHint?: string;
  className?: string;
};

export function ChatPanel({ systemHint, className }: Props) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<ChatMessage[]>([]);
  const [attachments, setAttachments] = useState<SharedMemoryElement[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) {
      return;
    }
    setError(null);
    setInput("");
    const userMsg: ChatMessage = { role: "user", content: text };
    const attachmentHint =
      attachments.length > 0
        ? `\n\nAttached memory elements:\n${attachments
            .map((attachment) => JSON.stringify(attachment))
            .join("\n")}`
        : "";
    const base: ChatMessage[] = [
      ...(systemHint
        ? [{ role: "system" as const, content: `${systemHint}${attachmentHint}` }]
        : []),
      ...log,
      userMsg,
    ];
    setLog((prev) => [...prev, userMsg, { role: "assistant", content: "" }]);
    setStreaming(true);
    let acc = "";
    try {
      await streamChatCompletion(base, (delta) => {
        acc += delta;
        setLog((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role === "assistant") {
            next[next.length - 1] = { role: "assistant", content: acc };
          }
          return next;
        });
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLog((prev) => prev.slice(0, -2));
    } finally {
      setStreaming(false);
    }
  }, [attachments, input, log, streaming, systemHint]);

  return (
    <div
      data-slot="chat-panel"
      className={cn(
        "flex flex-col rounded-md border border-transparent p-2 transition-colors",
        dragActive ? "border-primary bg-primary/5" : "",
        className,
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
          setError("Unsupported drag payload.");
          return;
        }
        setError(null);
        setAttachments((current) => [...current, element]);
      }}
    >
      {attachments.length > 0 ? (
        <div className="mb-2 space-y-1">
          <p className="text-xs font-medium text-muted-foreground">
            Attachments
          </p>
          <div className="flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <button
                key={`${attachment.kind}-${index}`}
                type="button"
                className="rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground"
                onClick={() =>
                  setAttachments((current) =>
                    current.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
                title="Remove attachment"
              >
                {attachment.kind === "event"
                  ? attachment.title
                  : attachment.kind === "keyword"
                    ? attachment.keyword
                    : attachment.kind}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
        {log.length === 0 ? null : (
          log.map((message, index) => (
            <div
              key={`${index}-${message.role}`}
              className={
                message.role === "user"
                  ? "text-foreground"
                  : "whitespace-pre-wrap text-muted-foreground"
              }
            >
              <span className="text-xs font-medium uppercase text-muted-foreground">
                {message.role === "user" ? "You" : "Assistant"}
              </span>
              <div className="mt-0.5">
                {message.content || (streaming ? "..." : "")}
              </div>
            </div>
          ))
        )}
      </div>
      {error ? (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Textarea
        className="mt-2 min-h-[88px] shrink-0"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        disabled={streaming}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            void send();
          }
        }}
      />
      <Button
        type="button"
        className="mt-2 shrink-0"
        size="sm"
        onClick={() => void send()}
        disabled={streaming || !input.trim()}
      >
        {streaming ? "Generating..." : "Send"}
      </Button>
    </div>
  );
}
