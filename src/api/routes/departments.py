"""Department routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.department import Department

router = APIRouter(prefix="/departments", tags=["departments"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_department(
    name: str,
    session: Annotated[AsyncSession, Depends(get_session)],
    description: str | None = None,
):
    """Create a new department (admin only)."""
    # Check if department with same name exists
    result = await session.execute(select(Department).where(Department.name == name))
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists",
        )

    department = Department(name=name, description=description)
    session.add(department)
    await session.commit()
    await session.refresh(department)

    return {
        "id": str(department.id),
        "name": department.name,
        "description": department.description,
        "created_at": department.created_at.isoformat(),
    }


@router.get("/")
async def list_departments(
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """List all departments."""
    result = await session.execute(select(Department).offset(skip).limit(limit))
    departments = result.scalars().all()

    return [
        {
            "id": str(dept.id),
            "name": dept.name,
            "description": dept.description,
            "created_at": dept.created_at.isoformat(),
        }
        for dept in departments
    ]


@router.get("/{department_id}")
async def get_department(
    department_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get department details by ID."""
    result = await session.execute(
        select(Department).where(Department.id == department_id)
    )
    department = result.scalar_one_or_none()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    return {
        "id": str(department.id),
        "name": department.name,
        "description": department.description,
        "created_at": department.created_at.isoformat(),
        "updated_at": department.updated_at.isoformat(),
    }


@router.put("/{department_id}")
async def update_department(
    department_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    name: str | None = None,
    description: str | None = None,
):
    """Update department (admin only)."""
    result = await session.execute(
        select(Department).where(Department.id == department_id)
    )
    department = result.scalar_one_or_none()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    # Check for name conflict if updating name
    if name and name != department.name:
        result = await session.execute(
            select(Department).where(Department.name == name)
        )
        if result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Department with this name already exists",
            )
        department.name = name

    if description is not None:
        department.description = description

    await session.commit()
    await session.refresh(department)

    return {
        "id": str(department.id),
        "name": department.name,
        "description": department.description,
        "updated_at": department.updated_at.isoformat(),
    }


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department(
    department_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete department (admin only)."""
    result = await session.execute(
        select(Department).where(Department.id == department_id)
    )
    department = result.scalar_one_or_none()

    if not department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found",
        )

    await session.delete(department)
    await session.commit()
