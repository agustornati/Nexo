from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.database.session import get_session

bearer_scheme = HTTPBearer()


class CurrentUser:
    def __init__(self, user_id: UUID, studio_id: UUID, role: str):
        self.user_id = user_id
        self.studio_id = studio_id
        self.role = role


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    session: AsyncSession = Depends(get_session),
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o expirado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(credentials.credentials)
        if payload.get("type") != "access":
            raise credentials_exception
        user_id = UUID(payload["sub"])
        studio_id = UUID(payload["studio_id"])
        role: str = payload["role"]
    except (JWTError, KeyError, ValueError):
        raise credentials_exception

    return CurrentUser(user_id=user_id, studio_id=studio_id, role=role)


def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin")
    return current_user
