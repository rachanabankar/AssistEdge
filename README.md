# AssistEdge

**Development of AI-Powered Customer Support Assistant with Live Response Guidance**

> Built as part of the **Infosys Springboard AI Virtual Internship**, in collaboration with **Vidzai Digital**.

AssistEdge coaches customer support agents in **real time** during live text-based support interactions. It analyzes each exchange as it happens — customer intent, sentiment, escalation risk — retrieves relevant knowledge base content, and surfaces coaching suggestions to help agents resolve conversations faster and with more empathy. After each session, it generates a structured performance report with a sentiment journey, resolution score, and coaching recommendations.

The goal: turn reactive agent training into **proactive, in-session coaching**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Project Structure](#project-structure)
- [Challenges & How They Were Solved](#challenges--how-they-were-solved)
- [Getting Started](#getting-started)
- [Known Limitations & Future Work](#known-limitations--future-work)
- [Acknowledgments](#acknowledgments)
- [License](#license)

---

## Features

- **Three interaction modes**
  - **Simulator Mode** — an AI Customer Simulator Agent generates realistic customer messages turn-by-turn based on a chosen scenario, so agents can practice against a synthetic customer.
  - **Manual Mode** — an agent pastes in real customer messages from a conversation happening elsewhere (e.g. another chat tool) and gets live AI coaching alongside it.
  - **Replay Mode** — step or auto-play back through a completed session, turn by turn, with all persisted sentiment/escalation data.
- **Multi-agent analysis pipeline** — every customer turn runs through:
  - **Sentiment Agent** — intent, emotional state, frustration score, satisfaction trend
  - **Knowledge Agent** — RAG-based retrieval of relevant knowledge base content
  - **Coaching Agent** — suggested responses (with tone) and a coaching tip
  - **Escalation Agent** — escalation risk score, risk level, and recommended intervention
- **Post-Interaction Reports** — auto-generated summary, resolution score, sentiment journey, and coaching tips per session, generated server-side with `xhtml2pdf` and downloaded from the Reports dashboard.
- **Reports dashboard** — search, filter by mode, pagination, and generate/regenerate/download reports.
- **Authentication** — email/password login (bcrypt-hashed passwords, JWT-based sessions), Google OAuth login, and forgot/reset password flow.
- **Knowledge base ingestion** — upload documents, which are chunked, embedded, and stored for retrieval during coaching.
- **Profile management** — view/update profile details, upload an avatar, and change password.
- **Notifications** — recent/all notification lists, unread count, mark-as-read (single and bulk), and configurable notification preferences.
- **Analytics** — an overview dashboard summarizing performance over a selected date range.

---

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS v4
- Axios for API calls
- Plain React state for navigation (no router library, by deliberate design choice for a small app)

**Backend**
- FastAPI (Python)
- SQLite via SQLAlchemy ORM (no Alembic — schema changes applied via one-off `ALTER TABLE` migration scripts)
- LangChain + ChromaDB for RAG (knowledge base retrieval)
- Local HuggingFace embeddings (`all-MiniLM-L6-v2`) — no external API cost
- [OpenRouter](https://openrouter.ai) for the generative LLM, using the `openrouter/free` auto-router for stability against free-tier model congestion
- `xhtml2pdf` for PDF report generation (pure Python, no system-level dependencies — chosen over WeasyPrint, which needs GTK system libraries that don't install cleanly on Windows)

**Auth & Integrations**
- Email/password auth: `bcrypt` password hashing + JWT access tokens (HS256, 24-hour expiry), signed with a `SECRET_KEY` (see `backend/utils/auth.py`)
- Google OAuth (via a Google Cloud OAuth Client)
- Password reset uses a separate single-use token (`secrets.token_urlsafe(32)`) stored on the `Agent` row, distinct from the JWT — this lets it be invalidated on use or superseded by a newer reset request, which a stateless JWT can't do
- Password reset emails are sent via [Resend](https://resend.com) (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`)

---

## Architecture

Each customer message triggers an orchestrated pipeline:

```
Customer message
      │
      ▼
run_coaching_pipeline()
      │
      ├── Sentiment Agent   ─┐
      ├── Knowledge Agent    │  each independently
      ├── Coaching Agent     │  try/excepted
      └── Escalation Agent  ─┘
      │
      ▼
Results persisted to Message row (sentiment_json, escalation_json)
      │
      ▼
Live coaching UI updates
```

Agents call the LLM directly via `utils/openrouter_client.py` (no agent framework) — each has its own system prompt (in `prompts/`) and parses the JSON response with markdown-fence stripping and a safe fallback if parsing fails.

At the end of a session, the **Summary Agent** reads all persisted messages and their sentiment/escalation data and produces the final report, which is then rendered to PDF via `xhtml2pdf` using `templates/report.html` and made available for download from the Reports dashboard.

### Data Model

| Table | Key Fields |
|---|---|
| **Session** | `id`, `mode` (`simulator`/`manual`/`replay`), `scenario`, `product_context`, `customer_tone`, `patience_level`, `created_at` |
| **Message** | `id`, `session_id`, `sender` (`customer`/`agent`), `content`, `frustration_score`, `sentiment_json`, `escalation_json`, `timestamp` |
| **Report** | `id`, `session_id` (unique), `summary`, `resolution_score`, `sentiment_journey` (JSON), `coaching_tips` (JSON), `created_at`, `updated_at` |
| **Agent** (user) | includes `google_id`, `reset_token`, `reset_token_expiry` for auth |

> Note: `sentiment_json` / `escalation_json` are only ever populated on `sender="customer"` rows.

### Project Structure

```
backend/
├── main.py
├── orchestrator.py              # runs the 4-agent pipeline in order
├── agents/
│   ├── simulator.py              # Customer Simulator Agent
│   ├── sentiment_agent.py
│   ├── knowledge_agent.py
│   ├── coaching_agent.py
│   ├── escalation_agent.py
│   └── summary_agent.py          # Post-interaction report generation
├── prompts/                      # system prompts per agent
├── models/
│   ├── database.py
│   ├── models.py                 # Session, Message, Report, Agent
│   └── crud.py
├── rag/
│   ├── loader.py
│   ├── splitter.py
│   └── vectorstore.py            # store_chunks + retrieve
├── routers/
│   ├── session.py
│   ├── manual.py
│   ├── simulate.py
│   ├── auth.py
│   ├── profile.py
│   ├── notifications.py
│   └── analytics.py
├── utils/
│   ├── openrouter_client.py
│   └── auth.py                   # password hashing, JWT issuing/validation, reset tokens
├── templates/
│   └── report.html               # PDF report template
└── chroma_db/, uploaded_docs/

frontend/
├── src/
│   ├── pages/                    # LandingDashboard, CoachingConsole (Simulator),
│   │                              # ManualMode, ReplayMode, Reports, Login,
│   │                              # ForgotPassword, ResetPassword, Profile,
│   │                              # Notifications, Analytics
│   ├── components/
│   │   ├── layout/                # Sidebar, DashboardLayout, Header
│   │   └── coaching/               # StatusPillRow, ConversationPanel, SentimentPanel,
│   │                                # EscalationPanel, CoachingPanel, KnowledgePanel
│   ├── hooks/                     # useSimulatorSession, useManualSession, useReplaySession
│   ├── context/                   # AuthContext
│   └── services/                  # api.js (axios instance, grouped by router)
```

---

## Challenges & How They Were Solved

**1. OpenRouter model slug format caused silent failures.**
Using a bare model name (e.g. `gemma-4-31b-it:free`) instead of the full provider-prefixed slug (`google/gemma-4-31b-it:free`) caused failures that looked like rate limiting but weren't. Fixed by always using the full prefixed slug, then moved to the `openrouter/free` auto-router for better resilience against free-tier model congestion across all OpenRouter users.

**2. A test script wasn't actually testing what it claimed to.**
`test_simulator.py` accepted a CLI argument to run one isolated test at a time, but never read it — it silently ran all three tests back-to-back on every invocation. This was the real cause of the original "rate limited" errors, since intended spacing between test calls never happened. Fixed by properly using `sys.argv` so each test makes exactly one isolated API call.

**3. Partial code snippets introduced a subtle bug.**
Editing files with partial snippets once caused a duplicate-function indentation bug. The team adopted a standing rule: always work with full file contents, never partial diffs, when editing existing files.

**4. PDF generation library didn't work on the target OS.**
WeasyPrint was the first choice for PDF report generation but requires GTK system libraries that don't install cleanly on Windows. Switched to `xhtml2pdf`, a pure-Python library with no system dependencies.

**5. Sidebar was remounting on every page navigation.**
Early on, each page self-wrapped itself in `DashboardLayout`, which caused the `Sidebar` component to remount on every navigation — this would have broken collapse state once multiple pages existed. Fixed by lifting `DashboardLayout` up to render once in `App.jsx`, with pages rendered inside it.

**6. A one-character typo silently broke a UI element.**
`escalation?.risk_lavel` (typo for `risk_level`) meant the escalation status pill never displayed risk text, with no error thrown. Caught during a review pass and fixed.

**7. The last message in a Manual Mode session could go unsaved.**
Agent replies were only persisted retroactively — triggered by the *next* customer message arriving. This meant the final agent reply in a session was never saved, since there was no subsequent turn to trigger it. Fixed by adding an explicit "end session" step that flushes the last reply to the database.

**8. Frontend components were built against incorrect field names.**
Several coaching panel components were initially built against a stale/incorrect mock schema. They were corrected against the real agent output schemas confirmed directly from the backend agent code, not the original (outdated) task brief.

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- An [OpenRouter](https://openrouter.ai) API key (free tier works)
- A Google Cloud OAuth Client ID (only needed for Google login)
- A [Resend](https://resend.com) API key and a verified sender email (needed for password-reset emails)

> Note: PDF generation uses `xhtml2pdf` (pure Python), so no extra system-level packages (like GTK) are required on any OS.

### Clone the repository

```bash
git clone <your-repo-url>
cd AssistEdge
```

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
OPENROUTER_API_KEY=your_openrouter_api_key
SECRET_KEY=your_jwt_signing_secret
GOOGLE_CLIENT_ID=your_google_oauth_client_id
FRONTEND_BASE_URL=http://localhost:5173
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=your_verified_sender_email
```

`SECRET_KEY` signs and verifies login JWTs in `backend/utils/auth.py` (`create_access_token` / `decode_access_token`, HS256, 24-hour expiry via `ACCESS_TOKEN_EXPIRE_MINUTES`) — use a long, random value in any real deployment, e.g. generate one with `python -c "import secrets; print(secrets.token_urlsafe(32))"`.

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are used to send password-reset emails via [Resend](https://resend.com) — `RESEND_FROM_EMAIL` must be a verified sender on your Resend account.

Run the server:

```bash
uvicorn main:app --reload
```

The database (`coaching_assistant.db`) is created automatically on startup via `Base.metadata.create_all()`.

Once running, interactive API docs are available at `http://localhost:8000/docs`.

### Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:

```env
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

> **To verify:** check `frontend/src/services/api.js` for how the axios base URL is set. If the backend URL (`http://localhost:8000`) is hardcoded there rather than read from an env var, consider adding a `VITE_API_BASE_URL` entry here and wiring it into `api.js` so the frontend can point at a different backend without a code change (useful for deployment).

Run the dev server:

```bash
npm run dev
```

### Running the app

With both servers running, open `http://localhost:5173` in your browser. The API runs at `http://localhost:8000`.

> If ports 8000 or 5173 are already in use on your machine, start FastAPI with `uvicorn main:app --reload --port <other-port>` and Vite with `npm run dev -- --port <other-port>`, updating `FRONTEND_BASE_URL` and the frontend's API base URL to match.

To test the forgot-password flow locally, request a reset from the UI — the reset link is sent to the requesting email address via Resend (requires a valid `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL`).

---

## Known Limitations & Future Work

- **SQLite as the database** — simple for local/demo use, but not designed for concurrent writers; a production deployment would move to Postgres or similar.
- **No Alembic (or other migration tool)** — schema changes are currently applied via one-off `ALTER TABLE` scripts, which doesn't scale well and has no rollback story.
- **`openrouter/free` auto-router rate limits** — the app depends on OpenRouter's free tier, which is shared across all users and can throttle or queue requests under load; a production deployment would use a paid model/tier.
- **Limited automated test coverage** — `test_simulator.py` covers the simulator agent in isolation; there's no broader test suite (unit, integration, or end-to-end) yet.
- **No CI/CD pipeline** — builds, linting, and tests are run manually.
- **Single-tenant local file storage** — uploaded knowledge base documents and avatars are stored on local disk (`backend/uploaded_docs/`, `backend/static/avatars/`), which won't work as-is across multiple server instances.

---

## Acknowledgments

This project was built as part of the **Infosys Springboard AI Virtual Internship**, in partnership with **Vidzai Digital**.

Project title: *Development of AI-Powered Customer Support Assistant with Live Response Guidance*.

---

## License

This project is licensed under the [MIT License](LICENSE).