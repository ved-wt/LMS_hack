"""FastAPI application factory and configuration."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.core.db import close_db, init_db
from src.core.errors import register_error_handlers
from src.core.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.

    Handles:
    - Database initialization on startup
    - Background scheduler startup
    - Connection cleanup on shutdown
    - Scheduler shutdown

    Args:
        app: FastAPI application instance

    Yields:
        Control during application runtime
    """
    # Startup
    init_db()
    
    # Create tables (hack for dev)
    from src.core.db import _engine
    from sqlmodel import SQLModel
    # Import all models to ensure they are registered
    import src.models  # noqa
    
    async with _engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
        
    print("✓ Database initialized")

    start_scheduler()
    print("✓ Background scheduler started")

    yield

    # Shutdown
    stop_scheduler()
    print("✓ Background scheduler stopped")

    await close_db()
    print("✓ Database connections closed")


def create_app() -> FastAPI:
    """
    FastAPI application factory.

    Creates and configures FastAPI instance with:
    - Settings from environment
    - Lifespan context manager
    - CORS middleware
    - Error handlers
    - API routers

    Returns:
        Configured FastAPI application
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        debug=settings.DEBUG,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Register error handlers
    register_error_handlers(app)

    # Include API routers
    include_routers(app)

    return app


def include_routers(app: FastAPI) -> None:
    """
    Mount all API routers under /api prefix.

    Args:
        app: FastAPI application instance
    """

    # Health check endpoint (inline for now)
    @app.get("/api/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": get_settings().APP_VERSION,
        }

    # Domain routers
    from src.api.routes import (
        auth,
        users,
        profiles,
        trainings,
        enrollments,
        notifications,
        departments,
        certifications,
        sessions,
        attendance,
        manager,
        completions,
        badges,
        reports,
    )

    app.include_router(auth.router, prefix="/api")
    app.include_router(users.router, prefix="/api")
    app.include_router(profiles.router, prefix="/api")
    app.include_router(trainings.router, prefix="/api")
    app.include_router(enrollments.router, prefix="/api")
    app.include_router(notifications.router, prefix="/api")
    app.include_router(departments.router, prefix="/api")
    app.include_router(certifications.router, prefix="/api")
    app.include_router(sessions.router, prefix="/api")
    app.include_router(attendance.router, prefix="/api")
    app.include_router(manager.router, prefix="/api")
    app.include_router(completions.router, prefix="/api")
    app.include_router(badges.router, prefix="/api")
    app.include_router(reports.router, prefix="/api")
    
    from src.api.routes import content, progress
    app.include_router(content.router, prefix="/api")
    app.include_router(progress.router, prefix="/api")


# Create app instance
app = create_app()
