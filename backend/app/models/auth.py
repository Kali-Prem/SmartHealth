"""Authentication and User Models."""

from pydantic import BaseModel, EmailStr, Field

from backend.app.security import RoleEnum


class UserLoginRequest(BaseModel):
    """User credentials payload for authentication."""

    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=6, max_length=100, description="Plaintext password")


class UserRegisterRequest(BaseModel):
    """New user registration payload."""

    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr = Field(...)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)
    role: RoleEnum = Field(default=RoleEnum.CENTRE_STAFF)
    centre_id: str | None = Field(default=None, description="PHC or CHC facility ID")
    district: str = Field(default="Pune")


class TokenResponse(BaseModel):
    """JWT Bearer token response."""

    access_token: str
    token_type: str = "bearer"
    expires_in_seconds: int
    role: str
    username: str
    full_name: str
    centre_id: str | None = None
    district: str = "Pune"


class UserProfileResponse(BaseModel):
    """Authenticated user profile."""

    username: str
    email: str
    full_name: str
    role: str
    centre_id: str | None = None
    district: str
