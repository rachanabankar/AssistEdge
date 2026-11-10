"""PDF hardening checks; no LLM calls and no sensitive output."""
import contextlib
import io
import json
import logging
import secrets
import shutil
import sqlite3
import sys
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import requests
from models.database import SessionLocal, engine
from models.models import Message, Report, Session
from utils import pdf_generator as pdf

logging.disable(logging.CRITICAL)
results = []
BASE = 'http://127.0.0.1:8000'


def check(name, passed, codes=()):
    results.append(bool(passed))
    print(name + ': ' + ' '.join(map(str, codes)) + (' PASS' if passed else ' FAIL'), flush=True)


def quiet(call):
    with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
        return call()


def fixtures(text):
    session = SimpleNamespace(id='test', mode='manual', scenario=text,
                              product_context=text, created_at=datetime.now())
    report = SimpleNamespace(summary=text, resolution_score=80,
                             sentiment_journey='[]', coaching_tips='[]')
    message = SimpleNamespace(sender='customer', content=text, timestamp=datetime.now(),
                              frustration_score=0, sentiment_json=None, escalation_json=None)
    return session, report, [message]


def local_checks():
    # Exercise the installed CreatePDF directly to establish callback behavior.
    called = []
    def deny(uri, basepath=None):
        called.append(True)
        raise ValueError('Resource denied')
    propagated = False
    try:
        quiet(lambda: pdf.pisa.CreatePDF('<img src="http://127.0.0.1:1/probe">',
                                        dest=io.BytesIO(), link_callback=deny))
    except ValueError:
        propagated = True
    check('callback_propagates', bool(called) and propagated)

    for name, uri in [('http', 'http://127.0.0.1:1/x'), ('https', 'https://example.com/x'),
                      ('file', 'file:///C:/Windows/win.ini'), ('relative', '../x'),
                      ('absolute', '/x'), ('unc', r'\\server\share\x'),
                      ('drive', r'C:\Windows\win.ini'), ('data', 'data:image/png;base64,eA==')]:
        def swallowed(*args, link_callback, **kwargs):
            try:
                link_callback(uri, None)
            except ValueError:
                pass
            return SimpleNamespace(err=0)
        failed = False
        with patch.object(pdf.pisa, 'CreatePDF', swallowed):
            try:
                pdf.render_report_pdf(*fixtures('Benign'))
            except RuntimeError:
                failed = True
        check('deny_' + name, failed)
    with patch.object(pdf.pisa, 'CreatePDF', return_value=SimpleNamespace(err=1)):
        failed = False
        try:
            pdf.render_report_pdf(*fixtures('Benign'))
        except RuntimeError:
            failed = True
        check('renderer_err', failed)
    rendered = pdf.env.get_template('report.html').render(
        session=fixtures('A & B')[0], report=fixtures('A & B')[1], transcript=[],
        coaching_tips=[], sentiment_journey=[], duration_seconds=0)
    check('single_escape', 'A &amp; B' in rendered and 'A &amp;amp; B' not in rendered)
    check('local_benign_pdf', quiet(lambda: pdf.render_report_pdf(*fixtures('Benign'))).startswith(b'%PDF'))


def live_checks():
    # Preserve the requested byte copy and use SQLite backup for a consistent live snapshot.
    database = Path(engine.url.database).resolve()
    backup = Path(str(database) + '.bak_pdf_db')
    if backup.exists():
        raise RuntimeError()
    shutil.copyfile(database, backup)
    with sqlite3.connect(str(database)) as source, sqlite3.connect(str(backup)) as target:
        source.backup(target)
    check('db_backup', backup.is_file())

    hits = []
    class Probe(BaseHTTPRequestHandler):
        def do_GET(self):
            hits.append(True)
            self.send_response(200)
            self.end_headers()
        def log_message(self, *args):
            pass
    listener = ThreadingHTTPServer(('127.0.0.1', 0), Probe)
    thread = threading.Thread(target=listener.serve_forever, daemon=True)
    thread.start()
    client = requests.Session()
    client.trust_env = False
    def post(path, body, headers=None):
        return client.post(BASE + path, json=body, headers=headers, timeout=30)
    def signup(letter):
        response = post('/auth/signup', {'username': 'zz_pdf_' + letter + '_' + secrets.token_hex(8),
                                         'password': secrets.token_urlsafe(24)})
        check('setup_' + letter, response.status_code == 200, [response.status_code])
        return {'Authorization': 'Bearer ' + response.json()['access_token']}
    try:
        a, b = signup('a'), signup('b')
        port = listener.server_address[1]
        payloads = ['<img src="file:///C:/Windows/win.ini">',
                    f'<img src="http://127.0.0.1:{port}/ssrf_probe">',
                    f'<style>@import url("http://127.0.0.1:{port}/css_probe");</style>',
                    '<b>bold</b>"><script>x</script>']
        malicious = '\n'.join(payloads)
        response = post('/session/', {'mode': 'manual', 'scenario': malicious,
                                      'product_context': malicious}, a)
        check('setup_session', response.status_code == 200, [response.status_code])
        sid = response.json()['id']
        with SessionLocal() as db:
            db.add_all([Message(session_id=sid, sender=sender, content=text)
                        for text in payloads for sender in ('customer', 'agent')])
            db.add(Report(session_id=sid, summary=malicious, resolution_score=80,
                          sentiment_journey=json.dumps([{'turn': 1, 'sentiment': malicious,
                                                        'frustration_score': 0}]),
                          coaching_tips=json.dumps([malicious])))
            db.commit()
        path = BASE + '/session/' + sid + '/report/pdf'
        response = client.get(path, headers=a, timeout=30)
        clean_error = response.status_code in (400, 500) and response.content == b'{"detail":"PDF generation failed"}'
        check('T1', (response.status_code == 200 and response.content.startswith(b'%PDF')) or clean_error,
              [response.status_code])
        check('T2', not hits)
        check('T3', not any(marker in response.content.lower()
                            for marker in (b'[fonts]', b'for 16-bit app support')))
        s, r, messages = fixtures(payloads[3])
        html = pdf.env.get_template('report.html').render(
            session=s, report=r, transcript=[vars(messages[0])],
            coaching_tips=[payloads[3]], sentiment_journey=[], duration_seconds=0)
        check('T4', '&lt;b&gt;' in html and '<b>bold</b>' not in html and '<script>' not in html)
        with SessionLocal() as db:
            session = db.get(Session, sid)
            session.scenario = 'A & B'
            session.product_context = 'Normal context'
            for message in db.query(Message).filter_by(session_id=sid):
                message.content = 'Normal conversation'
            report = db.query(Report).filter_by(session_id=sid).one()
            report.summary = 'Normal summary'
            report.coaching_tips = json.dumps(['Normal tip'])
            report.sentiment_journey = '[]'
            db.commit()
        normal = client.get(path, headers=a, timeout=30)
        check('T5', normal.status_code == 200 and normal.content.startswith(b'%PDF'), [normal.status_code])
        codes = [client.get(path, headers=headers, timeout=30).status_code for headers in (b, {})]
        check('T6', codes == [404, 401], codes)
    finally:
        listener.shutdown()
        listener.server_close()
        thread.join(timeout=5)
        client.close()


if __name__ == '__main__':
    try:
        local_checks()
        if '--local-only' not in sys.argv:
            live_checks()
    except Exception:
        check('execution', False)
    print('PASS ' + str(sum(results)) + ' FAIL ' + str(len(results) - sum(results)), flush=True)
    raise SystemExit(0 if results and all(results) else 1)
