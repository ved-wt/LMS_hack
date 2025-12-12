"""Security utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.core.config import get_settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hash plaintext password using bcrypt.

    Args:
        plain_password: Plaintext password to hash

    Returns:
        Hashed password string
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plaintext password against hashed password.

    Args:
        plain_password: Plaintext password to verify
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(
    subject: str,
    roles: list[str],
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Create JWT access token with user claims.

    Args:
        subject: User ID (sub claim)
        roles: List of user roles
        expires_delta: Optional custom expiration timedelta

    Returns:
        Encoded JWT token string
    """
    settings = get_settings()

    if expires_delta is None:
        expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    now = datetime.now(timezone.utc)
    expire = now + expires_delta

    payload = {
        "sub": subject,
        "roles": roles,
        "exp": expire,
        "iat": now,
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )

    return encoded_jwt


def decode_access_token(token: str) -> dict:
    """
    Decode and validate JWT access token.

    Args:
        token: JWT token string

    Returns:
        Decoded token payload dictionary

    Raises:
        JWTError: If token is invalid, expired, or malformed
    """
    settings = get_settings()

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except JWTError as e:
        raise JWTError(f"Invalid token: {str(e)}") from e


def verify_token_claims(payload: dict) -> tuple[str, list[str]]:
    """
    Extract and validate required claims from token payload.

    Args:
        payload: Decoded JWT payload dictionary

    Returns:
        Tuple of (user_id, roles)

    Raises:
        ValueError: If required claims are missing
    """
    user_id = payload.get("sub")
    roles = payload.get("roles", [])

    if not user_id:
        raise ValueError("Token missing 'sub' claim")

    if not isinstance(roles, list):
        raise ValueError("Token 'roles' claim must be a list")

    return user_id, roles
