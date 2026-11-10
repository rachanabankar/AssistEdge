"""Run only after the development server has been restarted. No LLM calls."""
import secrets
import time

import requests

BASE = 'http://127.0.0.1:8000'
results = []
client = requests.Session()
client.trust_env = False


def report(label, ok, codes=()):
    results.append(bool(ok))
    print(label + ': ' + ' '.join(str(code) for code in codes)
          + (' PASS' if ok else ' FAIL'), flush=True)


def post(path, body, headers=None):
    return client.post(BASE + path, json=body, headers=headers, timeout=10)


def signup(letter):
    suffix = secrets.token_hex(8)
    response = post('/auth/signup', {
        'username': 'zz_lim_' + letter + '_' + suffix,
        'email': 'zz_lim_' + letter + '_' + suffix + '@example.com',
        'password': secrets.token_urlsafe(24),
    })
    token = response.json().get('access_token') if response.status_code in (200, 201) else None
    report('setup_' + letter, bool(token), [response.status_code])
    if not token:
        raise RuntimeError()
    return {'Authorization': 'Bearer ' + token}


def main():
    a = signup('a')
    b = signup('b')
    response = post('/session/', {'mode': 'manual', 'scenario': 'Test',
                                  'product_context': 'Test'}, a)
    session_id = response.json().get('id') if response.status_code in (200, 201) else None
    report('setup_session', bool(session_id), [response.status_code])
    if not session_id:
        return

    # A random, nonexistent ID also blocks agent execution if validation regresses.
    missing = 'zz_lim_missing_' + secrets.token_hex(16)
    manual = {'session_id': missing, 'customer_message': 'Test', 'conversation_history': []}
    simulate = {'session_id': missing, 'scenario': 'Test', 'conversation_history': []}
    response = post('/simulate/message', dict(simulate, scenario='x' * 2001), a)
    report('test_1', response.status_code == 422, [response.status_code])
    response = post('/manual/message', dict(manual, customer_message='x' * 4001), a)
    report('test_2', response.status_code == 422, [response.status_code])
    history = [{'sender': 'customer', 'content': 'Test'} for _ in range(201)]
    codes = [post(path, dict(body, conversation_history=history), a).status_code
             for path, body in [('/simulate/message', simulate), ('/manual/message', manual)]]
    report('test_3', codes == [422, 422], codes)

    response = client.get(BASE + '/openapi.json', timeout=10)
    schema_ok = response.status_code == 200
    if schema_ok:
        schemas = response.json()['components']['schemas']
        schema_ok = all(schemas[name]['properties']['conversation_history'].get('maxItems') == 200
                        for name in ['SimulateMessageRequest', 'ManualMessageRequest'])
    report('test_4', schema_ok, [response.status_code])

    # Body validation precedes the handler; valid bodies reach limiter then ownership.
    c = signup('c')
    started = time.monotonic()
    codes = [post('/manual/message', manual, c).status_code for _ in range(21)]
    report('test_5', codes == [404] * 20 + [429]
           and time.monotonic() - started < 60, codes)
    response = post('/manual/end-session', {'session_id': missing}, c)
    report('test_6', response.status_code == 404, [response.status_code])

    codes = [post(path, dict(body, session_id=session_id), b).status_code
             for path, body in [('/simulate/message', simulate), ('/manual/message', manual)]]
    report('test_7', codes == [404, 404], codes)
    codes = [post(path, body).status_code for path, body in [
        ('/simulate/message', simulate), ('/manual/message', manual),
        ('/manual/end-session', {'session_id': missing})]]
    report('test_8', codes == [401, 401, 401], codes)


if __name__ == '__main__':
    try:
        main()
    except Exception:
        # Never expose response bodies, credentials, or exception text.
        report('execution', False)
    print('PASS ' + str(sum(results)) + ' FAIL ' + str(len(results) - sum(results)), flush=True)
    raise SystemExit(0 if len(results) == 12 and all(results) else 1)
