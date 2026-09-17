"""Pick inference device (Render/Vercel backends should force CPU)."""

from __future__ import annotations

import os


def inference_device(explicit: str | None = None) -> str:
    if explicit:
        return explicit
    env = (os.getenv("INFERENCE_DEVICE") or "").strip().lower()
    if env in {"cpu", "cuda", "mps"}:
        if env == "cuda":
            try:
                import torch
                if not torch.cuda.is_available():
                    return "cpu"
            except Exception:
                return "cpu"
        return env
    try:
        import torch
        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"
