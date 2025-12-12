"""User model and related enums."""

import enum
from typing import Optional
from uuid import UUID, uuid4

from sqlmodel import Field, SQLModel

from src.core.db import TimestampMixin


class UserRole(str, enum.Enum):
    """User role enumeration."""

    EMPLOYEE = "EMPLOYEE"
    ADMIN = "ADMIN"
    SUPER_ADMIN = "SUPER_ADMIN"
    MANAGER = "MANAGER"


class User(SQLModel, TimestampMixin, table=True):
    """User model representing system users."""

    __tablename__ = "users"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    email: str = Field(unique=True, index=True, max_length=255)
    hashed_password: str = Field(max_length=255)
    full_name: str = Field(max_length=255)
    role: UserRole = Field(default=UserRole.EMPLOYEE)
    is_active: bool = Field(default=True)
    department_id: Optional[UUID] = Field(
        default=None, foreign_key="departments.id", index=True
    )
    manager_id: Optional[UUID] = Field(default=None, foreign_key="users.id", index=True)
