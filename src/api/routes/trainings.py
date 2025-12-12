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
from src.api.deps.auth import get_current_user
from src.models.user import User, UserRole

router = APIRouter(prefix="/trainings", tags=["trainings"])


from pydantic import BaseModel

class TrainingCreate(BaseModel):
    title: str
    description: str
    category: str
    duration_hours: float
    max_participants: int
    is_mandatory: bool = False

class TrainingUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    duration_hours: float | None = None
    max_participants: int | None = None
    is_mandatory: bool | None = None

@router.post("")
async def create_training(
    training_in: TrainingCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    "Create a new training."
    status = TrainingStatus.DRAFT
    approved_by_id = None
    approved_at = None

    if current_user.role == UserRole.SUPER_ADMIN:
        status = TrainingStatus.APPROVED
        approved_by_id = current_user.id
        approved_at = datetime.utcnow()

    training = Training(
        title=training_in.title,
        description=training_in.description,
        category=training_in.category,
        duration_hours=training_in.duration_hours,
        max_participants=training_in.max_participants,
        is_mandatory=training_in.is_mandatory,
        created_by_id=current_user.id,
        status=status,
        approved_by_id=approved_by_id,
        approved_at=approved_at,
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
    """Get training by ID with modules and lessons."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # Fetch modules
    from src.models.content import Module, Lesson
    modules_query = select(Module).where(Module.training_id == training_id).order_by(Module.order)
    result = await session.execute(modules_query)
    modules = result.scalars().all()

    modules_data = []
    for module in modules:
        # Fetch lessons for each module
        lessons_query = select(Lesson).where(Lesson.module_id == module.id).order_by(Lesson.order)
        l_result = await session.execute(lessons_query)
        lessons = l_result.scalars().all()
        
        modules_data.append({
            "id": str(module.id),
            "title": module.title,
            "order": module.order,
            "lessons": [
                {
                    "id": str(l.id),
                    "title": l.title,
                    "type": l.type.value,
                    "duration_minutes": l.duration_minutes,
                    "content_url": l.content_url,
                    "content_text": l.content_text,
                    "questions": l.questions,
                    "order": l.order
                } for l in lessons
            ]
        })

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
        "created_by_id": str(training.created_by_id) if training.created_by_id else None,
        "image": training.materials_url, # Using materials_url as image for now
        "modules": modules_data
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
    training_update: TrainingUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a training."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    if training_update.title is not None:
        training.title = training_update.title
    if training_update.description is not None:
        training.description = training_update.description
    if training_update.category is not None:
        training.category = training_update.category
    if training_update.duration_hours is not None:
        training.duration_hours = training_update.duration_hours
    if training_update.max_participants is not None:
        training.max_participants = training_update.max_participants
    if training_update.is_mandatory is not None:
        training.is_mandatory = training_update.is_mandatory

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
    }


@router.delete("/{training_id}")
async def delete_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a training."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # TODO: Check if there are active enrollments and prevent delete or cascade?
    # For now, just delete.
    await session.delete(training)
    await session.commit()

    return {"message": "Training deleted successfully", "id": str(training_id)}


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
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Approve training (admin/super_admin only)."""
    # TODO: Check role
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
    training.approved_by_id = current_user.id
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
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Reject training with reason (admin/super_admin only)."""
    # TODO: Check role
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
