"""TrainingCompletion model."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class TrainingCompletion(SQLModel, TimestampMixin, table=True):
    """TrainingCompletion model for tracking training completion."""

    __tablename__ = "training_completions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    training_id: UUID = Field(foreign_key="trainings.id", index=True)
    enrollment_id: UUID = Field(foreign_key="enrollments.id", unique=True, index=True)

    # Completion details
    completed_at: datetime
    learning_hours: float = Field(ge=0)
    attendance_percentage: float = Field(ge=0, le=100)

    # Assessment
    assessment_score: Optional[float] = Field(default=None, ge=0, le=100)
    passed: bool = Field(default=True)

    # Certificate
    certificate_issued: bool = Field(default=False)
    certificate_url: Optional[str] = Field(default=None, max_length=500)
