"""Authentication and authorization dependencies for FastAPI routes."""

from typing import Annotated, Callable
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.security import decode_access_token, verify_token_claims
from src.models.user import User

# OAuth2 scheme for token extraction from Authorization header
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    session: Annotated[AsyncSession, Depends(get_session)],
) -> User:
    """
    Decode JWT token and fetch current user from database.

    Args:
        token: JWT access token from Authorization header
        session: Database session

    Returns:
        User object from database

    Raises:
        HTTPException: 401 if token invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode token
        payload = decode_access_token(token)
        user_id, roles = verify_token_claims(payload)
    except (JWTError, ValueError) as e:
        raise credentials_exception from e

    # Fetch user from database
    user = await session.get(User, UUID(user_id))

    if user is None:
        raise credentials_exception

    return user


def require_roles(*allowed_roles: str) -> Callable:
    """
    Dependency factory for role-based access control.

    Creates a dependency that validates current user has one of the allowed roles.

    Args:
        *allowed_roles: One or more role names (e.g., "ADMIN", "SUPER_ADMIN")

    Returns:
        Async dependency function for FastAPI

    Example:
        @router.post("/trainings", dependencies=[Depends(require_roles("ADMIN", "SUPER_ADMIN"))])
        async def create_training(...):
            ...
    """

    async def role_checker(
        current_user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        """Check if current user has required role."""
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}",
            )

        return current_user

    return role_checker


async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
) -> User:
    """
    Ensure current user account is active.

    Args:
        current_user: User object from get_current_user

    Returns:
        Active user object

    Raises:
        HTTPException: 400 if user account is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    return current_user
