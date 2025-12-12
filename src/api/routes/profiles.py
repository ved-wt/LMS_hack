"""User profile routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.profile import Profile

router = APIRouter(prefix="/profiles", tags=["profiles"])


@router.get("/{user_id}")
async def get_profile(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get user's profile."""
    result = await session.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        # Create profile if doesn't exist
        profile = Profile(user_id=user_id)
        session.add(profile)
        await session.commit()
        await session.refresh(profile)

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "phone": profile.phone,
        "location": profile.location,
        "bio": profile.bio,
        "tech_stack": profile.tech_stack,
        "skills": profile.skills,
        "total_learning_hours": profile.total_learning_hours,
    }


@router.put("/{user_id}")
async def update_profile(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    phone: str | None = None,
    location: str | None = None,
    bio: str | None = None,
    tech_stack: list[str] | None = None,
    skills: list[str] | None = None,
):
    """Update user's profile."""
    result = await session.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = Profile(user_id=user_id)
        session.add(profile)

    if phone is not None:
        profile.phone = phone
    if location is not None:
        profile.location = location
    if bio is not None:
        profile.bio = bio
    if tech_stack is not None:
        profile.tech_stack = tech_stack
    if skills is not None:
        profile.skills = skills

    await session.commit()
    await session.refresh(profile)

    return {
        "id": str(profile.id),
        "user_id": str(profile.user_id),
        "phone": profile.phone,
        "location": profile.location,
        "bio": profile.bio,
        "tech_stack": profile.tech_stack,
        "skills": profile.skills,
        "total_learning_hours": profile.total_learning_hours,
    }
