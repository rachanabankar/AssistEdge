"""Runtime directories anchored to the backend, independent of the working directory."""
import os
from pathlib import Path

from config import settings

BACKEND_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = (BACKEND_DIR / settings.UPLOAD_DIR).resolve()
CHROMA_PERSIST_DIR = (BACKEND_DIR / settings.CHROMA_PERSIST_DIR).resolve()
PUBLIC_UPLOAD_DIR = UPLOAD_DIR / "public"
KB_UPLOAD_DIR = UPLOAD_DIR / "kb"
AVATAR_DIR = PUBLIC_UPLOAD_DIR / "avatars"
SCREENSHOT_DIR = PUBLIC_UPLOAD_DIR / "support_screenshots"


def create_directories():
    for directory in (PUBLIC_UPLOAD_DIR, KB_UPLOAD_DIR, CHROMA_PERSIST_DIR, AVATAR_DIR, SCREENSHOT_DIR):
        os.makedirs(directory, exist_ok=True)
    # Preserve existing public URLs when upgrading the old upload layout.
    # Only these two known image directories are eligible for migration.
    for name, destination in (("avatars", AVATAR_DIR), ("support_screenshots", SCREENSHOT_DIR)):
        legacy = UPLOAD_DIR / name
        if legacy.is_dir():
            for source in legacy.iterdir():
                if source.is_file() and not source.is_symlink() and not source.name.startswith("."):
                    target = destination / source.name
                    if target.exists():
                        raise RuntimeError(f"Upload migration destination already exists: {target.name}")
                    source.rename(target)
