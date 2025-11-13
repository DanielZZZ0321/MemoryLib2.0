import os
import io
import base64
import tempfile
import subprocess
from dataclasses import dataclass
from typing import List, Tuple, Optional, Iterable, Dict, Union

import cv2
import numpy as np
from moviepy.editor import VideoFileClip, concatenate_videoclips
import ffmpeg

# Scene detection (PySceneDetect)
from scenedetect import VideoManager, SceneManager
from scenedetect.detectors import ContentDetector

# OpenAI-compatible client
from openai import OpenAI

# Try to load transcribers
_TRANSCRIBER_BACKENDS = {}
try:
    from faster_whisper import WhisperModel as _FWModel  # type: ignore
    _TRANSCRIBER_BACKENDS["faster_whisper"] = _FWModel
except Exception:
    pass
try:
    import whisper as _whisper  # type: ignore
    _TRANSCRIBER_BACKENDS["whisper"] = _whisper
except Exception:
    pass


@dataclass
class LLMConfig:
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: str = "gemini-2.5-pro"
    # safety knobs
    max_images: int = 12
    image_detail: str = "auto"


@dataclass
class TranscribeConfig:
    backend: str = "auto"   # "faster_whisper"|"whisper"|"auto"
    model_size: str = "medium"  # for faster-whisper / whisper
    device: str = "auto"    # "cuda"|"cpu"|"auto"
    compute_type: str = "auto"  # for faster-whisper (e.g., "float16","int8")


@dataclass
class CompressConfig:
    # Choose one: bitrate or CRF (if both set, CRF wins)
    target_bitrate: Optional[str] = None  # e.g., "2500k"
    crf: Optional[int] = 23               # 18-28 is sane range for H.264
    preset: str = "medium"                # ffmpeg x264 preset
    audio_bitrate: str = "128k"
    two_pass: bool = False


class VideoToolkit:
    """
    A compact, pragmatic video toolkit:
      - segment(video): list of (start, end) in seconds via PySceneDetect
      - sample(video): sample N evenly spaced frames, or per-scene keyframes
      - transcribe(video): speech-to-text via Faster-Whisper or Whisper
      - merge(clips): concatenate multiple video paths into one file
      - compress(video): re-encode with bitrate/CRF/preset
      - understand(video): call OpenAI-compatible vision endpoint using sampled frames (+ transcript)
    """

    def __init__(
        self,
        llm: Optional[LLMConfig] = None,
        transcribe_cfg: Optional[TranscribeConfig] = None,
        compress_cfg: Optional[CompressConfig] = None,
    ):
        self.llm = llm or LLMConfig(
            api_key=os.getenv("AIHUBMIX_API_KEY"),
            base_url=os.getenv("BASE_URL"),
            model=os.getenv("MODEL_NAME") or "gemini-2.5-pro",
        )
        self.transcribe_cfg = transcribe_cfg or TranscribeConfig()
        self.compress_cfg = compress_cfg or CompressConfig()

        # Lazy init client for LLM
        self._client: Optional[OpenAI] = None
        if self.llm.api_key and self.llm.base_url:
            self._client = OpenAI(api_key=self.llm.api_key, base_url=self.llm.base_url)

    # -----------------------------
    # Basic media utilities
    # -----------------------------
    @staticmethod
    def video_duration(path: str) -> float:
        clip = VideoFileClip(path)
        dur = float(clip.duration)
        clip.close()
        return dur

    @staticmethod
    def extract_audio(path: str, out_wav: Optional[str] = None) -> str:
        if out_wav is None:
            fd, out_wav = tempfile.mkstemp(suffix=".wav")
            os.close(fd)
        (
            ffmpeg
            .input(path)
            .output(out_wav, ac=1, ar="16000", format="wav", loglevel="error")
            .overwrite_output()
            .run()
        )
        return out_wav

    # -----------------------------
    # 1) Segment
    # -----------------------------
    def segment(
        self,
        path: str,
        threshold: float = 27.0,
        min_scene_len: int = 12,  # frames
    ) -> List[Tuple[float, float]]:
        """Return list of (start_sec, end_sec) scenes."""
        video_manager = VideoManager([path])
        scene_manager = SceneManager()
        scene_manager.add_detector(ContentDetector(threshold=threshold, min_scene_len=min_scene_len))

        video_manager.set_downscale_factor()
        video_manager.start()
        scene_manager.detect_scenes(video_manager)
        scene_list = scene_manager.get_scene_list(video_manager.get_base_timecode())

        # Convert to seconds
        bounds = []
        for start_time, end_time in scene_list:
            bounds.append((start_time.get_seconds(), end_time.get_seconds()))
        if not bounds:
            # If no cuts detected, return entire span
            dur = self.video_duration(path)
            bounds = [(0.0, dur)]
        video_manager.release()
        return bounds

    # -----------------------------
    # 2) Sample
    # -----------------------------
    def sample_frames(
        self,
        path: str,
        num_frames: int = 8,
        resize_to: Optional[Tuple[int, int]] = None,
        per_scene: bool = False,
        scenes: Optional[List[Tuple[float, float]]] = None,
    ) -> List[np.ndarray]:
        """
        Sample frames:
          - evenly across whole video (default), or
          - per_scene=True → 1 frame per scene midpoint (or more if num_frames>1: evenly within each scene).
        """
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {path}")

        frames: List[np.ndarray] = []
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        def read_frame_at(t_sec: float):
            cap.set(cv2.CAP_PROP_POS_MSEC, t_sec * 1000.0)
            ok, frame = cap.read()
            if ok:
                if resize_to:
                    frame = cv2.resize(frame, resize_to, interpolation=cv2.INTER_AREA)
                frames.append(frame)

        if per_scene:
            if scenes is None:
                scenes = self.segment(path)
            for (s, e) in scenes:
                if num_frames <= 1:
                    mid = (s + e) / 2
                    read_frame_at(mid)
                else:
                    ts = np.linspace(s, e, num_frames).tolist()
                    for t in ts:
                        read_frame_at(t)
        else:
            # whole-video sampling
            if total <= 0:
                dur = self.video_duration(path)
                ts = np.linspace(0.0, max(0.01, dur - 0.01), num_frames).tolist()
                for t in ts:
                    read_frame_at(t)
            else:
                idxs = np.linspace(0, total - 1, num_frames).astype(int).tolist()
                for idx in idxs:
                    cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
                    ok, frame = cap.read()
                    if ok:
                        if resize_to:
                            frame = cv2.resize(frame, resize_to, interpolation=cv2.INTER_AREA)
                        frames.append(frame)

        cap.release()
        return frames

    @staticmethod
    def frames_to_b64_data_urls(frames: Iterable[np.ndarray], quality: int = 90) -> List[str]:
        urls = []
        for f in frames:
            ok, buf = cv2.imencode(".jpg", f, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
            if not ok:
                continue
            b64 = base64.b64encode(buf.tobytes()).decode("utf-8")
            urls.append(f"data:image/jpeg;base64,{b64}")
        return urls

    # -----------------------------
    # 3) Transcribe
    # -----------------------------
    def transcribe(self, path: str, language: Optional[str] = None) -> str:
        """Return transcription text. Prefers Faster-Whisper if available."""
        if not _TRANSCRIBER_BACKENDS:
            raise RuntimeError("No transcription backend found. Install `faster-whisper` or `openai-whisper`.")

        wav = self.extract_audio(path)

        backend = self.transcribe_cfg.backend
        # Auto pick priority: faster_whisper -> whisper
        candidates = []
        if backend in ("auto", "faster_whisper"):
            if "faster_whisper" in _TRANSCRIBER_BACKENDS:
                candidates.append("faster_whisper")
        if backend in ("auto", "whisper"):
            if "whisper" in _TRANSCRIBER_BACKENDS:
                candidates.append("whisper")

        if not candidates:
            raise RuntimeError("Requested transcribe backend not installed.")

        if candidates[0] == "faster_whisper":
            device = None
            if self.transcribe_cfg.device == "auto":
                device = "cuda" if self._cuda_available() else "cpu"
            else:
                device = self.transcribe_cfg.device
            compute_type = self.transcribe_cfg.compute_type if self.transcribe_cfg.compute_type != "auto" else (
                "float16" if device == "cuda" else "int8"
            )
            model = _TRANSCRIBER_BACKENDS["faster_whisper"](self.transcribe_cfg.model_size, device=device, compute_type=compute_type)
            segments, info = model.transcribe(wav, language=language)
            text = "".join(seg.text for seg in segments)
            return text.strip()

        # fallback to openai/whisper (CPU)
        model = _TRANSCRIBER_BACKENDS["whisper"].load_model(self.transcribe_cfg.model_size)
        result = model.transcribe(wav, language=language) if language else model.transcribe(wav)
        return (result.get("text") or "").strip()

    @staticmethod
    def _cuda_available() -> bool:
        try:
            out = subprocess.run(["nvidia-smi"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            return out.returncode == 0
        except Exception:
            return False

    # -----------------------------
    # 4) Merge
    # -----------------------------
    def merge(self, inputs: List[str], output_path: str, method: str = "moviepy") -> str:
        """
        Merge multiple video files into one. method="moviepy" or "ffmpeg".
        """
        if method == "moviepy":
            clips = [VideoFileClip(p) for p in inputs]
            merged = concatenate_videoclips(clips, method="compose")
            merged.write_videofile(output_path, codec="libx264", audio_codec="aac", verbose=False, logger=None)
            merged.close()
            for c in clips:
                c.close()
            return output_path
        else:
            # Use concat demuxer (requires identical codecs); otherwise re-encode.
            with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False) as f:
                for p in inputs:
                    f.write(f"file '{os.path.abspath(p)}'\n")
                list_path = f.name
            (
                ffmpeg
                .input(list_path, format="concat", safe=0)
                .output(output_path, c="copy")
                .overwrite_output()
                .run(capture_stdout=True, capture_stderr=True)
            )
            return output_path

    # -----------------------------
    # 5) Compress
    # -----------------------------
    def compress(self, input_path: str, output_path: str) -> str:
        cfg = self.compress_cfg
        stream = ffmpeg.input(input_path)
        kwargs = {"preset": cfg.preset}
        if cfg.crf is not None:
            kwargs.update({"crf": cfg.crf, "c:v": "libx264"})
        elif cfg.target_bitrate:
            kwargs.update({"b:v": cfg.target_bitrate, "c:v": "libx264"})
        else:
            kwargs.update({"crf": 23, "c:v": "libx264"})
        out = (
            ffmpeg
            .output(stream, output_path, acodec="aac", audio_bitrate=cfg.audio_bitrate, **kwargs)
            .overwrite_output()
        )
        if cfg.two_pass and cfg.target_bitrate:
            # 2-pass bitrate mode (video only)
            pass1 = (
                ffmpeg
                .output(stream, "NUL" if os.name == "nt" else "/dev/null",
                        **{"c:v": "libx264", "b:v": cfg.target_bitrate, "pass": 1, "f": "mp4"})
                .overwrite_output()
            )
            pass1.run(quiet=True)
            out = (
                ffmpeg
                .output(stream, output_path, **{"c:v": "libx264", "b:v": cfg.target_bitrate, "pass": 2, "acodec": "aac", "audio_bitrate": cfg.audio_bitrate})
                .overwrite_output()
            )
        out.run(quiet=True)
        return output_path

    # -----------------------------
    # 6) Understand (Vision LLM)
    # -----------------------------
    def understand(
        self,
        path: str,
        prompt: Optional[str] = None,
        num_frames: int = 8,
        include_transcript: bool = True,
        per_scene: bool = False,
        resize_to: Optional[Tuple[int, int]] = (640, 360),
        extra_instructions: Optional[str] = None,
    ) -> str:
        """
        Calls an OpenAI-compatible chat.completions endpoint (e.g., AiHubMix "gemini-2.5-pro")
        by sending sampled frames as base64 image data URLs (+ optional transcript).
        """
        if self._client is None:
            raise RuntimeError("LLM client not initialized. Provide API key/base_url in LLMConfig or .env.")

        frames = self.sample_frames(path, num_frames=num_frames, resize_to=resize_to, per_scene=per_scene)
        data_urls = self.frames_to_b64_data_urls(frames)[: self.llm.max_images]

        transcript_text = ""
        if include_transcript:
            try:
                transcript_text = self.transcribe(path)
            except Exception as e:
                transcript_text = f"(Transcription unavailable: {e})"

        instruction = prompt or (
            "You are a meticulous video analyst. Based ONLY on the images (and transcript if present):\n"
            "1) Title (max 12 words)\n"
            "2) Setting/scene\n"
            "3) 5–7 key events in order (bulleted)\n"
            "4) Notable people/objects/text\n"
            "5) 3–5 sentence summary\n"
            "If uncertain, state the uncertainty."
        )
        if extra_instructions:
            instruction += "\n\nAdditional instructions:\n" + extra_instructions

        content: List[Dict] = [{"type": "text", "text": instruction}]
        if transcript_text:
            content.append({
                "type": "text",
                "text": f"ASR Transcript (may be imperfect):\n{transcript_text[:6000]}"
            })
        for url in data_urls:
            content.append({"type": "input_image", "image_url": {"url": url, "detail": self.llm.image_detail}})

        resp = self._client.chat.completions.create(
            model=self.llm.model,
            messages=[{"role": "user", "content": content}],
        )
        return resp.choices[0].message.content

    # -----------------------------
    # Helpers
    # -----------------------------
    @staticmethod
    def save_frames(frames: Iterable[np.ndarray], out_dir: str, prefix: str = "frame"):
        os.makedirs(out_dir, exist_ok=True)
        paths = []
        for i, f in enumerate(frames, 1):
            p = os.path.join(out_dir, f"{prefix}_{i:03d}.jpg")
            cv2.imwrite(p, f, [int(cv2.IMWRITE_JPEG_QUALITY), 92])
            paths.append(p)
        return paths
