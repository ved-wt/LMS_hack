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

    # Streak Logic
    from datetime import datetime, timedelta
    today = datetime.utcnow().date().isoformat()
    
    if profile.last_active_date != today:
        yesterday = (datetime.utcnow().date() - timedelta(days=1)).isoformat()
        
        if profile.last_active_date == yesterday:
            profile.streak_count += 1
        elif profile.last_active_date is None:
            profile.streak_count = 1
        else:
            # Missed a day (or more), reset to 1 (since they are active today)
            profile.streak_count = 1
            
        profile.last_active_date = today
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
        "streak_count": profile.streak_count,
    }


from pydantic import BaseModel

class ProfileUpdate(BaseModel):
    phone: str | None = None
    location: str | None = None
    bio: str | None = None
    tech_stack: list[str] | None = None
    skills: list[str] | None = None

@router.put("/{user_id}")
async def update_profile(
    user_id: UUID,
    profile_update: ProfileUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update user's profile."""
    result = await session.execute(select(Profile).where(Profile.user_id == user_id))
    profile = result.scalar_one_or_none()

    if not profile:
        profile = Profile(user_id=user_id)
        session.add(profile)

    if profile_update.phone is not None:
        profile.phone = profile_update.phone
    if profile_update.location is not None:
        profile.location = profile_update.location
    if profile_update.bio is not None:
        profile.bio = profile_update.bio
    if profile_update.tech_stack is not None:
        profile.tech_stack = profile_update.tech_stack
    if profile_update.skills is not None:
        profile.skills = profile_update.skills

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
