"""Training management routes."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.core.notifications import notify_training_approved, notify_training_rejected
from src.models.training import Training, TrainingStatus

router = APIRouter(prefix="/trainings", tags=["trainings"])


@router.post("")
async def create_training(
    title: str,
    description: str,
    category: str,
    duration_hours: float,
    max_participants: int,
    session: Annotated[AsyncSession, Depends(get_session)],
    created_by_id: UUID | None = None,
    is_mandatory: bool = False,
):
    "Create a new training."
    # created_by_id is None for now - will come from JWT later
    training = Training(
        title=title,
        description=description,
        category=category,
        duration_hours=duration_hours,
        max_participants=max_participants,
        is_mandatory=is_mandatory,
        created_by_id=created_by_id,
        status=TrainingStatus.DRAFT,
    )
    session.add(training)
    await session.commit()
    await session.refresh(training)

    return {
        "id": str(training.id),
        "title": training.title,
        "description": training.description,
        "category": training.category,
        "duration_hours": training.duration_hours,
        "max_participants": training.max_participants,
        "is_mandatory": training.is_mandatory,
        "status": training.status.value,
        "created_by_id": (
            str(training.created_by_id) if training.created_by_id else None
        ),
    }


@router.get("/{training_id}")
async def get_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get training by ID."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    return {
        "id": str(training.id),
        "title": training.title,
        "description": training.description,
        "category": training.category,
        "duration_hours": training.duration_hours,
        "max_participants": training.max_participants,
        "is_mandatory": training.is_mandatory,
        "status": training.status.value,
        "prerequisites": training.prerequisites,
        "learning_objectives": training.learning_objectives,
        "created_by_id": str(training.created_by_id),
    }


@router.get("")
async def list_trainings(
    session: Annotated[AsyncSession, Depends(get_session)],
    category: str | None = None,
    skip: int = 0,
    limit: int = 100,
):
    """List all trainings with optional category filter."""
    query = select(Training)

    if category:
        query = query.where(Training.category == category)

    result = await session.execute(query.offset(skip).limit(limit))
    trainings = result.scalars().all()

    return {
        "items": [
            {
                "id": str(t.id),
                "title": t.title,
                "category": t.category,
                "duration_hours": t.duration_hours,
                "is_mandatory": t.is_mandatory,
                "status": t.status.value,
            }
            for t in trainings
        ],
        "total": len(trainings),
    }


@router.put("/{training_id}")
async def update_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    title: str | None = None,
    description: str | None = None,
    category: str | None = None,
    duration_hours: float | None = None,
):
    """Update a training."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if title is not None:
        training.title = title
    if description is not None:
        training.description = description
    if category is not None:
        training.category = category
    if duration_hours is not None:
        training.duration_hours = duration_hours

    await session.commit()
    await session.refresh(training)

    return {
        "id": str(training.id),
        "title": training.title,
        "description": training.description,
        "category": training.category,
        "duration_hours": training.duration_hours,
        "status": training.status.value,
    }


# Approval workflow endpoints
@router.put("/{training_id}/submit")
async def submit_training_for_approval(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Submit training for approval."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if training.status != TrainingStatus.DRAFT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only DRAFT trainings can be submitted for approval",
        )

    training.status = TrainingStatus.PENDING_APPROVAL
    await session.commit()
    await session.refresh(training)

    return {
        "id": str(training.id),
        "title": training.title,
        "status": training.status.value,
        "message": "Training submitted for approval",
    }


@router.put("/{training_id}/approve")
async def approve_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    approved_by_id: UUID | None = None,
):
    """Approve training (admin/super_admin only - auth disabled for now)."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if training.status != TrainingStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING_APPROVAL trainings can be approved",
        )

    training.status = TrainingStatus.APPROVED
    training.approved_by_id = approved_by_id
    training.approved_at = datetime.utcnow()
    training.rejection_reason = None

    # Notify creator about approval
    if training.created_by_id:
        await notify_training_approved(
            session=session,
            user_id=training.created_by_id,
            training_title=training.title,
        )

    await session.commit()
    await session.refresh(training)

    return {
        "id": str(training.id),
        "title": training.title,
        "status": training.status.value,
        "approved_at": training.approved_at.isoformat(),
        "message": "Training approved successfully",
    }


@router.put("/{training_id}/reject")
async def reject_training(
    training_id: UUID,
    rejection_reason: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    rejected_by_id: UUID | None = None,
):
    """Reject training with reason (admin/super_admin only - auth disabled for now)."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if training.status != TrainingStatus.PENDING_APPROVAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PENDING_APPROVAL trainings can be rejected",
        )

    training.status = TrainingStatus.REJECTED
    training.rejection_reason = rejection_reason
    training.approved_by_id = None
    training.approved_at = None

    # Notify creator about rejection
    if training.created_by_id:
        await notify_training_rejected(
            session=session,
            user_id=training.created_by_id,
            training_title=training.title,
            reason=rejection_reason,
        )

    await session.commit()
    await session.refresh(training)

    return {
        "id": str(training.id),
        "title": training.title,
        "status": training.status.value,
        "rejection_reason": training.rejection_reason,
        "message": "Training rejected",
    }


@router.get("/pending")
async def list_pending_trainings(
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """List trainings pending approval (admin only - auth disabled for now)."""
    query = select(Training).where(Training.status == TrainingStatus.PENDING_APPROVAL)
    result = await session.execute(query.offset(skip).limit(limit))
    trainings = result.scalars().all()

    return {
        "items": [
            {
                "id": str(t.id),
                "title": t.title,
                "category": t.category,
                "duration_hours": t.duration_hours,
                "status": t.status.value,
                "created_at": t.created_at.isoformat(),
            }
            for t in trainings
        ],
        "total": len(trainings),
    }
