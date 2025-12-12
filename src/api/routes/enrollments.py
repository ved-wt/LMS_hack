"""Enrollment management routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.notifications import notify_enrollment_confirmed
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.training import Training
from src.api.deps.auth import get_current_user
from src.models.user import User

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post("")
async def enroll_in_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Enroll user in a training."""
    user_id = current_user.id
    # Check if training exists
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # Check if already enrolled
    result = await session.execute(
        select(Enrollment).where(
            Enrollment.user_id == user_id,
            Enrollment.training_id == training_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already enrolled in this training",
        )

    # Create enrollment
    enrollment = Enrollment(
        user_id=user_id,
        training_id=training_id,
        status=EnrollmentStatus.ENROLLED,
    )
    session.add(enrollment)

    # Create notification
    await notify_enrollment_confirmed(
        session=session,
        user_id=user_id,
        training_title=training.title,
    )

    await session.commit()
    await session.refresh(enrollment)

    return {
        "id": str(enrollment.id),
        "user_id": str(enrollment.user_id),
        "training_id": str(enrollment.training_id),
        "status": enrollment.status.value,
        "completion_percentage": enrollment.completion_percentage,
    }


@router.get("/user/{user_id}")
async def get_user_enrollments(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get user's enrollments."""
    query = (
        select(Enrollment, Training.title)
        .join(Training, Enrollment.training_id == Training.id)
        .where(Enrollment.user_id == user_id)
    )
    result = await session.execute(query)
    rows = result.all()

    return {
        "items": [
            {
                "id": str(e.id),
                "training_id": str(e.training_id),
                "title": title,
                "status": e.status.value,
                "completion_percentage": e.completion_percentage,
                "is_assigned": e.is_assigned,
            }
            for e, title in rows
        ],
        "total": len(rows),
    }


@router.get("/{enrollment_id}")
async def get_enrollment(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get enrollment by ID."""
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    return {
        "id": str(enrollment.id),
        "user_id": str(enrollment.user_id),
        "training_id": str(enrollment.training_id),
        "status": enrollment.status.value,
        "completion_percentage": enrollment.completion_percentage,
        "is_assigned": enrollment.is_assigned,
    }
