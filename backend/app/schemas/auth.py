from uuid import UUID

from pydantic import BaseModel, EmailStr, field_validator


class RegisterRequest(BaseModel):
    studio_name: str
    studio_cuit: str
    studio_email: EmailStr
    user_email: EmailStr
    user_password: str
    user_first_name: str
    user_last_name: str

    @field_validator("studio_cuit")
    @classmethod
    def validate_cuit(cls, v: str) -> str:
        digits = v.replace("-", "").replace(" ", "")
        if not digits.isdigit() or len(digits) != 11:
            raise ValueError("El CUIT debe tener 11 dígitos")
        return digits

    @field_validator("user_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class StudioResponse(BaseModel):
    id: UUID
    name: str

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: UUID
    email: str
    first_name: str
    last_name: str
    role: str
    studio: StudioResponse

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class AccessTokenResponse(BaseModel):
    access_token: str
    expires_in: int
