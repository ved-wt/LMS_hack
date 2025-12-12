"""Notification model."""

import enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class NotificationType(str, enum.Enum):
    """Notification type enumeration."""

    TRAINING_ASSIGNED = "TRAINING_ASSIGNED"
    TRAINING_APPROVED = "TRAINING_APPROVED"
    TRAINING_REJECTED = "TRAINING_REJECTED"
    SESSION_SCHEDULED = "SESSION_SCHEDULED"
    SESSION_REMINDER = "SESSION_REMINDER"
    TRAINING_COMPLETED = "TRAINING_COMPLETED"
    BADGE_EARNED = "BADGE_EARNED"
    DEADLINE_APPROACHING = "DEADLINE_APPROACHING"


class Notification(SQLModel, TimestampMixin, table=True):
    """Notification model for user notifications."""

    __tablename__ = "notifications"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    notification_type: NotificationType = Field(index=True)
    title: str = Field(max_length=255)
    message: str = Field(max_length=1000)
    is_read: bool = Field(default=False, index=True)
    action_url: Optional[str] = Field(default=None, max_length=500)
