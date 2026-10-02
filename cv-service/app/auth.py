import hmac

from fastapi import Header

from .config import get_settings
from .errors import CvError


def require_auth(authorization: str | None = Header(default=None)) -> None:
    """Bearer-token check. Generic message on purpose: never hint at what was wrong."""
    scheme, _, token = (authorization or "").partition(" ")
    expected = get_settings().cv_service_secret
    ok = scheme.lower() == "bearer" and hmac.compare_digest(token.encode(), expected.encode())
    if not ok:
        raise CvError("UNAUTHORIZED", 401, "Unauthorized")
