import os
from fastapi import HTTPException, UploadFile

_CHUNK = 64 * 1024
_KIND_BY_EXT = {".png": "png", ".jpg": "jpeg", ".jpeg": "jpeg", ".webp": "webp"}


def safe_ext(filename, allowed):
    """Extension from a possibly-None filename; 400 if not allowed."""
    name = os.path.basename((filename or "").replace("\\", "/"))
    ext = os.path.splitext(name)[1].lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    return ext


async def read_bounded(file: UploadFile, max_bytes: int) -> bytes:
    """Read in chunks and stop as soon as max_bytes is exceeded."""
    buf = bytearray()
    while True:
        chunk = await file.read(_CHUNK)
        if not chunk:
            break
        buf.extend(chunk)
        if len(buf) > max_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File too large (max {max_bytes // (1024 * 1024)}MB)",
            )
    return bytes(buf)


def _sniff(data: bytes):
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:3] == b"\xff\xd8\xff":
        return "jpeg"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def require_image(ext: str, data: bytes):
    """Magic-byte check: content must match the claimed extension."""
    if _sniff(data) is None or _sniff(data) != _KIND_BY_EXT.get(ext):
        raise HTTPException(status_code=400, detail="File content does not match its type")
