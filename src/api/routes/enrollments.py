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

router = APIRouter(prefix="/enrollments", tags=["enrollments"])


@router.post("")
async def enroll_in_training(
    training_id: UUID,
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Enroll user in a training."""
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
    result = await session.execute(
        select(Enrollment).where(Enrollment.user_id == user_id)
    )
    enrollments = result.scalars().all()

    return {
        "items": [
            {
                "id": str(e.id),
                "training_id": str(e.training_id),
                "status": e.status.value,
                "completion_percentage": e.completion_percentage,
                "is_assigned": e.is_assigned,
            }
            for e in enrollments
        ],
        "total": len(enrollments),
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
