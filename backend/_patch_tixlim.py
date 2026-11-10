from pathlib import Path
import shutil

path = Path('routers/support.py')
backup = Path(str(path) + '.bak_tixlim')
data = path.read_bytes()
data.decode('utf-8')
newline = b'\r\n' if b'\r\n' in data else b'\n'
edits = [
    ('from models import crud\n',
     'from models import crud\nfrom ratelimit import agent_rate_limit_check\n'),
    ('    screenshot_url = None\n',
     '    agent_rate_limit_check(current_agent.id, "10/min", "support-ticket")\n\n'
     '    screenshot_url = None\n'),
]
if backup.exists():
    raise SystemExit('FAIL')
for old, new in edits:
    old = old.encode('utf-8').replace(b'\n', newline)
    new = new.encode('utf-8').replace(b'\n', newline)
    if data.count(old) != 1:
        raise SystemExit('FAIL')
    data = data.replace(old, new)
shutil.copyfile(path, backup)
path.write_bytes(data)
print('PASS')
