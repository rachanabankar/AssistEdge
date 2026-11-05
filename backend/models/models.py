from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.sql import func
from models.database import Base


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now())
    avatar_url = Column(String, nullable=True)

    name = Column(String, nullable=True)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    department = Column(String, nullable=True)
    time_zone = Column(String, nullable=True)
    language = Column(String, nullable=True)
    last_active = Column(TIMESTAMP, nullable=True)

    notify_escalations = Column(Boolean, nullable=False, default=True)
    notify_session_report = Column(Boolean, nullable=False, default=True)
    notify_profile_updated = Column(Boolean, nullable=False, default=True)
    notify_password_changed = Column(Boolean, nullable=False, default=True)

    # Set only for accounts that have linked/signed up via Google. Kept unique
    # so two Google accounts can never collide onto the same agent.
    google_id = Column(String, unique=True, nullable=True)

    # A random URL-safe token generated on "forgot password", cleared as soon
    # as it's used (or superseded by a newer request). reset_token_expiry
    # guards against a stale token being replayed later.
    reset_token = Column(String, nullable=True)
    reset_token_expiry = Column(TIMESTAMP, nullable=True)


class Session(Base):
    __tablename__ = "sessions"

    id = Column(String, primary_key=True)
    mode = Column(String, nullable=False)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    scenario = Column(Text)
    product_context = Column(Text)
    customer_tone = Column(Text)
    patience_level = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    sender = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    # Only set on "customer" messages; populated from sentiment_agent to build frustration trend.
    frustration_score = Column(Integer, nullable=True)
    timestamp = Column(TIMESTAMP, server_default=func.now())
    sentiment_json = Column(Text, nullable=True)
    escalation_json = Column(Text, nullable=True)


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False, unique=True)
    summary = Column(Text)
    resolution_score = Column(Integer)
    sentiment_journey = Column(Text)
    coaching_tips = Column(Text)
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())


class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    issue_type = Column(String, nullable=False)
    subject = Column(Text, nullable=False)
    priority = Column(String, nullable=False)
    screenshot_url = Column(String, nullable=True)
    status = Column(String, nullable=False, default="open")
    created_at = Column(TIMESTAMP, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    category = Column(String, nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=True)
    is_read = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now())


class ReplayView(Base):
    __tablename__ = "replay_views"

    id = Column(Integer, primary_key=True, autoincrement=True)
    agent_id = Column(Integer, ForeignKey("agents.id"), nullable=False)
    session_id = Column(String, ForeignKey("sessions.id"), nullable=False)
    viewed_at = Column(TIMESTAMP, server_default=func.now())
