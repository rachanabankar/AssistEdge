import json
import os
from io import BytesIO
from jinja2 import Environment, FileSystemLoader
from xhtml2pdf import pisa

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))


def _safe_json_loads(data: str | None, default=None):
    if not data:
        return default
    try:
        return json.loads(data)
    except (json.JSONDecodeError, TypeError):
        return default


def render_report_pdf(session, report, messages) -> bytes:
    template = env.get_template("report.html")

    sentiment_journey = _safe_json_loads(report.sentiment_journey, default=[])
    coaching_tips = _safe_json_loads(report.coaching_tips, default=[])

    transcript = []
    customer_turn_number = 0
    for m in messages:
        entry = {
            "sender": m.sender,
            "content": m.content,
            "timestamp": m.timestamp,
        }
        if m.sender == "customer":
            customer_turn_number += 1
            entry["turn"] = customer_turn_number
            entry["frustration_score"] = m.frustration_score
            entry["sentiment"] = _safe_json_loads(m.sentiment_json)
            entry["escalation"] = _safe_json_loads(m.escalation_json)
        transcript.append(entry)

    duration_seconds = (
        int((messages[-1].timestamp - messages[0].timestamp).total_seconds())
        if len(messages) >= 2
        else 0
    )

    html_content = template.render(
        session=session,
        report=report,
        sentiment_journey=sentiment_journey,
        coaching_tips=coaching_tips,
        transcript=transcript,
        duration_seconds=duration_seconds,
    )

    output = BytesIO()
    pisa_status = pisa.CreatePDF(src=html_content, dest=output)
    if pisa_status.err:
        raise RuntimeError(f"PDF generation failed with {pisa_status.err} error(s)")

    return output.getvalue()
