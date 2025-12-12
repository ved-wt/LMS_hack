"""Badge model."""

import enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class BadgeType(str, enum.Enum):
    """Badge type enumeration."""

    BRONZE = "BRONZE"
    SILVER = "SILVER"
    GOLD = "GOLD"
    PLATINUM = "PLATINUM"


class Badge(SQLModel, TimestampMixin, table=True):
    """Badge model for gamification rewards."""

    __tablename__ = "badges"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    badge_type: BadgeType = Field(index=True)
    year_earned: int = Field(index=True)
    hours_completed: float = Field(ge=0)
    trainings_completed: int = Field(ge=0)
    awarded_at: Optional[str] = Field(
        default=None, max_length=500
    )  # ISO 8601 datetime string
