from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    verify_password,
)
from app.core.config import settings
from app.models.studio import Studio
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.auth import (
    AccessTokenResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    StudioResponse,
)


class AuthService:
    def __init__(self, session: AsyncSession):
        self.repo = UserRepository(session)
        self.session = session

    async def register(self, data: RegisterRequest) -> TokenResponse:
        if await self.repo.studio_cuit_exists(data.studio_cuit):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El CUIT del estudio ya está registrado")

        if await self.repo.studio_email_exists(data.studio_email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email del estudio ya está registrado")

        if await self.repo.get_by_email(data.user_email):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email del usuario ya está registrado")

        studio = await self.repo.create_studio(
            name=data.studio_name,
            cuit=data.studio_cuit,
            email=data.studio_email,
        )

        user = await self.repo.create_user(
            studio_id=studio.id,
            email=data.user_email,
            password_hash=hash_password(data.user_password),
            first_name=data.user_first_name,
            last_name=data.user_last_name,
            role="admin",
        )

        await self.session.commit()
        return await self._issue_tokens(user)

    async def login(self, data: LoginRequest) -> TokenResponse:
        user = await self.repo.get_by_email(data.email)
        if not user or not verify_password(data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Credenciales incorrectas",
            )

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inactivo")

        await self.repo.update_last_login(user.id)
        await self.session.commit()
        return await self._issue_tokens(user)

    async def refresh(self, raw_token: str) -> AccessTokenResponse:
        token_hash = hash_refresh_token(raw_token)
        rt = await self.repo.get_valid_refresh_token(token_hash)

        if not rt:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token inválido o expirado",
            )

        user = await self.repo.get_by_id(rt.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario inválido")

        access_token = create_access_token(user.id, user.studio_id, user.role)
        return AccessTokenResponse(
            access_token=access_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    async def logout(self, raw_token: str) -> None:
        token_hash = hash_refresh_token(raw_token)
        await self.repo.revoke_refresh_token(token_hash)
        await self.session.commit()

    async def get_me(self, user_id, studio_id) -> UserResponse:
        from uuid import UUID
        user = await self.repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

        studio = await self.repo.get_studio_by_id(studio_id)

        return UserResponse(
            id=user.id,
            email=user.email,
            first_name=user.first_name,
            last_name=user.last_name,
            role=user.role,
            studio=StudioResponse(id=studio.id, name=studio.name),
        )

    async def _issue_tokens(self, user: User) -> TokenResponse:
        access_token = create_access_token(user.id, user.studio_id, user.role)
        raw_refresh = generate_refresh_token()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        await self.repo.save_refresh_token(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=expires_at,
        )
        await self.session.commit()
        return TokenResponse(
            access_token=access_token,
            refresh_token=raw_refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
