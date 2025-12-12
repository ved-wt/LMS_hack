"""Authentication routes."""

from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import get_settings
from src.core.db import get_session
from src.core.security import create_access_token, hash_password, verify_password
from src.models.user import User, UserRole

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register")
async def register(
    email: str,
    password: str,
    full_name: str,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Register a new user."""
    # Check if user exists
    result = await session.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Create user
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=UserRole.EMPLOYEE,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
    }


@router.post("/login")
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Login and get access token."""
    # Find user
    result = await session.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )

    # Create access token
    settings = get_settings()
    access_token = create_access_token(
        subject=str(user.id),
        roles=[user.role.value],
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role.value,
        },
    }
