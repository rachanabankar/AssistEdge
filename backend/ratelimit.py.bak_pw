import threading
import time
from collections import deque

from fastapi import HTTPException, Request

from config import RATE_LIMIT_ENABLED

_PERIODS = {"sec": 1, "min": 60, "hour": 3600}
_lock = threading.Lock()
_hits = {}  # (scope, ip) -> (period, deque of monotonic timestamps)
_last_sweep = 0.0
_SWEEP_EVERY = 60.0


def rate_limit(spec: str, scope: str):
    """Return a FastAPI dependency. Use as Depends(rate_limit("5/min", "signup"))."""
    count_s, per = spec.split("/")  # a bad spec fails at import time
    max_requests = int(count_s)
    period = _PERIODS[per]

    def dependency(request: Request):
        global _last_sweep
        if not RATE_LIMIT_ENABLED:
            return
        ip = request.client.host if request.client else "unknown"
        now = time.monotonic()
        key = (scope, ip)
        with _lock:
            if now - _last_sweep > _SWEEP_EVERY:
                _last_sweep = now
                stale = [k for k, (p, dq) in _hits.items()
                         if not dq or now - dq[-1] >= p]
                for k in stale:
                    del _hits[k]
            entry = _hits.get(key)
            if entry is None:
                entry = (period, deque())
                _hits[key] = entry
            dq = entry[1]
            while dq and now - dq[0] >= period:
                dq.popleft()
            if len(dq) >= max_requests:
                retry = int(period - (now - dq[0])) + 1
                raise HTTPException(
                    status_code=429,
                    detail="Too many requests",
                    headers={"Retry-After": str(retry)},
                )
            dq.append(now)

    return dependency