import subprocess
import tempfile
from typing import Optional

import ffmpeg

from config import TranscribeConfig

# optional backends
_BACKENDS = {}
try:
    from faster_whisper import WhisperModel as _FWModel  # type: ignore
    _BACKENDS["faster_whisper"] = _FWModel
except Exception:
    pass
try:
    import whisper as _whisper  # type: ignore
    _BACKENDS["whisper"] = _whisper
except Exception:
    pass


def extract_audio(input_path: str, out_wav: Optional[str] = None) -> str:
    if out_wav is None:
        fd, out_wav = tempfile.mkstemp(suffix=".wav"); import os; os.close(fd)
    (
        ffmpeg
        .input(input_path)
        .output(out_wav, ac=1, ar="16000", format="wav", loglevel="error")
        .overwrite_output()
        .run()
    )
    return out_wav


def _cuda_available() -> bool:
    try:
        out = subprocess.run(["nvidia-smi"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return out.returncode == 0
    except Exception:
        return False


def transcribe(input_path: str, cfg: TranscribeConfig = TranscribeConfig(), language: Optional[str] = None) -> str:
    if not _BACKENDS:
        raise RuntimeError("No transcription backend installed. Install `faster-whisper` or `openai-whisper`.")

    wav = extract_audio(input_path)

    # choose backend
    options = []
    if cfg.backend in ("auto", "faster_whisper") and "faster_whisper" in _BACKENDS:
        options.append("faster_whisper")
    if cfg.backend in ("auto", "whisper") and "whisper" in _BACKENDS:
        options.append("whisper")
    if not options:
        raise RuntimeError("Requested transcribe backend not available.")

    if options[0] == "faster_whisper":
        device = "cuda" if (cfg.device == "auto" and _cuda_available()) else (cfg.device if cfg.device != "auto" else "cpu")
        compute_type = cfg.compute_type if cfg.compute_type != "auto" else ("float16" if device == "cuda" else "int8")
        model = _BACKENDS["faster_whisper"](cfg.model_size, device=device, compute_type=compute_type)
        segments, info = model.transcribe(wav, language=language)
        return "".join(seg.text for seg in segments).strip()

    # fallback whisper
    model = _BACKENDS["whisper"].load_model(cfg.model_size)
    result = model.transcribe(wav, language=language) if language else model.transcribe(wav)
    return (result.get("text") or "").strip()
