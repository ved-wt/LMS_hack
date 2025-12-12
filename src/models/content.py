"""Module and Lesson models for course content."""

import enum
from typing import Optional, List
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel, Relationship

from src.core.db import TimestampMixin


class LessonType(str, enum.Enum):
    """Lesson type enumeration."""
    VIDEO = "VIDEO"
    QUIZ = "QUIZ"
    TEXT = "TEXT"


class Module(SQLModel, TimestampMixin, table=True):
    """Module model representing a section of a training."""
    __tablename__ = "modules"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    training_id: UUID = Field(foreign_key="trainings.id", index=True)
    title: str = Field(max_length=255)
    order: int = Field(default=0)

    # Relationship to lessons (will be populated by join)
    # lessons: List["Lesson"] = Relationship(back_populates="module")


class Lesson(SQLModel, TimestampMixin, table=True):
    """Lesson model representing a unit of content."""
    __tablename__ = "lessons"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    module_id: UUID = Field(foreign_key="modules.id", index=True)
    title: str = Field(max_length=255)
    type: LessonType = Field(default=LessonType.VIDEO)
    content_url: Optional[str] = Field(default=None, max_length=500)
    content_text: Optional[str] = Field(default=None) # For text content or video description
    duration_minutes: int = Field(default=0)
    order: int = Field(default=0)
    
    # Store questions as JSON for simplicity in this hackathon context
    questions: List[dict] = Field(default_factory=list, sa_column=Column(JSON))

    # module: Module = Relationship(back_populates="lessons")
