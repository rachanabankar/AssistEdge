"""Runtime directories anchored to the backend, independent of the working directory."""
import os
from pathlib import Path

from config import settings

BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = (BACKEND_DIR / settings.UPLOAD_DIR).resolve()
CHROMA_PERSIST_DIR = (BACKEND_DIR / settings.CHROMA_PERSIST_DIR).resolve()
AVATAR_DIR = UPLOAD_DIR / "avatars"
SCREENSHOT_DIR = UPLOAD_DIR / "support_screenshots"


def create_directories():
    for directory in (UPLOAD_DIR, CHROMA_PERSIST_DIR, AVATAR_DIR, SCREENSHOT_DIR):
        os.makedirs(directory, exist_ok=True)
