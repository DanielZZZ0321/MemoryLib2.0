# gemini_client.py

import os
from dotenv import load_dotenv
from google import genai

_client = None

def build_client() -> genai.Client:
    """
    初始化 AiHubMix Gemini 客户端，使用 .env 中的 AIHUBMIX_API_KEY。
    整个项目统一用这个函数拿 client。
    """
    global _client
    if _client is not None:
        return _client

    load_dotenv()
    api_key = os.getenv("AIHUBMIX_API_KEY")
    if not api_key:
        raise RuntimeError("Missing AIHUBMIX_API_KEY in environment.")

    _client = genai.Client(
        api_key=api_key,
        http_options={"base_url": "https://aihubmix.com/gemini"}
    )
    return _client
