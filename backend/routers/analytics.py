import json
from datetime import datetime, timedelta
from collections import defaultdict

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from models.database import get_db
from models import crud, models
from utils.auth import get_current_agent

router = APIRouter(prefix="/analytics", tags=["Analytics"])

FRUSTRATION_POSITIVE_MAX = 33
FRUSTRATION_NEUTRAL_MAX = 66
RESOLVED_THRESHOLD = 70

# All modes the frontend expects to see a key for, even when the count is 0.
# CHANGED: "replay" removed — replay no longer creates a Session row (it's
# passive playback, tracked separately via ReplayView / replayViews below),
# so a mode_counts["replay"] key would always be 0 by construction, not by
# lack of usage. Keeping it in the donut misrepresented it as "0% adoption."
KNOWN_MODES = ["simulator", "manual"]


def _parse_date_range(start_date: str = None, end_date: str = None):
    """
    Defaults to the last 7 days (inclusive) if not provided.
    end_date is set to end-of-day so 'today' is fully included.

    FIX: previously built these as timezone-aware UTC datetimes
    (tzinfo=timezone.utc), but created_at/timestamp columns in models.py
    are naive TIMESTAMP columns (no timezone=True) storing naive UTC values
    via server_default=func.now(). On SQLite, comparing an aware datetime
    against naive stored values is unreliable (string comparison, not a
    real chronological one), which could silently include/exclude rows at
    period boundaries. Now naive, to match the existing storage convention.
    """
    if end_date:
        end = datetime.fromisoformat(end_date).replace(
            hour=23, minute=59, second=59
        )
    else:
        end = datetime.utcnow()

    if start_date:
        start = datetime.fromisoformat(start_date).replace(
            hour=0, minute=0, second=0

        )
    else:
        start = end - timedelta(days=6)  # 7-day window inclusive of today

    return start, end


def _previous_period(start, end):
    span = end - start
    prev_end = start - timedelta(microseconds=1)
    prev_start = prev_end - span
    return prev_start, prev_end


def _pct_change(current, previous):
    """
    CHANGED: previously returned a bare float, and 0 -> nonzero returned a
    flat 100.0 with no way for the frontend to distinguish "genuinely grew
    100%" from "there was nothing to compare against." Per product decision,
    a zero baseline should render as "New" instead of "+100.0%".

    Now returns a small object so the frontend can tell the two cases apart:
      - normal change:      {"value": <float>, "isNew": False}
      - zero -> zero:        {"value": 0.0,     "isNew": False}
      - zero -> nonzero:     {"value": None,    "isNew": True}
    """
    if previous == 0:
        if current == 0:
            return {"value": 0.0, "isNew": False}
        return {"value": None, "isNew": True}
    return {"value": round(((current - previous) / previous) * 100, 1), "isNew": False}


def _compute_core_metrics(db: Session, agent_id: int, start, end):
    sessions = crud.get_sessions_in_range(db, agent_id, start, end)
    session_ids = [s.id for s in sessions]

    total_sessions = len(sessions)
    active_days = crud.get_active_days_count(db, agent_id, start, end)

    # Avg session time: span between first and last message, per session
    bounds = crud.get_session_message_bounds(db, session_ids)
    durations = []
    for sid, (min_ts, max_ts) in bounds.items():
        durations.append((max_ts - min_ts).total_seconds())
    avg_seconds = sum(durations) / len(durations) if durations else 0

    # Resolution: avg score + rate of sessions scoring >= threshold
    reports = crud.get_reports_for_sessions(db, session_ids)
    scores = [r.resolution_score for r in reports if r.resolution_score is not None]
    avg_resolution_score = round(sum(scores) / len(scores), 1) if scores else 0
    resolved_count = sum(1 for s in scores if s >= RESOLVED_THRESHOLD)
    resolution_rate = round((resolved_count / len(scores)) * 100, 1) if scores else 0

    return {
        "total_sessions": total_sessions,
        "active_days": active_days,
        "avg_seconds": avg_seconds,
        "avg_resolution_score": avg_resolution_score,
        "resolution_rate": resolution_rate,
        "sessions": sessions,
    }


def _format_duration(total_seconds: float) -> str:
    minutes = int(total_seconds // 60)
    seconds = int(total_seconds % 60)
    return f"{minutes}m {seconds}s"


@router.get("/overview")
def get_analytics_overview(
    start_date: str = Query(None),
    end_date: str = Query(None),
    db: Session = Depends(get_db),
    current_agent: models.Agent = Depends(get_current_agent),
):
    start, end = _parse_date_range(start_date, end_date)
    prev_start, prev_end = _previous_period(start, end)

    current = _compute_core_metrics(db, current_agent.id, start, end)
    previous = _compute_core_metrics(db, current_agent.id, prev_start, prev_end)

    sessions = current["sessions"]

    # ---- Sessions Over Time (grouped by day) ----
    day_labels = []
    day_counts = defaultdict(int)
    cursor = start.date()
    while cursor <= end.date():
        day_labels.append(cursor.strftime("%d %b"))
        day_counts[cursor] = 0
        cursor += timedelta(days=1)
    for s in sessions:
        day_counts[s.created_at.date()] += 1
    sessions_over_time = [day_counts[d] for d in sorted(day_counts.keys())]

    # ---- Sessions by Mode ----
    # FIX: previously a bare defaultdict(int), so a mode with zero sessions in
    # range (e.g. "replay") was simply absent from the response. The frontend
    # sums analyticsData.modes.simulator + .manual + .replay unconditionally,
    # so a missing key produced `undefined`, and `n + undefined = NaN` blew up
    # the donut chart's total and every percentage. Pre-seed all known modes
    # at 0 so the key is always present.
    mode_counts = {m: 0 for m in KNOWN_MODES}
    for s in sessions:
        mode_counts[s.mode] = mode_counts.get(s.mode, 0) + 1

    # ---- Escalations Over Time ----
    escalation_msgs = crud.get_customer_messages_with_escalation(
        db, current_agent.id, start, end
    )
    escalation_day_counts = {d: 0 for d in day_counts.keys()}
    total_escalations = 0
    for m in escalation_msgs:
        try:
            parsed = json.loads(m.escalation_json)
        except (json.JSONDecodeError, TypeError):
            continue
        if parsed.get("alert_triggered"):
            total_escalations += 1
            msg_date = m.timestamp.date()
            if msg_date in escalation_day_counts:
                escalation_day_counts[msg_date] += 1
            # else: message falls outside the requested range — shouldn't
            # happen if get_customer_messages_with_escalation is scoped
            # correctly, so we don't add a stray key that would desync
            # escalations_over_time's length from dates'.
    escalations_over_time = [escalation_day_counts[d] for d in sorted(escalation_day_counts.keys())]

    # ---- Sentiment Overview (bucketed by frustration_score) ----
    scores = crud.get_customer_frustration_scores(db, current_agent.id, start, end)
    total_scored_msgs = len(scores)
    positive = sum(1 for s in scores if s <= FRUSTRATION_POSITIVE_MAX)
    neutral = sum(1 for s in scores if FRUSTRATION_POSITIVE_MAX < s <= FRUSTRATION_NEUTRAL_MAX)
    negative = sum(1 for s in scores if s > FRUSTRATION_NEUTRAL_MAX)

    # FIX: these were previously returned as raw message counts, but the
    # frontend renders them directly as "{value}%" and as a progress-bar
    # width percentage. Convert to actual percentages of scored messages.
    if total_scored_msgs:
        sentiment_positive_pct = round(positive / total_scored_msgs * 100, 1)
        sentiment_neutral_pct = round(neutral / total_scored_msgs * 100, 1)
        sentiment_negative_pct = round(negative / total_scored_msgs * 100, 1)
    else:
        sentiment_positive_pct = sentiment_neutral_pct = sentiment_negative_pct = 0

    # ---- Replay Views ----
    # NEW: replay activity tracked separately from Session, since it's
    # passive playback rather than a real coaching session.
    replay_views = crud.get_replay_views_count(db, current_agent.id, start, end)

    return {
        "totalSessions": current["total_sessions"],
        "activeDays": current["active_days"],
        "avgSessionTime": _format_duration(current["avg_seconds"]),
        "avgResolutionScore": current["avg_resolution_score"],
        # NOTE: "Resolution Rate" is resolved_count / scored_sessions, not
        # resolved_count / total_sessions. Frontend now labels this
        # explicitly as "of scored sessions" per product decision — if that
        # ever needs to change to be against total_sessions instead, this is
        # the line to touch, not just the label.
        "resolutionRate": current["resolution_rate"],

        "deltas": {
            "totalSessions": _pct_change(current["total_sessions"], previous["total_sessions"]),
            "activeDays": _pct_change(current["active_days"], previous["active_days"]),
            "avgSessionTime": _pct_change(current["avg_seconds"], previous["avg_seconds"]),
            "avgResolutionScore": _pct_change(
                current["avg_resolution_score"], previous["avg_resolution_score"]
            ),
            "resolutionRate": _pct_change(current["resolution_rate"], previous["resolution_rate"]),
        },

        "dates": day_labels,
        "sessions": sessions_over_time,

        "modes": mode_counts,

        "escalations": escalations_over_time,
        "totalEscalations": total_escalations,

        "sentiment": {
            "positive": sentiment_positive_pct,
            "neutral": sentiment_neutral_pct,
            "negative": sentiment_negative_pct,
        },

        "replayViews": replay_views,
    }