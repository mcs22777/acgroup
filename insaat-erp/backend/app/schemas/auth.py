"""Auth şemaları."""

from uuid import UUID
from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserCreate(BaseModel):
    email: str = Field(max_length=255)
    password: str = Field(min_length=6)
    first_name: str = Field(max_length=100)
    last_name: str = Field(max_length=100)
    phone: str | None = None
    role: str = "viewer"


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    phone: str | None
    role: str
    is_active: bool

    model_config = {"from_attributes": True}
