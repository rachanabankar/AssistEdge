"""Support upload live checks; requests is the only third-party dependency."""
import binascii
import re
import secrets
import struct
import zlib
from pathlib import Path

import requests

BASE = 'http://127.0.0.1:8000'
ROOT = Path(__file__).resolve().parent
UPLOADS = (ROOT / 'static/support_screenshots').resolve()
CAP = 2 * 1024 * 1024
results = []
client = requests.Session()
client.trust_env = False


def check(label, ok, codes=()):
    results.append(bool(ok))
    print(label + ': ' + ' '.join(map(str, codes)) + (' PASS' if ok else ' FAIL'), flush=True)


def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', binascii.crc32(kind + data) & 0xffffffff)


PNG = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', 1, 1, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00')) + chunk(b'IEND', b''))


def signup(letter):
    response = client.post(BASE + '/auth/signup', json={
        'username': 'zz_tix_' + letter + '_' + secrets.token_hex(8),
        'password': secrets.token_urlsafe(24),
    }, timeout=20)
    check('setup_' + letter, response.status_code == 200, [response.status_code])
    if response.status_code != 200:
        raise RuntimeError()
    data = response.json()
    return {'Authorization': 'Bearer ' + data['access_token']}, data['agent']['id']


def ticket(headers=None, fields=None, upload=None):
    data = {'issue_type': 'Technical', 'subject': 'Upload test', 'priority': 'normal'}
    if fields:
        data.update(fields)
    return client.post(BASE + '/support/tickets', headers=headers, data=data,
                       files={'screenshot': upload} if upload else None, timeout=30)


def stored_safely(response, agent_id, original):
    if not 200 <= response.status_code < 300:
        return False
    data = response.json()
    url = data.get('screenshot_url', '')
    prefix = '/static/support_screenshots/'
    if not url.startswith(prefix):
        return False
    name = url[len(prefix):]
    if not re.fullmatch(str(agent_id) + r'_[0-9a-f]{32}\.png', name):
        return False
    path = (UPLOADS / name).resolve()
    return (path.parent == UPLOADS and path.is_file() and path.read_bytes() == PNG
            and original not in name and data.get('agent_id') == agent_id)


def outside_snapshot():
    # Inspect likely Windows and slash traversal destinations without following links.
    candidates = {ROOT / 'evil.png', ROOT / 'static/evil.png', ROOT.parent / 'evil.png',
                  UPLOADS / r'..\..\evil.png'}
    return {str(p): p.read_bytes() if p.is_file() else None for p in candidates}


def main():
    a, aid = signup('a')
    b, bid = signup('b')
    response = ticket(a)
    check('T1', 200 <= response.status_code < 300 and response.json().get('agent_id') == aid,
          [response.status_code])
    filename = 'client_' + secrets.token_hex(8) + '.png'
    response = ticket(a, upload=(filename, PNG, 'image/png'))
    check('T2', stored_safely(response, aid, filename), [response.status_code])
    codes = [ticket(a, fields={field: 'x' * (limit + 1)}).status_code
             for field, limit in [('issue_type', 50), ('subject', 200), ('priority', 20)]]
    check('T3', codes == [422, 422, 422], codes)
    response = ticket(a, upload=('x.exe', PNG, 'application/octet-stream'))
    check('T4', 400 <= response.status_code < 500, [response.status_code])
    response = ticket(a, upload=('x.png', b'plain text', 'image/png'))
    check('T5', 400 <= response.status_code < 500, [response.status_code])
    response = ticket(a, upload=('x.png', PNG + b'x' * (CAP + 1 - len(PNG)), 'image/png'))
    check('T6', 400 <= response.status_code < 500, [response.status_code])
    before = outside_snapshot()
    codes, safe = [], True
    for name in (r'..\..\evil.png', '../../evil.png'):
        response = ticket(b, upload=(name, PNG, 'image/png'))
        codes.append(response.status_code)
        safe = safe and (400 <= response.status_code < 500 or stored_safely(response, bid, 'evil.png'))
    check('T7', safe and outside_snapshot() == before, codes)
    response = ticket()
    check('T8', response.status_code == 401, [response.status_code])


if __name__ == '__main__':
    try:
        main()
    except Exception:
        check('execution', False)
    finally:
        client.close()
    print('PASS ' + str(sum(results)) + ' FAIL ' + str(len(results) - sum(results)), flush=True)
    raise SystemExit(0 if len(results) == 10 and all(results) else 1)
