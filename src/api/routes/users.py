"""User management routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.user import User

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}")
async def get_user(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get user by ID."""
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "is_active": user.is_active,
        "department_id": str(user.department_id) if user.department_id else None,
        "manager_id": str(user.manager_id) if user.manager_id else None,
    }


@router.get("")
async def list_users(
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """List all users with pagination."""
    result = await session.execute(select(User).offset(skip).limit(limit))
    users = result.scalars().all()

    return {
        "items": [
            {
                "id": str(u.id),
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role.value,
                "is_active": u.is_active,
            }
            for u in users
        ],
        "total": len(users),
    }
