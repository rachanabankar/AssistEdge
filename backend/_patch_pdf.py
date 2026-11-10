from pathlib import Path
import shutil

edits = {
    'utils/pdf_generator.py': [
        ('from jinja2 import Environment, FileSystemLoader',
         'from jinja2 import Environment, FileSystemLoader, select_autoescape'),
        ('env = Environment(loader=FileSystemLoader(TEMPLATE_DIR))',
         'env = Environment(\n    loader=FileSystemLoader(TEMPLATE_DIR),\n    autoescape=select_autoescape(["html", "xml"]),\n)'),
        ('    pisa_status = pisa.CreatePDF(src=html_content, dest=output)\n    if pisa_status.err:\n        raise RuntimeError(f"PDF generation failed with {pisa_status.err} error(s)")',
         '    resource_blocked = False\n\n'
         '    def deny_resource(uri, basepath=None):\n'
         '        nonlocal resource_blocked\n'
         '        resource_blocked = True\n'
         '        raise ValueError("PDF resource loading is disabled")\n\n'
         '    try:\n'
         '        pisa_status = pisa.CreatePDF(\n'
         '            src=html_content, dest=output, link_callback=deny_resource\n'
         '        )\n'
         '    except Exception:\n'
         '        raise RuntimeError("PDF generation failed") from None\n'
         '    if resource_blocked or pisa_status.err:\n'
         '        raise RuntimeError("PDF generation failed")'),
    ],
    'routers/session.py': [
        ('    pdf_bytes = render_report_pdf(session, report, messages)',
         '    try:\n'
         '        pdf_bytes = render_report_pdf(session, report, messages)\n'
         '    except Exception:\n'
         '        raise HTTPException(\n'
         '            status_code=500, detail="PDF generation failed"\n'
         '        ) from None'),
    ],
}
pending = []
for name, replacements in edits.items():
    path = Path(name)
    data = path.read_bytes()
    data.decode('utf-8')
    newline = b'\r\n' if b'\r\n' in data else b'\n'
    if Path(name + '.bak_pdf').exists():
        raise SystemExit('FAIL')
    for old, new in replacements:
        old = old.encode().replace(b'\n', newline)
        new = new.encode().replace(b'\n', newline)
        if data.count(old) != 1:
            raise SystemExit('FAIL')
        data = data.replace(old, new)
    pending.append((path, data))
for path, _ in pending:
    shutil.copyfile(path, str(path) + '.bak_pdf')
for path, data in pending:
    path.write_bytes(data)
print('PASS')
