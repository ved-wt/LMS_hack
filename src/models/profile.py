"""Profile model."""

from typing import Optional
from uuid import UUID, uuid4

from sqlalchemy import JSON, Column
from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class Profile(SQLModel, TimestampMixin, table=True):
    """User profile with extended information."""

    __tablename__ = "profiles"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", unique=True, index=True)
    phone: Optional[str] = Field(default=None, max_length=20)
    location: Optional[str] = Field(default=None, max_length=255)
    bio: Optional[str] = Field(default=None, max_length=2000)
    tech_stack: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    skills: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    total_learning_hours: float = Field(default=0.0)
    streak_count: int = Field(default=0)
    last_active_date: Optional[str] = Field(default=None) # ISO format date string YYYY-MM-DD
