"""Attendance routes."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.attendance import Attendance, AttendanceStatus
from src.models.enrollment import Enrollment
from src.models.training import TrainingSession

router = APIRouter(prefix="/attendance", tags=["attendance"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def mark_attendance(
    user_id: UUID,
    session_id: UUID,
    enrollment_id: UUID,
    attendance_date: date,
    status_value: AttendanceStatus,
    session: Annotated[AsyncSession, Depends(get_session)],
    hours_attended: float = 0.0,
    notes: str | None = None,
):
    """Mark attendance for a training session."""
    # Verify session exists
    result = await session.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    )
    training_session = result.scalar_one_or_none()
    if not training_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )

    # Verify enrollment exists
    result = await session.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )  # Check if attendance already exists
    result = await session.execute(
        select(Attendance).where(
            Attendance.session_id == session_id,
            Attendance.enrollment_id == enrollment_id,
            Attendance.attendance_date == attendance_date,
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Attendance already marked for this session",
        )

    attendance = Attendance(
        user_id=user_id,
        session_id=session_id,
        enrollment_id=enrollment_id,
        attendance_date=attendance_date,
        status=status_value,
        hours_attended=hours_attended,
        notes=notes,
    )
    session.add(attendance)
    await session.commit()
    await session.refresh(attendance)

    return {
        "id": str(attendance.id),
        "user_id": str(attendance.user_id),
        "session_id": str(attendance.session_id),
        "enrollment_id": str(attendance.enrollment_id),
        "attendance_date": attendance.attendance_date.isoformat(),
        "status": attendance.status.value,
        "hours_attended": attendance.hours_attended,
        "notes": attendance.notes,
        "created_at": attendance.created_at.isoformat(),
    }


@router.get("/session/{session_id}")
async def get_session_attendance(
    session_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """Get attendance records for a specific session."""
    # Verify session exists
    result = await session.execute(
        select(TrainingSession).where(TrainingSession.id == session_id)
    )
    if not result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Training session not found",
        )

    result = await session.execute(
        select(Attendance)
        .where(Attendance.session_id == session_id)
        .offset(skip)
        .limit(limit)
    )
    attendance_records = result.scalars().all()

    return [
        {
            "id": str(att.id),
            "user_id": str(att.user_id),
            "session_id": str(att.session_id),
            "enrollment_id": str(att.enrollment_id),
            "attendance_date": att.attendance_date.isoformat(),
            "status": att.status.value,
            "hours_attended": att.hours_attended,
            "notes": att.notes,
            "created_at": att.created_at.isoformat(),
        }
        for att in attendance_records
    ]


@router.get("/enrollment/{enrollment_id}")
async def get_enrollment_attendance(
    enrollment_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """Get attendance history for an enrollment."""
    # Verify enrollment exists
    result = await session.execute(
        select(Enrollment).where(Enrollment.id == enrollment_id)
    )
    enrollment = result.scalar_one_or_none()
    if not enrollment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Enrollment not found",
        )

    result = await session.execute(
        select(Attendance)
        .where(Attendance.enrollment_id == enrollment_id)
        .offset(skip)
        .limit(limit)
    )
    attendance_records = result.scalars().all()

    return [
        {
            "id": str(att.id),
            "session_id": str(att.session_id),
            "attendance_date": att.attendance_date.isoformat(),
            "status": att.status.value,
            "hours_attended": att.hours_attended,
            "notes": att.notes,
            "created_at": att.created_at.isoformat(),
        }
        for att in attendance_records
    ]


@router.put("/{attendance_id}")
async def update_attendance(
    attendance_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    status_value: AttendanceStatus | None = None,
    hours_attended: float | None = None,
    notes: str | None = None,
):
    """Update attendance record."""
    result = await session.execute(
        select(Attendance).where(Attendance.id == attendance_id)
    )
    attendance = result.scalar_one_or_none()

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    if status_value is not None:
        attendance.status = status_value
    if hours_attended is not None:
        attendance.hours_attended = hours_attended
    if notes is not None:
        attendance.notes = notes

    await session.commit()
    await session.refresh(attendance)

    return {
        "id": str(attendance.id),
        "session_id": str(attendance.session_id),
        "enrollment_id": str(attendance.enrollment_id),
        "attendance_date": attendance.attendance_date.isoformat(),
        "status": attendance.status.value,
        "hours_attended": attendance.hours_attended,
        "notes": attendance.notes,
        "updated_at": attendance.updated_at.isoformat(),
    }
