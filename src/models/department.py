"""Department model."""

from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class Department(SQLModel, TimestampMixin, table=True):
    """Department model representing organizational units."""

    __tablename__ = "departments"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str = Field(unique=True, max_length=255, index=True)
    description: str | None = Field(default=None, max_length=1000)
