from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken
from app.models.studio import Studio
from app.models.user import User


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def get_by_id(self, user_id: UUID) -> User | None:
        result = await self.session.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_studio_by_id(self, studio_id: UUID) -> Studio | None:
        result = await self.session.execute(select(Studio).where(Studio.id == studio_id))
        return result.scalar_one_or_none()

    async def studio_cuit_exists(self, cuit: str) -> bool:
        result = await self.session.execute(select(Studio.id).where(Studio.cuit == cuit))
        return result.scalar_one_or_none() is not None

    async def studio_email_exists(self, email: str) -> bool:
        result = await self.session.execute(select(Studio.id).where(Studio.email == email))
        return result.scalar_one_or_none() is not None

    async def create_studio(self, name: str, cuit: str, email: str) -> Studio:
        studio = Studio(name=name, cuit=cuit, email=email)
        self.session.add(studio)
        await self.session.flush()
        return studio

    async def create_user(
        self,
        studio_id: UUID,
        email: str,
        password_hash: str,
        first_name: str,
        last_name: str,
        role: str = "admin",
    ) -> User:
        user = User(
            studio_id=studio_id,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            role=role,
        )
        self.session.add(user)
        await self.session.flush()
        return user

    async def update_last_login(self, user_id: UUID) -> None:
        await self.session.execute(
            update(User).where(User.id == user_id).values(last_login_at=datetime.now(timezone.utc))
        )

    async def save_refresh_token(self, user_id: UUID, token_hash: str, expires_at: datetime) -> RefreshToken:
        rt = RefreshToken(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.session.add(rt)
        await self.session.flush()
        return rt

    async def get_valid_refresh_token(self, token_hash: str) -> RefreshToken | None:
        result = await self.session.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revoked_at.is_(None),
                RefreshToken.expires_at > datetime.now(timezone.utc),
            )
        )
        return result.scalar_one_or_none()

    async def revoke_refresh_token(self, token_hash: str) -> None:
        await self.session.execute(
            update(RefreshToken)
            .where(RefreshToken.token_hash == token_hash)
            .values(revoked_at=datetime.now(timezone.utc))
        )
