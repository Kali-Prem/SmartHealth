"""Authentication API Endpoints."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from backend.app.config import get_settings
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


@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLoginRequest, db: DatabaseClient = Depends(get_db)
) -> TokenResponse:
    """Authenticate with username and password, return JWT bearer token."""
    user = await db.get_document("users", credentials.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not verify_password(credentials.password, user.get("hashed_password", "")):
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
        username=doc["username"],
        email=doc["email"],
        full_name=doc["full_name"],
        role=doc["role"],
        centre_id=doc["centre_id"],
        district=doc["district"],
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
