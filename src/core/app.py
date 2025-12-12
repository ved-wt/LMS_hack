"""FastAPI application factory and configuration."""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.core.config import get_settings
from src.core.db import close_db, init_db
from src.core.errors import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager for startup and shutdown events.

    Handles:
    - Database initialization on startup
    - Connection cleanup on shutdown

    Args:
        app: FastAPI application instance

    Yields:
        Control during application runtime
    """
    # Startup
    init_db()
    print("✓ Database initialized")

    yield

    # Shutdown
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
    # TODO: Add routers as they are implemented
    # from src.api.routes import health, auth, users, trainings, ...

    # Health check endpoint (inline for now)
    @app.get("/api/health", tags=["health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "version": get_settings().APP_VERSION,
        }

    # Router imports and inclusion will be added here:
    # app.include_router(health.router, prefix="/api", tags=["health"])
    # app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
    # app.include_router(users.router, prefix="/api/users", tags=["users"])
    # etc.
