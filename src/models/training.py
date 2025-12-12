"""Training and TrainingSession models."""

import enum
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class TrainingStatus(str, enum.Enum):
    """Training status enumeration."""

    DRAFT = "DRAFT"
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SCHEDULED = "SCHEDULED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class Training(SQLModel, TimestampMixin, table=True):
    """Training model representing training programs."""

    __tablename__ = "trainings"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str = Field(max_length=255, index=True)
    description: str = Field(max_length=2000)
    category: str = Field(max_length=100, index=True)
    duration_hours: float = Field(gt=0)
    max_participants: int = Field(gt=0)
    is_mandatory: bool = Field(default=False)
    status: TrainingStatus = Field(default=TrainingStatus.DRAFT, index=True)

    # Approval workflow fields
    requires_approval: bool = Field(default=True)
    approved_by_id: Optional[UUID] = Field(default=None, foreign_key="users.id")
    approved_at: Optional[datetime] = Field(default=None)
    rejection_reason: Optional[str] = Field(default=None, max_length=1000)

    # Content fields
    prerequisites: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    learning_objectives: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    materials_url: Optional[str] = Field(default=None, max_length=500)

    # Creator (nullable for now - will be required when JWT auth is enabled)
    created_by_id: Optional[UUID] = Field(
        default=None, foreign_key="users.id", index=True
    )


class TrainingSession(SQLModel, TimestampMixin, table=True):
    """TrainingSession model for scheduled training sessions."""

    __tablename__ = "training_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    training_id: UUID = Field(foreign_key="trainings.id", index=True)
    session_date: date = Field(index=True)
    start_time: str = Field(max_length=5)  # HH:MM format
    end_time: str = Field(max_length=5)  # HH:MM format
    location: str = Field(max_length=255)
    instructor_name: str = Field(max_length=255)
    max_participants: int = Field(gt=0)
    current_participants: int = Field(default=0, ge=0)
