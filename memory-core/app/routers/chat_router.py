from __future__ import annotations

import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.agents.langchain_chat import stream_chat
from app.schemas.chat import ChatStreamRequest

log = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def _tuple_messages(body: ChatStreamRequest) -> list[tuple[str, str]]:
    return [(m.role, m.content) for m in body.messages]


@router.post("/stream")
async def chat_stream(body: ChatStreamRequest):
    msgs = _tuple_messages(body)

    async def gen():
        async for piece in stream_chat(msgs):
            yield f"data: {json.dumps({'token': piece}, ensure_ascii=False)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(gen(), media_type="text/event-stream")


@router.websocket("/ws")
async def chat_ws(ws: WebSocket):
    await ws.accept()
    try:
        await ws.send_json(
            {
                "type": "ready",
                "hint": '发送 {"type":"query","text":"..."}；服务端使用 LangChain + 记忆 RAG（需配置 API Key）。',
            }
        )
        while True:
            raw = await ws.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await ws.send_json({"type": "error", "detail": "invalid json"})
                continue
            if msg.get("type") != "query":
                await ws.send_json({"type": "error", "detail": "unknown message type"})
                continue
            text = str(msg.get("text", ""))
            await ws.send_json({"type": "start", "role": "assistant"})
            try:
                async for piece in stream_chat([("user", text)]):
                    if piece:
                        await ws.send_json({"type": "token", "text": piece})
            except Exception as e:
                log.exception("ws chat")
                await ws.send_json({"type": "error", "detail": str(e)})
            await ws.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass
