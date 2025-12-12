"""Enrollment model."""

import enum
from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class EnrollmentStatus(str, enum.Enum):
    """Enrollment status enumeration."""

    ENROLLED = "ENROLLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    DROPPED = "DROPPED"
    FAILED = "FAILED"


class Enrollment(SQLModel, TimestampMixin, table=True):
    """Enrollment model tracking user training enrollments."""

    __tablename__ = "enrollments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    training_id: UUID = Field(foreign_key="trainings.id", index=True)
    session_id: Optional[UUID] = Field(
        default=None, foreign_key="training_sessions.id", index=True
    )
    status: EnrollmentStatus = Field(default=EnrollmentStatus.ENROLLED, index=True)

    # Assignment tracking
    is_assigned: bool = Field(default=False)
    assigned_by_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    assigned_at: Optional[datetime] = Field(default=None)

    # Completion tracking
    completed_at: Optional[datetime] = Field(default=None)
    completion_percentage: float = Field(default=0.0, ge=0, le=100)
