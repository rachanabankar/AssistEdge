from models.database import SessionLocal
from models import crud

# Open a database connection (like picking up the phone line)
db = SessionLocal()

# 1. Create a session
session = crud.create_session(
    db,
    mode="simulator",
    scenario="Customer angry about a late refund",
    product_context="E-commerce order management app"
)
print("Created session:", session.id, session.mode, session.created_at)

# 2. Add a couple of messages to that session
msg1 = crud.add_message(db, session_id=session.id, sender="customer", content="Where is my refund?!")
msg2 = crud.add_message(db, session_id=session.id, sender="agent", content="Let me check that for you.")
print("Added messages:", msg1.content, "|", msg2.content)

# 3. Fetch all messages back for that session
all_messages = crud.get_messages(db, session_id=session.id)
print(f"\nAll messages for session {session.id}:")
for m in all_messages:
    print(f"  [{m.sender}] {m.content}")

# 4. Create a report for the session
report = crud.create_report(
    db,
    session_id=session.id,
    summary="Agent resolved the refund query calmly.",
    resolution_score=8,
    sentiment_journey='[{"turn":1,"sentiment":"angry"},{"turn":2,"sentiment":"neutral"}]',
    coaching_tips='["Acknowledge frustration before explaining process."]'
)
print("\nCreated report:", report.summary, "| Score:", report.resolution_score)

# 5. Fetch the session back to confirm it's really saved
fetched = crud.get_session(db, session_id=session.id)
print("\nFetched session back from DB:", fetched.id, fetched.scenario)

db.close()