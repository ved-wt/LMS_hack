"""Custom application errors and exception handlers."""

from typing import Any

from fastapi import HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class AppError(Exception):
    """
    Base application error with structured error code and message.

    Attributes:
        code: Error code for client identification
        message: Human-readable error message
        status_code: HTTP status code
        details: Optional additional error context
    """

    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: dict[str, Any] | None = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """
    Convert AppError to structured JSON error response.

    Args:
        request: FastAPI request object
        exc: AppError instance

    Returns:
        JSONResponse with error_response schema
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": exc.code,
            "message": exc.message,
            "details": exc.details,
        },
    )


async def validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """
    Handle Pydantic validation errors (422) with structured format.

    Args:
        request: FastAPI request object
        exc: RequestValidationError from Pydantic

    Returns:
        JSONResponse with validation error details
    """
    errors: dict[str, list[str]] = {}

    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"] if loc != "body")
        message = error["msg"]

        if field not in errors:
            errors[field] = []
        errors[field].append(message)

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Request validation failed",
            "details": errors,
        },
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """
    Handle FastAPI HTTPException with structured format.

    Args:
        request: FastAPI request object
        exc: HTTPException instance

    Returns:
        JSONResponse with error_response schema
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": f"HTTP_{exc.status_code}",
            "message": exc.detail,
            "details": {},
        },
    )


def register_error_handlers(app: Any) -> None:
    """
    Register all custom exception handlers on FastAPI app.

    Args:
        app: FastAPI application instance
    """
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
