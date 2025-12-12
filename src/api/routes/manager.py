"""Manager-specific routes for team management and training assignments."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.notifications import notify_training_assigned
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.training import Training
from src.models.user import User

router = APIRouter(prefix="/manager", tags=["manager"])


@router.post("/assign-training")
async def assign_training_to_team_member(
    user_id: UUID,
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    manager_id: UUID | None = None,
    session_id: UUID | None = None,
):
    """Assign training to a team member (manager only - auth disabled for now)."""
    # Verify user exists
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    # Verify training exists
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # Check if already enrolled
    query = select(Enrollment).where(
        Enrollment.user_id == user_id,
        Enrollment.training_id == training_id,
    )
    result = await session.execute(query)
    existing_enrollment = result.scalar_one_or_none()

    if existing_enrollment:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already enrolled in this training",
        )

    # Create enrollment with assignment tracking
    enrollment = Enrollment(
        user_id=user_id,
        training_id=training_id,
        session_id=session_id,
        is_assigned=True,
        assigned_by_id=manager_id,
        assigned_at=datetime.utcnow(),
        status=EnrollmentStatus.ENROLLED,
    )
    session.add(enrollment)

    # Create notification
    manager_name = "Manager"
    if manager_id:
        manager = await session.get(User, manager_id)
        if manager:
            manager_name = manager.full_name

    await notify_training_assigned(
        session=session,
        user_id=user_id,
        training_title=training.title,
        assigned_by_name=manager_name,
    )

    await session.commit()
    await session.refresh(enrollment)

    return {
        "id": str(enrollment.id),
        "user_id": str(enrollment.user_id),
        "training_id": str(enrollment.training_id),
        "status": enrollment.status.value,
        "is_assigned": enrollment.is_assigned,
        "assigned_at": enrollment.assigned_at.isoformat(),
        "message": "Training assigned successfully",
    }


@router.get("/team")
async def get_team_members(
    manager_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get list of team members reporting to manager (manager only - auth disabled for now)."""
    query = select(User).where(User.manager_id == manager_id)
    result = await session.execute(query)
    team_members = result.scalars().all()

    return {
        "items": [
            {
                "id": str(user.id),
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role.value,
                "department_id": (
                    str(user.department_id) if user.department_id else None
                ),
                "is_active": user.is_active,
            }
            for user in team_members
        ],
        "total": len(team_members),
    }


@router.get("/team-trainings")
async def get_team_training_progress(
    manager_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """View team training progress (manager only - auth disabled for now)."""
    # Get all team members
    team_query = select(User).where(User.manager_id == manager_id)
    team_result = await session.execute(team_query)
    team_members = team_result.scalars().all()

    if not team_members:
        return {"items": [], "total": 0}

    team_member_ids = [user.id for user in team_members]

    # Get all enrollments for team members
    enrollments_query = (
        select(Enrollment)
        .where(Enrollment.user_id.in_(team_member_ids))
        .offset(skip)
        .limit(limit)
    )
    enrollments_result = await session.execute(enrollments_query)
    enrollments = enrollments_result.scalars().all()

    # Build response with user and training details
    items = []
    for enrollment in enrollments:
        user = await session.get(User, enrollment.user_id)
        training = await session.get(Training, enrollment.training_id)

        items.append(
            {
                "enrollment_id": str(enrollment.id),
                "user_name": user.full_name if user else "Unknown",
                "user_email": user.email if user else "Unknown",
                "training_title": training.title if training else "Unknown",
                "training_category": training.category if training else "Unknown",
                "status": enrollment.status.value,
                "completion_percentage": enrollment.completion_percentage,
                "is_assigned": enrollment.is_assigned,
                "enrolled_at": enrollment.created_at.isoformat(),
            }
        )

    return {"items": items, "total": len(items)}


@router.delete("/assignments/{enrollment_id}")
async def remove_training_assignment(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Remove training assignment (manager only - auth disabled for now)."""
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    # Only allow removal if it's an assignment and not yet completed
    if not enrollment.is_assigned:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This enrollment is not an assignment",
        )

    if enrollment.status == EnrollmentStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove completed training",
        )

    await session.delete(enrollment)
    await session.commit()

    return {
        "message": "Training assignment removed successfully",
        "enrollment_id": str(enrollment_id),
    }
