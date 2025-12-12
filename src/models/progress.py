"""Lesson progress model."""

from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class LessonProgress(SQLModel, TimestampMixin, table=True):
    """Model to track user progress on individual lessons."""
    __tablename__ = "lesson_progress"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    lesson_id: UUID = Field(foreign_key="lessons.id", index=True)
    completed_at: Optional[datetime] = Field(default=None)
    is_completed: bool = Field(default=False)
    quiz_score: float = Field(default=0.0)
