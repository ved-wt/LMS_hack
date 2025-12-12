"""Database configuration and session management."""

from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import DateTime, func
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.orm import Mapped, mapped_column, sessionmaker
from sqlmodel import SQLModel

from src.core.config import get_settings


class TimestampMixin:
    """Mixin for automatic created_at and updated_at timestamps."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


def get_engine(database_url: str, echo: bool = False) -> AsyncEngine:
    """
    Create async SQLAlchemy engine.

    Args:
        database_url: PostgreSQL connection string (asyncpg driver)
        echo: Enable SQL query logging

    Returns:
        Configured AsyncEngine instance
    """
    return create_async_engine(
        database_url,
        echo=echo,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


def get_sessionmaker(engine: AsyncEngine) -> sessionmaker:
    """
    Create async session factory.

    Args:
        engine: AsyncEngine instance

    Returns:
        Configured sessionmaker for AsyncSession
    """
    return sessionmaker(
        bind=engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )


# Global engine and sessionmaker (initialized in app lifespan)
_engine: AsyncEngine | None = None
_sessionmaker: sessionmaker | None = None


def init_db() -> None:
    """Initialize global database engine and sessionmaker from settings."""
    global _engine, _sessionmaker
    settings = get_settings()
    _engine = get_engine(settings.DATABASE_URL, settings.DATABASE_ECHO)
    _sessionmaker = get_sessionmaker(_engine)


async def close_db() -> None:
    """Close database engine and cleanup connections."""
    global _engine
    if _engine:
        await _engine.dispose()


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency: provide async database session.

    Yields:
        AsyncSession instance

    Example:
        @app.get("/users")
        async def list_users(session: AsyncSession = Depends(get_session)):
            ...
    """
    if not _sessionmaker:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    async with _sessionmaker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def get_db_metadata():
    """
    Export SQLModel metadata for Alembic migrations.

    Returns:
        SQLModel metadata object
    """
    return SQLModel.metadata
