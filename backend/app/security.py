"""Security and Authentication utilities for SmartHealth.

Includes:
- Passlib bcrypt password hashing
- JWT token issuance and decoding
- Role-Based Access Control (RBAC) for district_admin & centre_staff
- Input sanitization and prompt injection defense
- Secure HTTP headers
- In-memory rate limiting middleware
"""

import html
import re
import time
from collections import defaultdict
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import Any

import bcrypt
from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from starlette.middleware.base import BaseHTTPMiddleware

from backend.app.config import get_settings

# JWT bearer scheme
security_bearer = HTTPBearer(auto_error=False)


class RoleEnum(str, Enum):
    """User roles for Role-Based Access Control (RBAC)."""

    DISTRICT_ADMIN = "district_admin"
    CENTRE_STAFF = "centre_staff"


# Known prompt injection signatures to neutralize
PROMPT_INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+instructions?", re.IGNORECASE),
    re.compile(r"disregard\s+(all\s+)?(previous|prior)\s+instructions?", re.IGNORECASE),
    re.compile(r"system\s+prompt", re.IGNORECASE),
    re.compile(r"reveal\s+your\s+instructions", re.IGNORECASE),
    re.compile(r"you\s+are\s+now\s+(dan|jailbreak|unrestricted)", re.IGNORECASE),
    re.compile(r"switch\s+to\s+developer\s+mode", re.IGNORECASE),
    re.compile(r"<\|im_start\|>|<\|im_end\|>|\[INST\]|\[/INST\]", re.IGNORECASE),
]


def hash_password(password: str) -> str:
    """Hash plaintext password with bcrypt."""
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt(rounds=10)
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plaintext password against bcrypt hash."""
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False


def create_access_token(
    data: dict[str, Any],
    expires_delta: timedelta | None = None,
) -> str:
    """Generate signed JWT access token.

    Args:
        data: Claims payload to encode.
        expires_delta: Custom lifetime, defaults to settings duration.

    Returns:
        Encoded JWT token string.
    """
    settings = get_settings()
    to_encode = data.copy()
    now = datetime.now(UTC)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)

    to_encode.update({"exp": expire, "iat": now})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> dict[str, Any]:
    """Decode and validate JWT access token.

    Args:
        token: Bearer JWT string.

    Returns:
        Decoded token payload dict.

    Raises:
        HTTPException: If token is expired or malformed.
    """
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def sanitize_text(text: str) -> str:
    """Sanitize user input before processing or forwarding to Gemini LLM.

    Performs:
    - HTML entity escaping to neutralize XSS
    - Stripping control characters and NULL bytes
    - Detecting and neutralizing prompt injection attempts
    """
    if not text:
        return ""

    # Remove null bytes and non-printable control characters (except newline, tab)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)

    # Escape HTML to prevent XSS injection
    cleaned = html.escape(cleaned, quote=True)

    # Neutralize prompt injection attempts by replacing matched triggers with safe token
    for pattern in PROMPT_INJECTION_PATTERNS:
        cleaned = pattern.sub("[REDACTED_PROMPT_INJECTION_PATTERN]", cleaned)

    return cleaned.strip()


async def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security_bearer),
) -> dict[str, Any]:
    """FastAPI dependency to extract and validate the authenticated user from JWT.

    Raises:
        HTTPException: If bearer token is absent or invalid.
    """
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_access_token(auth.credentials)
    username: str | None = payload.get("sub")
    role: str | None = payload.get("role")
    centre_id: str | None = payload.get("centre_id")

    if not username or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload is missing user identity or role",
        )

    return {
        "username": username,
        "role": role,
        "centre_id": centre_id,
        "name": payload.get("name", username),
        "district": payload.get("district", "Pune"),
    }


def require_role(allowed_roles: list[RoleEnum]) -> Callable[..., Any]:
    """Dependency factory enforcing Role-Based Access Control.

    Args:
        allowed_roles: List of roles permitted to access the route.

    Returns:
        Dependency verifying current user role.
    """

    async def role_checker(
        current_user: dict[str, Any] = Depends(get_current_user),
    ) -> dict[str, Any]:
        user_role = current_user.get("role")
        if user_role not in [role.value for role in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of roles: {[r.value for r in allowed_roles]}",
            )
        return current_user

    return role_checker


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Enforce strict HTTP security headers on all responses."""

    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(self), microphone=(self), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https://*.tile.openstreetmap.org https://maps.googleapis.com https://*.google.com; "
            "connect-src 'self' https://generativelanguage.googleapis.com https://maps.googleapis.com; "
            "frame-ancestors 'none';"
        )
        return response


class RateLimiterMiddleware(BaseHTTPMiddleware):
    """In-memory sliding window rate limiter per client IP."""

    def __init__(self, app: Any, requests_per_minute: int = 120) -> None:
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.request_records: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable[..., Any]) -> Response:
        # Exempt health check and static assets from rate limits
        if request.url.path in ["/healthz", "/readyz"] or request.url.path.startswith("/static"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        window_start = now - 60.0

        # Purge timestamps outside sliding 60s window
        valid_timestamps = [t for t in self.request_records[client_ip] if t > window_start]
        self.request_records[client_ip] = valid_timestamps

        if len(valid_timestamps) >= self.requests_per_minute:
            return Response(
                content='{"detail": "Rate limit exceeded. Please wait before making more requests."}',
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                media_type="application/json",
                headers={"Retry-After": "60"},
            )

        self.request_records[client_ip].append(now)
        return await call_next(request)
