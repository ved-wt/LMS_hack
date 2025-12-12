"""Certification model."""

from datetime import date
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class Certification(SQLModel, TimestampMixin, table=True):
    """Certification model for tracking user certifications."""

    __tablename__ = "certifications"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="users.id", index=True)
    name: str = Field(max_length=255)
    issuing_organization: str = Field(max_length=255)
    issue_date: date
    expiry_date: Optional[date] = Field(default=None)
    credential_id: Optional[str] = Field(default=None, max_length=255)
    credential_url: Optional[str] = Field(default=None, max_length=500)
