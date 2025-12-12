"""Training completion management routes."""

from datetime import datetime
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.attendance import Attendance, AttendanceStatus
from src.models.completion import TrainingCompletion
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.training import Training, TrainingSession

router = APIRouter(prefix="/completions", tags=["completions"])


@router.post("/calculate/{enrollment_id}")
async def calculate_and_create_completion(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    assessment_score: float | None = None,
    passed: bool = True,
):
    """
    Calculate completion metrics and create TrainingCompletion record.

    Calculates:
    - attendance_percentage based on attendance records
    - learning_hours from session durations attended
    - Updates enrollment status to COMPLETED
    """
    # Get enrollment
    enrollment = await session.get(Enrollment, enrollment_id)
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    # Check if already completed
    existing_completion_query = select(TrainingCompletion).where(
        TrainingCompletion.enrollment_id == enrollment_id
    )
    result = await session.execute(existing_completion_query)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Completion record already exists for this enrollment",
        )

    # Get training
    training = await session.get(Training, enrollment.training_id)
    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # Get all sessions for the training
    sessions_query = select(TrainingSession).where(
        TrainingSession.training_id == enrollment.training_id
    )
    sessions_result = await session.execute(sessions_query)
    all_sessions = sessions_result.scalars().all()

    if not all_sessions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No sessions found for this training",
        )

    total_sessions = len(all_sessions)

    # Get attendance records for this enrollment
    attendance_query = select(Attendance).where(
        Attendance.enrollment_id == enrollment_id
    )
    attendance_result = await session.execute(attendance_query)
    attendance_records = attendance_result.scalars().all()

    # Calculate attendance percentage
    attended_sessions = sum(
        1 for a in attendance_records if a.status == AttendanceStatus.PRESENT
    )
    attendance_percentage = (
        (attended_sessions / total_sessions * 100) if total_sessions > 0 else 0
    )

    # Calculate learning hours from hours_attended
    learning_hours = sum(a.hours_attended for a in attendance_records)

    # Create completion record
    completion = TrainingCompletion(
        user_id=enrollment.user_id,
        training_id=enrollment.training_id,
        enrollment_id=enrollment_id,
        completed_at=datetime.utcnow(),
        learning_hours=learning_hours,
        attendance_percentage=attendance_percentage,
        assessment_score=assessment_score,
        passed=passed,
        certificate_issued=False,
    )
    session.add(completion)

    # Update enrollment status
    enrollment.status = EnrollmentStatus.COMPLETED
    enrollment.completed_at = datetime.utcnow()
    enrollment.completion_percentage = 100.0

    await session.commit()
    await session.refresh(completion)

    return {
        "id": str(completion.id),
        "enrollment_id": str(completion.enrollment_id),
        "user_id": str(completion.user_id),
        "training_id": str(completion.training_id),
        "completed_at": completion.completed_at.isoformat(),
        "learning_hours": completion.learning_hours,
        "attendance_percentage": completion.attendance_percentage,
        "assessment_score": completion.assessment_score,
        "passed": completion.passed,
        "message": "Training completion recorded successfully",
    }


@router.get("/user/{user_id}")
async def get_user_completions(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """Get all training completions for a user."""
    query = (
        select(TrainingCompletion)
        .where(TrainingCompletion.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    result = await session.execute(query)
    completions = result.scalars().all()

    items = []
    for completion in completions:
        training = await session.get(Training, completion.training_id)
        items.append(
            {
                "id": str(completion.id),
                "training_title": training.title if training else "Unknown",
                "training_category": training.category if training else "Unknown",
                "completed_at": completion.completed_at.isoformat(),
                "learning_hours": completion.learning_hours,
                "attendance_percentage": completion.attendance_percentage,
                "assessment_score": completion.assessment_score,
                "passed": completion.passed,
                "certificate_issued": completion.certificate_issued,
            }
        )

    return {"items": items, "total": len(items)}


@router.get("/{completion_id}")
async def get_completion_details(
    completion_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get detailed completion record."""
    completion = await session.get(TrainingCompletion, completion_id)
    if not completion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Completion record not found",
        )

    training = await session.get(Training, completion.training_id)
    enrollment = await session.get(Enrollment, completion.enrollment_id)

    return {
        "id": str(completion.id),
        "user_id": str(completion.user_id),
        "training_id": str(completion.training_id),
        "training_title": training.title if training else "Unknown",
        "enrollment_id": str(completion.enrollment_id),
        "completed_at": completion.completed_at.isoformat(),
        "learning_hours": completion.learning_hours,
        "attendance_percentage": completion.attendance_percentage,
        "assessment_score": completion.assessment_score,
        "passed": completion.passed,
        "certificate_issued": completion.certificate_issued,
        "certificate_url": completion.certificate_url,
        "enrollment_status": enrollment.status.value if enrollment else None,
    }


@router.put("/{completion_id}/issue-certificate")
async def issue_certificate(
    completion_id: UUID,
    certificate_url: str,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Issue certificate for completed training."""
    completion = await session.get(TrainingCompletion, completion_id)
    if not completion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Completion record not found",
        )

    if not completion.passed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot issue certificate for failed training",
        )

    completion.certificate_issued = True
    completion.certificate_url = certificate_url

    await session.commit()
    await session.refresh(completion)

    return {
        "id": str(completion.id),
        "certificate_issued": completion.certificate_issued,
        "certificate_url": completion.certificate_url,
        "message": "Certificate issued successfully",
    }
