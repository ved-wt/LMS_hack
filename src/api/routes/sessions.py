"""Training session routes."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.training import Training, TrainingSession

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_session(
    training_id: UUID,
    session_date: date,
    start_time: str,
    end_time: str,
    location: str,
    instructor_name: str,
    max_participants: int,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new training session."""
    # Verify training exists
    result = await session.execute(select(Training).where(Training.id == training_id))
    training = result.scalar_one_or_none()

    if not training:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    # Validate time format (basic check)
    if len(start_time) != 5 or len(end_time) != 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Time must be in HH:MM format",
        )

    training_session = TrainingSession(
        training_id=training_id,
        session_date=session_date,
        start_time=start_time,
        end_time=end_time,
        location=location,
        instructor_name=instructor_name,
        max_participants=max_participants,
        current_participants=0,
    )
    session.add(training_session)
    await session.commit()
    await session.refresh(training_session)

    return {
        "id": str(training_session.id),
        "training_id": str(training_session.training_id),
        "session_date": training_session.session_date.isoformat(),
        "start_time": training_session.start_time,
        "end_time": training_session.end_time,
        "location": training_session.location,
        "instructor_name": training_session.instructor_name,
        "max_participants": training_session.max_participants,
        "current_participants": training_session.current_participants,
        "created_at": training_session.created_at.isoformat(),
    }


@router.get("/training/{training_id}")
async def list_sessions_for_training(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """List all sessions for a specific training."""
    # Verify training exists
    result = await session.execute(select(Training).where(Training.id == training_id))
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training not found",
        )

    result = await session.execute(
        select(TrainingSession)
        .where(TrainingSession.training_id == training_id)
        .offset(skip)
        .limit(limit)
    )
    sessions = result.scalars().all()

    return [
        {
            "id": str(sess.id),
            "training_id": str(sess.training_id),
            "session_date": sess.session_date.isoformat(),
            "start_time": sess.start_time,
            "end_time": sess.end_time,
            "location": sess.location,
            "instructor_name": sess.instructor_name,
            "max_participants": sess.max_participants,
            "current_participants": sess.current_participants,
            "created_at": sess.created_at.isoformat(),
        }
        for sess in sessions
    ]


@router.get("/{session_id}")
async def get_session(
    session_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get training session details by ID."""
    result = await session.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    )
    training_session = result.scalar_one_or_none()

    if not training_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )

    return {
        "id": str(training_session.id),
        "training_id": str(training_session.training_id),
        "session_date": training_session.session_date.isoformat(),
        "start_time": training_session.start_time,
        "end_time": training_session.end_time,
        "location": training_session.location,
        "instructor_name": training_session.instructor_name,
        "max_participants": training_session.max_participants,
        "current_participants": training_session.current_participants,
        "created_at": training_session.created_at.isoformat(),
        "updated_at": training_session.updated_at.isoformat(),
    }


@router.put("/{session_id}")
async def update_session(
    session_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    session_date: date | None = None,
    start_time: str | None = None,
    end_time: str | None = None,
    location: str | None = None,
    instructor_name: str | None = None,
    max_participants: int | None = None,
):
    """Update training session details."""
    result = await session.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    )
    training_session = result.scalar_one_or_none()

    if not training_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )

    if session_date is not None:
        training_session.session_date = session_date
    if start_time is not None:
        if len(start_time) != 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time must be in HH:MM format",
            )
        training_session.start_time = start_time
    if end_time is not None:
        if len(end_time) != 5:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Time must be in HH:MM format",
            )
        training_session.end_time = end_time
    if location is not None:
        training_session.location = location
    if instructor_name is not None:
        training_session.instructor_name = instructor_name
    if max_participants is not None:
        training_session.max_participants = max_participants

    await session.commit()
    await session.refresh(training_session)

    return {
        "id": str(training_session.id),
        "training_id": str(training_session.training_id),
        "session_date": training_session.session_date.isoformat(),
        "start_time": training_session.start_time,
        "end_time": training_session.end_time,
        "location": training_session.location,
        "instructor_name": training_session.instructor_name,
        "max_participants": training_session.max_participants,
        "current_participants": training_session.current_participants,
        "updated_at": training_session.updated_at.isoformat(),
    }


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a training session."""
    result = await session.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    )
    training_session = result.scalar_one_or_none()

    if not training_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )

    await session.delete(training_session)
    await session.commit()
