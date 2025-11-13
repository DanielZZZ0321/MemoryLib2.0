#!/usr/bin/env python3
"""
Call Gemini via AiHubMix proxy using google-genai SDK.

Works for: image, audio, video, or other binary files.

Environment:
  AIHUBMIX_API_KEY=your_AiHubMix_key
"""

import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

def main():
    load_dotenv()
    api_key = os.getenv("AIHUBMIX_API_KEY")
    if not api_key:
        raise RuntimeError("Missing AIHUBMIX_API_KEY in environment.")

    # === Path to your local file ===
    file_path = "sample.mp4"
    mime_type = "video/mp4"

    with open(file_path, "rb") as f:
        file_bytes = f.read()

    # === Initialize AiHubMix Gemini client ===
    client = genai.Client(
        api_key=api_key,
        http_options={"base_url": "https://aihubmix.com/gemini"}
    )

    # === Build the content ===
    contents = types.Content(
        parts=[
            types.Part(
                inline_data=types.Blob(
                    data=file_bytes,
                    mime_type=mime_type
                )
            ),
            types.Part(
                text="Summarize the video, list 5 key events, and create a quiz with answers."
            )
        ]
    )

    # === Generate response ===
    response = client.models.generate_content(
        model="gemini-2.5-pro",  # or gemini-2.5-flash if faster
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction="You are a precise, structured video analyst.",
            max_output_tokens=1024,
            temperature=0.3,
            thinking_config=types.ThinkingConfig(
                thinking_budget=128,
                include_thoughts=False
            ),
            media_resolution=types.MediaResolution.MEDIA_RESOLUTION_LOW
        )
    )

    print("\n=== Model Output ===\n")
    print(response.text)
    print("\n=== Usage Metadata ===")
    print(response.usage_metadata)

if __name__ == "__main__":
    main()
