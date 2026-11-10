import sys, shutil

AUTH = r"..\frontend\src\context\AuthContext.jsx"
MODAL = r"..\frontend\src\profile\PrivacySecurityModal.jsx"

def rd(p):
    with open(p, "r", encoding="utf-8", newline="") as f:
        return f.read()

def nl_of(t):
    return "\r\n" if "\r\n" in t else "\n"

errors = []
out = {}

# ---- AuthContext.jsx ----
t = rd(AUTH); NL = nl_of(t)
edits = [
    ("const logout = useCallback(() => {",
     "const updateToken = useCallback((newToken) => {" + NL +
     "    localStorage.setItem(AUTH_TOKEN_KEY, newToken)" + NL +
     "    setToken(newToken)" + NL +
     "  }, [])" + NL + NL +
     "  const logout = useCallback(() => {"),
    ("}), [token, agent, loading, login, signup, googleLogin, logout, updateAgent])",
     "  updateToken," + NL +
     "  }), [token, agent, loading, login, signup, googleLogin, logout, updateAgent, updateToken])"),
]
for old, new in edits:
    if t.count(old) != 1:
        errors.append("AuthContext.jsx: no unique match for: " + old[:60])
    else:
        t = t.replace(old, new)
out[AUTH] = t

# ---- PrivacySecurityModal.jsx ----
t = rd(MODAL); NL = nl_of(t)
edits = [
    ('import { profileApi } from "../services/api";',
     'import { profileApi } from "../services/api";' + NL +
     'import { useAuth } from "../context/AuthContext";'),
    ("export default function PrivacySecurityModal({ isOpen, onClose }) {",
     "export default function PrivacySecurityModal({ isOpen, onClose }) {" + NL +
     "  const { updateToken } = useAuth();"),
    ("if (newPassword !== confirmPassword) {",
     "const enc = new TextEncoder();" + NL +
     "    if (enc.encode(newPassword).length > 72 || enc.encode(currentPassword).length > 72) {" + NL +
     '      setError("Passwords must be at most 72 bytes");' + NL +
     "      return;" + NL +
     "    }" + NL +
     "    if (newPassword !== confirmPassword) {"),
    ("await profileApi.changePassword(currentPassword, newPassword);",
     "const res = await profileApi.changePassword(currentPassword, newPassword);" + NL +
     "      if (res.data && res.data.access_token) updateToken(res.data.access_token);"),
    ('setError(err.response?.data?.detail || "Failed to change password");',
     "const d = err.response?.data?.detail;" + NL +
     '      setError(typeof d === "string" ? d : "Failed to change password");'),
]
for old, new in edits:
    if t.count(old) != 1:
        errors.append("PrivacySecurityModal.jsx: no unique match for: " + old[:60])
    else:
        t = t.replace(old, new)
out[MODAL] = t

if errors:
    print("ABORTED, nothing written:")
    for e in errors: print("  - " + e)
    sys.exit(1)

for p, text in out.items():
    shutil.copyfile(p, p + ".bak_pw")
    with open(p, "w", encoding="utf-8", newline="") as f:
        f.write(text)
    print("OK " + p)
