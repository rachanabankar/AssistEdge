"""Run after restart. requests is the only third-party dependency."""
import binascii
import secrets
import struct
import time
import zlib
from pathlib import Path

import requests

BASE = 'http://127.0.0.1:8000'
UPLOADS = Path(__file__).resolve().parent / 'static/support_screenshots'
results = []
client = requests.Session()
client.trust_env = False


def check(label, ok, codes=()):
    results.append(bool(ok))
    print(label + ': ' + ' '.join(map(str, codes)) + (' PASS' if ok else ' FAIL'), flush=True)


def signup(prefix):
    response = client.post(BASE + '/auth/signup', json={
        'username': prefix + secrets.token_hex(8),
        'password': secrets.token_urlsafe(24),
    }, timeout=20)
    check('setup', response.status_code == 200, [response.status_code])
    if response.status_code != 200:
        raise RuntimeError()
    return {'Authorization': 'Bearer ' + response.json()['access_token']}


def chunk(kind, data):
    return struct.pack('!I', len(data)) + kind + data + struct.pack('!I', binascii.crc32(kind + data) & 0xffffffff)


def ticket(headers=None, png=None):
    return client.post(BASE + '/support/tickets', headers=headers,
                       data={'issue_type': 'Technical', 'subject': 'Rate limit test', 'priority': 'normal'},
                       files={'screenshot': ('probe.png', png, 'image/png')} if png else None,
                       timeout=15)


def files():
    return {p.name for p in UPLOADS.iterdir() if p.is_file()}


def main():
    a = signup('zz_tixlim_')
    started = time.monotonic()
    codes = [ticket(a).status_code for _ in range(10)]
    check('T1', all(200 <= code < 300 for code in codes), codes)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('!2I5B', 1, 1, 8, 2, 0, 0, 0))
           + chunk(b'IDAT', zlib.compress(b'\x00\xff\x00\x00')) + chunk(b'IEND', b''))
    before = files()
    response = ticket(a, png)
    after = files()
    check('T2', response.status_code == 429 and time.monotonic() - started < 60, [response.status_code])
    check('T3', len(before) == len(after) and before == after)
    b = signup('zz_tixlim_b_')
    response = ticket(b)
    check('T4', 200 <= response.status_code < 300, [response.status_code])
    response = ticket()
    check('T5', response.status_code == 401, [response.status_code])


if __name__ == '__main__':
    try:
        main()
    except Exception:
        check('execution', False)
    finally:
        client.close()
    print('PASS ' + str(sum(results)) + ' FAIL ' + str(len(results) - sum(results)), flush=True)
    raise SystemExit(0 if len(results) == 7 and all(results) else 1)
