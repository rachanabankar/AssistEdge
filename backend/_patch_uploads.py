import os, re, sys, shutil, py_compile

HELPER = r'''import os
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
'''

IMPORT_LINE = "from utils.uploads import safe_ext, read_bounded, require_image"

def load(p):
    raw = open(p, "rb").read().decode("utf-8")
    return raw.replace("\r\n", "\n"), ("\r\n" in raw)

def dump(p, text, crlf):
    if crlf:
        text = text.replace("\n", "\r\n")
    open(p, "wb").write(text.encode("utf-8"))

def sub_once(text, old, new, label, regex=False):
    flags = re.M | re.S
    n = len(re.findall(old, text, flags=flags)) if regex else text.count(old)
    if n != 1:
        print("ABORT: %s matched %d times (need exactly 1). Nothing was written." % (label, n))
        sys.exit(1)
    return re.sub(old, lambda m: new, text, count=1, flags=flags) if regex else text.replace(old, new, 1)

plans = {}

# profile.py
t, c = load("routers/profile.py")
t = sub_once(t, r"^import os, uuid[ \t]*$", "import os, uuid\n" + IMPORT_LINE, "profile import line", regex=True)
t = sub_once(t,
    r"^[ \t]*ext = os\.path\.splitext\(file\.filename\)\[1\]\.lower\(\)[ \t]*\n.*?File too large[^\n]*\n",
    '''    ext = safe_ext(file.filename, ALLOWED_EXTENSIONS)
    contents = await read_bounded(file, MAX_SIZE_BYTES)
    require_image(ext, contents)
''', "profile avatar block", regex=True)
plans["routers/profile.py"] = (t, c)

# support.py
t, c = load("routers/support.py")
t = sub_once(t, r"^import os, uuid[ \t]*$", "import os, uuid\n" + IMPORT_LINE, "support import line", regex=True)
t = sub_once(t,
    r"^[ \t]*ext = os\.path\.splitext\(screenshot\.filename\)\[1\]\.lower\(\)[ \t]*\n.*?File too large[^\n]*\n",
    '''        ext = safe_ext(screenshot.filename, ALLOWED_EXTENSIONS)
        contents = await read_bounded(screenshot, MAX_SIZE_BYTES)
        require_image(ext, contents)
''', "support screenshot block", regex=True)
t = sub_once(t, "issue_type: str = Form(...),", "issue_type: str = Form(..., min_length=1, max_length=50),", "issue_type")
t = sub_once(t, "subject: str = Form(...),", "subject: str = Form(..., min_length=1, max_length=200),", "subject")
t = sub_once(t, "priority: str = Form(...),", "priority: str = Form(..., min_length=1, max_length=20),", "priority")
plans["routers/support.py"] = (t, c)

# session.py: drop saved_to
t, c = load("routers/session.py")
t = sub_once(t, r'^[ \t]*"saved_to": save_path,[ \t]*\n', "", "session saved_to", regex=True)
plans["routers/session.py"] = (t, c)

for p, (t, c) in plans.items():
    shutil.copy2(p, p + ".bak_upload")
    dump(p, t, c)
open("utils/uploads.py", "w", encoding="utf-8", newline="\n").write(HELPER)
for p in list(plans) + ["utils/uploads.py"]:
    py_compile.compile(p, doraise=True)
    print("OK", p)
