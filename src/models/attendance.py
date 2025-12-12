"""Attendance model."""

import enum
from datetime import date
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class AttendanceStatus(str, enum.Enum):
    """Attendance status enumeration."""

    PRESENT = "PRESENT"
    ABSENT = "ABSENT"
    PARTIAL = "PARTIAL"


class Attendance(SQLModel, TimestampMixin, table=True):
    """Attendance model tracking session attendance."""

    __tablename__ = "attendance"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    session_id: UUID = Field(foreign_key="training_sessions.id", index=True)
    enrollment_id: UUID = Field(foreign_key="enrollments.id", index=True)
    attendance_date: date = Field(index=True)
    status: AttendanceStatus = Field(default=AttendanceStatus.PRESENT)
    hours_attended: float = Field(default=0.0, ge=0)
    notes: Optional[str] = Field(default=None, max_length=1000)
