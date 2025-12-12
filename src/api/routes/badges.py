"""Badge management and awarding routes."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.notifications import notify_badge_earned
from src.models.badge import Badge, BadgeType
from src.models.completion import TrainingCompletion

router = APIRouter(prefix="/badges", tags=["badges"])


def determine_badge_type(hours: float) -> BadgeType | None:
    """Determine badge type based on learning hours."""
    if hours >= 80:
        return BadgeType.PLATINUM
    elif hours >= 60:
        return BadgeType.GOLD
    elif hours >= 40:
        return BadgeType.SILVER
    elif hours >= 20:
        return BadgeType.BRONZE
    return None


@router.post("/calculate/{user_id}/{year}")
async def calculate_and_award_badge(
    user_id: UUID,
    year: int,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Calculate learning hours for a year and award appropriate badge.

    Badge tiers:
    - BRONZE: 20+ hours
    - SILVER: 40+ hours
    - GOLD: 60+ hours
    - PLATINUM: 80+ hours
    """
    # Check if badge already exists for this year
    existing_badge_query = select(Badge).where(
        Badge.user_id == user_id, Badge.year_earned == year
    )
    result = await session.execute(existing_badge_query)
    existing_badge = result.scalar_one_or_none()

    if existing_badge:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Badge already awarded for year {year}",
        )

    # Get all completions for the user in the specified year
    completions_query = select(TrainingCompletion).where(
        TrainingCompletion.user_id == user_id,
        func.extract("year", TrainingCompletion.completed_at) == year,
    )
    completions_result = await session.execute(completions_query)
    completions = completions_result.scalars().all()

    if not completions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"No completed trainings found for year {year}",
        )

    # Calculate total learning hours
    total_hours = sum(c.learning_hours for c in completions)
    total_trainings = len(completions)

    # Determine badge type
    badge_type = determine_badge_type(total_hours)

    if not badge_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient learning hours ({total_hours:.1f}). Minimum 20 hours required for BRONZE badge.",
        )

    # Create badge
    badge = Badge(
        user_id=user_id,
        badge_type=badge_type,
        year_earned=year,
        hours_completed=total_hours,
        trainings_completed=total_trainings,
        awarded_at=datetime.utcnow().isoformat(),
    )
    session.add(badge)

    # Create notification
    await notify_badge_earned(
        session=session,
        user_id=user_id,
        badge_type=badge_type.value,
        year=year,
        hours=total_hours,
    )

    await session.commit()
    await session.refresh(badge)

    return {
        "id": str(badge.id),
        "badge_type": badge.badge_type.value,
        "year_earned": badge.year_earned,
        "hours_completed": badge.hours_completed,
        "trainings_completed": badge.trainings_completed,
        "awarded_at": badge.awarded_at,
        "message": f"Congratulations! {badge_type.value} badge awarded for {year}",
    }


@router.get("/user/{user_id}")
async def get_user_badges(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get all badges earned by a user."""
    query = (
        select(Badge).where(Badge.user_id == user_id).order_by(Badge.year_earned.desc())
    )
    result = await session.execute(query)
    badges = result.scalars().all()

    return {
        "items": [
            {
                "id": str(b.id),
                "badge_type": b.badge_type.value,
                "year_earned": b.year_earned,
                "hours_completed": b.hours_completed,
                "trainings_completed": b.trainings_completed,
                "awarded_at": b.awarded_at,
            }
            for b in badges
        ],
        "total": len(badges),
    }


@router.get("/year/{year}")
async def get_badges_by_year(
    year: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """Get all badges awarded in a specific year (admin view)."""
    query = (
        select(Badge)
        .where(Badge.year_earned == year)
        .offset(skip)
        .limit(limit)
        .order_by(Badge.hours_completed.desc())
    )
    result = await session.execute(query)
    badges = result.scalars().all()

    return {
        "items": [
            {
                "id": str(b.id),
                "user_id": str(b.user_id),
                "badge_type": b.badge_type.value,
                "year_earned": b.year_earned,
                "hours_completed": b.hours_completed,
                "trainings_completed": b.trainings_completed,
                "awarded_at": b.awarded_at,
            }
            for b in badges
        ],
        "total": len(badges),
        "year": year,
    }


@router.get("/statistics/{user_id}")
async def get_user_badge_statistics(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get badge statistics and progress for a user."""
    # Get all badges
    badges_query = select(Badge).where(Badge.user_id == user_id)
    badges_result = await session.execute(badges_query)
    badges = badges_result.scalars().all()

    # Count by type
    badge_counts = {
        "BRONZE": sum(1 for b in badges if b.badge_type == BadgeType.BRONZE),
        "SILVER": sum(1 for b in badges if b.badge_type == BadgeType.SILVER),
        "GOLD": sum(1 for b in badges if b.badge_type == BadgeType.GOLD),
        "PLATINUM": sum(1 for b in badges if b.badge_type == BadgeType.PLATINUM),
    }

    # Get current year progress
    current_year = datetime.now().year
    current_year_completions_query = select(TrainingCompletion).where(
        TrainingCompletion.user_id == user_id,
        func.extract("year", TrainingCompletion.completed_at) == current_year,
    )
    current_completions_result = await session.execute(current_year_completions_query)
    current_completions = current_completions_result.scalars().all()

    current_year_hours = sum(c.learning_hours for c in current_completions)
    next_badge = determine_badge_type(current_year_hours)
    hours_to_next = 0

    if not next_badge:
        hours_to_next = 20 - current_year_hours
        next_badge_name = "BRONZE"
    elif next_badge == BadgeType.BRONZE:
        hours_to_next = 40 - current_year_hours
        next_badge_name = "SILVER"
    elif next_badge == BadgeType.SILVER:
        hours_to_next = 60 - current_year_hours
        next_badge_name = "GOLD"
    elif next_badge == BadgeType.GOLD:
        hours_to_next = 80 - current_year_hours
        next_badge_name = "PLATINUM"
    else:
        hours_to_next = 0
        next_badge_name = "PLATINUM (Achieved)"

    return {
        "total_badges": len(badges),
        "badge_counts": badge_counts,
        "current_year": current_year,
        "current_year_hours": current_year_hours,
        "current_year_trainings": len(current_completions),
        "next_badge": next_badge_name,
        "hours_to_next_badge": max(0, hours_to_next),
    }
