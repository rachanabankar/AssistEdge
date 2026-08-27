import os
import json
from io import BytesIO
 
from xhtml2pdf import pisa
from jinja2 import Environment, FileSystemLoader
 
# Assumes utils/ and templates/ are siblings at the project root — adjust if your
# layout differs.
TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))
 
 
def render_report_pdf(session, report, messages) -> bytes:
    template = env.get_template("report.html")
 
    sentiment_journey = json.loads(report.sentiment_journey) if report.sentiment_journey else []
    coaching_tips = json.loads(report.coaching_tips) if report.coaching_tips else []
 
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
            entry["sentiment"] = json.loads(m.sentiment_json) if m.sentiment_json else None
            entry["escalation"] = json.loads(m.escalation_json) if m.escalation_json else None
        transcript.append(entry)
 
    duration_seconds = 0
    if len(messages) >= 2:
        duration_seconds = int((messages[-1].timestamp - messages[0].timestamp).total_seconds())
 
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
 