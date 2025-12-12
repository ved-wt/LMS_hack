"""Notification routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.notification import Notification

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/user/{user_id}")
async def get_user_notifications(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    unread_only: bool = False,
):
    """Get user's notifications."""
    query = select(Notification).where(Notification.user_id == user_id)

    if unread_only:
        query = query.where(Notification.is_read == False)

    result = await session.execute(query.order_by(Notification.created_at.desc()))
    notifications = result.scalars().all()

    return {
        "items": [
            {
                "id": str(n.id),
                "notification_type": n.notification_type.value,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "action_url": n.action_url,
                "created_at": n.created_at.isoformat(),
            }
            for n in notifications
        ],
        "total": len(notifications),
    }


@router.patch("/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Mark a notification as read."""
    notification = await session.get(Notification, notification_id)
    if notification:
        notification.is_read = True
        await session.commit()

    return {"status": "ok"}
