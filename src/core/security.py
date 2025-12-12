"""Security utilities for password hashing and JWT token management."""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt

from src.core.config import get_settings


def hash_password(plain_password: str) -> str:
    """
    Hash plaintext password using bcrypt.

    Args:
        plain_password: Plaintext password to hash

    Returns:
        Hashed password string
    """
    # Bcrypt has a 72-byte limit, truncate if necessary
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify plaintext password against hashed password.

    Args:
        plain_password: Plaintext password to verify
        hashed_password: Hashed password from database

    Returns:
        True if password matches, False otherwise
    """
    password_bytes = plain_password.encode("utf-8")
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]

    hashed_bytes = hashed_password.encode("utf-8")
    return bcrypt.checkpw(password_bytes, hashed_bytes)


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
