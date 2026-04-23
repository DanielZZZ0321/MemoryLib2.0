import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  type ChatMessage,
  streamChatCompletion,
} from "@/lib/api";

type Props = {
  systemHint?: string;
  className?: string;
};

export function ChatPanel({ systemHint, className }: Props) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<ChatMessage[]>([]);
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
    const base: ChatMessage[] = [
      ...(systemHint
        ? [{ role: "system" as const, content: systemHint }]
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
  }, [input, log, streaming, systemHint]);

  return (
    <div className={className}>
      <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3 text-sm">
        {log.length === 0 ? null : (
          log.map((m, i) => (
            <div
              key={`${i}-${m.role}`}
              className={
                m.role === "user"
                  ? "text-foreground"
                  : "whitespace-pre-wrap text-muted-foreground"
              }
            >
              <span className="font-medium text-xs uppercase text-muted-foreground">
                {m.role === "user" ? "你" : "助手"}
              </span>
              <div className="mt-0.5">{m.content || (streaming ? "…" : "")}</div>
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
        className="mt-2 min-h-[72px]"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        disabled={streaming}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            void send();
          }
        }}
      />
      <Button
        type="button"
        className="mt-2"
        size="sm"
        onClick={() => void send()}
        disabled={streaming || !input.trim()}
      >
        {streaming ? "生成中…" : "发送"}
      </Button>
    </div>
  );
}
