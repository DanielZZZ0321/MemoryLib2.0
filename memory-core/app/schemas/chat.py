from pydantic import BaseModel, Field


class ChatMessageIn(BaseModel):
    role: str
    content: str


class ChatStreamRequest(BaseModel):
    messages: list[ChatMessageIn] = Field(default_factory=list)
