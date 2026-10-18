import time
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request, status

from backend.app.config import Settings, get_settings
from backend.app.database import DatabaseClient, get_db
from backend.app.models.auth import (
    TokenResponse,
    UserLoginRequest,
    UserProfileResponse,
    UserRegisterRequest,
)
from backend.app.security import (
    RoleEnum,
    create_access_token,
    get_current_user,
    hash_password,
    require_role,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

_login_attempts: dict[str, list[float]] = defaultdict(list)


def check_login_rate_limit(request: Request, max_attempts: int = 40) -> None:
    """Enforce brute-force login rate limiting per client IP."""
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window_start = now - 60.0
    _login_attempts[client_ip] = [t for t in _login_attempts[client_ip] if t > window_start]
    if len(_login_attempts[client_ip]) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many login attempts. Please wait 60 seconds before trying again.",
            headers={"Retry-After": "60"},
        )
    _login_attempts[client_ip].append(now)


@router.get("/demo-status")
async def get_demo_status(settings: Settings = Depends(get_settings)) -> dict[str, Any]:
    """Return whether demo login is enabled and the available role credentials."""
    if not settings.enable_demo_login:
        return {"enable_demo_login": False, "roles": []}

    return {
        "enable_demo_login": True,
        "roles": [
            {
                "role": RoleEnum.HEALTH_WORKER.value,
                "label": "Health Worker",
                "email": settings.demo_worker_email,
                "password": settings.demo_worker_password,
                "facility": "Ghogargaon PHC (Tribal)",
                "facility_id": settings.demo_worker_facility_id,
                "scope": "Assigned Facility Daily Operations",
                "target_dashboard": "operations",
            },
            {
                "role": RoleEnum.DISTRICT_ADMIN.value,
                "label": "District Admin",
                "email": settings.demo_admin_email,
                "password": settings.demo_admin_password,
                "facility": "Pune District Command Center",
                "facility_id": None,
                "scope": "Full Command Center & Lateral Stock Redistribution",
                "target_dashboard": "dashboard",
            },
            {
                "role": RoleEnum.STATE_VIEWER.value,
                "label": "State Viewer",
                "email": settings.demo_state_email,
                "password": settings.demo_state_password,
                "facility": "Maharashtra State Health Directorate",
                "facility_id": None,
                "scope": "Statewide Oversight (Read-Only Mode)",
                "target_dashboard": "dashboard",
            },
        ],
    }


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLoginRequest,
    request: Request,
    db: DatabaseClient = Depends(get_db),
) -> TokenResponse:
    """Authenticate with username/email and password, return JWT bearer token."""
    check_login_rate_limit(request)

    target = credentials.username.strip().lower()
    user = await db.get_document("users", credentials.username)
    if not user:
        user = await db.get_document("users", target)
    if not user:
        # Search by email or alias
        all_users = await db.query_documents("users")
        for u in all_users:
            if u.get("email", "").lower() == target or u.get("username", "").lower() == target:
                user = u
                break

    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    settings = get_settings()
    claims = {
        "sub": user["username"],
        "role": user["role"],
        "centre_id": user.get("centre_id"),
        "name": user.get("full_name", user["username"]),
        "district": user.get("district", "Pune"),
    }
    access_token = create_access_token(data=claims)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in_seconds=settings.access_token_expire_minutes * 60,
        role=user["role"],
        username=user["username"],
        full_name=user.get("full_name", user["username"]),
        centre_id=user.get("centre_id"),
        district=user.get("district", "Pune"),
    )


@router.post(
    "/register",
    response_model=UserProfileResponse,
    dependencies=[Depends(require_role([RoleEnum.DISTRICT_ADMIN]))],
)
async def register_user(
    payload: UserRegisterRequest, db: DatabaseClient = Depends(get_db)
) -> UserProfileResponse:
    """Register a new staff member (requires District Admin role)."""
    existing = await db.get_document("users", payload.username)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{payload.username}' is already registered",
        )

    doc = {
        "id": f"user_{payload.username}",
        "username": payload.username,
        "email": payload.email,
        "full_name": payload.full_name,
        "hashed_password": hash_password(payload.password),
        "role": payload.role.value,
        "centre_id": payload.centre_id,
        "district": payload.district,
    }
    await db.set_document("users", payload.username, doc)

    return UserProfileResponse(
        username=payload.username,
        email=payload.email,
        full_name=payload.full_name,
        role=payload.role.value,
        centre_id=payload.centre_id,
        district=payload.district,
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(
    current_user: dict[str, Any] = Depends(get_current_user),
    db: DatabaseClient = Depends(get_db),
) -> UserProfileResponse:
    """Retrieve profile of authenticated user."""
    user = await db.get_document("users", current_user["username"])
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User record not found")

    return UserProfileResponse(
        username=user["username"],
        email=user.get("email", "staff@smarthealth.gov.in"),
        full_name=user.get("full_name", user["username"]),
        role=user["role"],
        centre_id=user.get("centre_id"),
        district=user.get("district", "Pune"),
    )
