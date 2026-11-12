import json
import os
from io import BytesIO
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from xhtml2pdf import pisa

TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
FONT_DIR = Path(TEMPLATE_DIR).parent / "assets" / "fonts"
# xhtml2pdf reopens an open NamedTemporaryFile when embedding TTFs, which
# Windows disallows. Pre-register the same faces there using their real paths.
if os.name == "nt":
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.lib.fonts import addMapping
    from xhtml2pdf.default import DEFAULT_FONT

    for style, bold, italic in (("Regular", 0, 0), ("Bold", 1, 0), ("It", 0, 1)):
        name = f"sourcesans_{bold}{italic}"
        pdfmetrics.registerFont(TTFont(name, str(FONT_DIR / f"SourceSans3-{style}.ttf")))
        DEFAULT_FONT[name] = name
        addMapping("sourcesans", bold, italic, name)
        addMapping("sourcesans_00", bold, italic, name)
    DEFAULT_FONT["sourcesans"] = "sourcesans_00"
    addMapping("sourcesans", 1, 1, "sourcesans_10")
    addMapping("sourcesans_00", 1, 1, "sourcesans_10")
env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


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
    resource_blocked = False

    def font_resource(uri, basepath=None):
        nonlocal resource_blocked
        # Only template-owned font names are accepted; never resolve arbitrary URLs.
        allowed = {f"fonts/SourceSans3-{style}.ttf" for style in ("Regular", "Bold", "It")}
        if uri in allowed:
            font = (FONT_DIR / uri.split("/")[-1]).resolve()
            if font.parent == FONT_DIR.resolve() and font.is_file():
                return str(font)
        resource_blocked = True
        raise ValueError("PDF resource is not an allowed bundled font")

    try:
        pisa_status = pisa.CreatePDF(
            src=html_content, dest=output, link_callback=font_resource
        )
    except Exception:
        raise RuntimeError("PDF generation failed") from None
    if resource_blocked or pisa_status.err:
        raise RuntimeError("PDF generation failed")

    return output.getvalue()
