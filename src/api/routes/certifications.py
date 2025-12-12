"""Certification routes."""

from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.certification import Certification

router = APIRouter(prefix="/certifications", tags=["certifications"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_certification(
    user_id: UUID,
    name: str,
    issuing_organization: str,
    issue_date: date,
    session: Annotated[AsyncSession, Depends(get_session)],
    expiry_date: date | None = None,
    credential_id: str | None = None,
    credential_url: str | None = None,
):
    """Add a certification for a user."""
    certification = Certification(
        user_id=user_id,
        name=name,
        issuing_organization=issuing_organization,
        issue_date=issue_date,
        expiry_date=expiry_date,
        credential_id=credential_id,
        credential_url=credential_url,
    )
    session.add(certification)
    await session.commit()
    await session.refresh(certification)

    return {
        "id": str(certification.id),
        "user_id": str(certification.user_id),
        "name": certification.name,
        "issuing_organization": certification.issuing_organization,
        "issue_date": certification.issue_date.isoformat(),
        "expiry_date": (
            certification.expiry_date.isoformat() if certification.expiry_date else None
        ),
        "credential_id": certification.credential_id,
        "credential_url": certification.credential_url,
        "created_at": certification.created_at.isoformat(),
    }


@router.get("/user/{user_id}")
async def get_user_certifications(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    skip: int = 0,
    limit: int = 100,
):
    """Get certifications for a user."""
    result = await session.execute(
        select(Certification)
        .where(Certification.user_id == user_id)
        .offset(skip)
        .limit(limit)
    )
    certifications = result.scalars().all()

    return [
        {
            "id": str(cert.id),
            "name": cert.name,
            "issuing_organization": cert.issuing_organization,
            "issue_date": cert.issue_date.isoformat(),
            "expiry_date": cert.expiry_date.isoformat() if cert.expiry_date else None,
            "credential_id": cert.credential_id,
            "credential_url": cert.credential_url,
            "created_at": cert.created_at.isoformat(),
        }
        for cert in certifications
    ]


@router.get("/{certification_id}")
async def get_certification(
    certification_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Get certification details by ID."""
    result = await session.execute(
        select(Certification).where(Certification.id == certification_id)
    )
    certification = result.scalar_one_or_none()

    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    return {
        "id": str(certification.id),
        "user_id": str(certification.user_id),
        "name": certification.name,
        "issuing_organization": certification.issuing_organization,
        "issue_date": certification.issue_date.isoformat(),
        "expiry_date": (
            certification.expiry_date.isoformat() if certification.expiry_date else None
        ),
        "credential_id": certification.credential_id,
        "credential_url": certification.credential_url,
        "created_at": certification.created_at.isoformat(),
        "updated_at": certification.updated_at.isoformat(),
    }


@router.put("/{certification_id}")
async def update_certification(
    certification_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    name: str | None = None,
    issuing_organization: str | None = None,
    issue_date: date | None = None,
    expiry_date: date | None = None,
    credential_id: str | None = None,
    credential_url: str | None = None,
):
    """Update certification details."""
    result = await session.execute(
        select(Certification).where(Certification.id == certification_id)
    )
    certification = result.scalar_one_or_none()

    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    if name is not None:
        certification.name = name
    if issuing_organization is not None:
        certification.issuing_organization = issuing_organization
    if issue_date is not None:
        certification.issue_date = issue_date
    if expiry_date is not None:
        certification.expiry_date = expiry_date
    if credential_id is not None:
        certification.credential_id = credential_id
    if credential_url is not None:
        certification.credential_url = credential_url

    await session.commit()
    await session.refresh(certification)

    return {
        "id": str(certification.id),
        "name": certification.name,
        "issuing_organization": certification.issuing_organization,
        "issue_date": certification.issue_date.isoformat(),
        "expiry_date": (
            certification.expiry_date.isoformat() if certification.expiry_date else None
        ),
        "credential_id": certification.credential_id,
        "credential_url": certification.credential_url,
        "updated_at": certification.updated_at.isoformat(),
    }


@router.delete("/{certification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_certification(
    certification_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a certification."""
    result = await session.execute(
        select(Certification).where(Certification.id == certification_id)
    )
    certification = result.scalar_one_or_none()

    if not certification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Certification not found",
        )

    await session.delete(certification)
    await session.commit()
