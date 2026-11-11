import os
import logging

import resend

logger = logging.getLogger(__name__)

resend.api_key = os.getenv("RESEND_API_KEY")

FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev")


def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    """
    Sends the password-reset email via Resend.

    Returns True if the send call succeeded, False otherwise. Never raises —
    a failed email should not 500 the /forgot-password endpoint, since that
    endpoint intentionally always returns a generic success message (to avoid
    leaking whether an account exists).
    """
    if not resend.api_key:
        logger.warning(
            "RESEND_API_KEY not set — skipping real email send. "
            "Set RESEND_API_KEY in .env to enable password-reset emails."
        )
        return False

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [to_email],
            "subject": "Reset your AssistEdge password",
            "html": f"""
                <p>We received a request to reset your AssistEdge password.</p>
                <p><a href="{reset_link}">Click here to reset your password</a></p>
                <p>This link expires in 30 minutes. If you didn't request this,
                you can safely ignore this email.</p>
            """,
        })
        return True
    except Exception:
        # Provider exceptions may contain the request body, including reset links.
        logger.error("Failed to send password reset email through Resend")
        return False
