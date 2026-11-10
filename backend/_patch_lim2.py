from pathlib import Path
import shutil

paths = [Path('routers/simulate.py'), Path('routers/manual.py')]
old = b'conversation_history: list[Turn] = Field(default_factory=list, max_length=100)'
new = old.replace(b'100', b'200')
pending = []
for path in paths:
    data = path.read_bytes()
    data.decode('utf-8')
    if data.count(old) != 1 or data.count(b'conversation_history:') != 1:
        raise SystemExit('FAIL: unexpected match count; nothing written')
    if Path(str(path) + '.bak_lim2').exists():
        raise SystemExit('FAIL: backup exists; nothing written')
    pending.append((path, data.replace(old, new)))
for path, _ in pending:
    shutil.copyfile(path, str(path) + '.bak_lim2')
for path, data in pending:
    path.write_bytes(data)
print('PASS')
