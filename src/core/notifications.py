"""Notification service for creating notifications."""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from src.models.notification import Notification, NotificationType


async def create_notification(
    session: AsyncSession,
    user_id: UUID,
    notification_type: NotificationType,
    title: str,
    message: str,
    action_url: str | None = None,
) -> Notification:
    """
    Create a notification for a user.

    Args:
        session: Database session
        user_id: User to notify
        notification_type: Type of notification
        title: Notification title
        message: Notification message
        action_url: Optional URL for action button

    Returns:
        Created notification
    """
    notification = Notification(
        user_id=user_id,
        notification_type=notification_type,
        title=title,
        message=message,
        action_url=action_url,
    )
    session.add(notification)
    await session.flush()  # Flush to get the ID but don't commit
    return notification


async def notify_training_assigned(
    session: AsyncSession,
    user_id: UUID,
    training_title: str,
    assigned_by_name: str = "Manager",
) -> Notification:
    """Notify user about training assignment."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.TRAINING_ASSIGNED,
        title="New Training Assigned",
        message=f"{assigned_by_name} has assigned you to the training: {training_title}",
        action_url="/trainings",
    )


async def notify_training_approved(
    session: AsyncSession,
    user_id: UUID,
    training_title: str,
) -> Notification:
    """Notify user about training approval."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.TRAINING_APPROVED,
        title="Training Approved",
        message=f"Your training '{training_title}' has been approved!",
        action_url="/trainings",
    )


async def notify_training_rejected(
    session: AsyncSession,
    user_id: UUID,
    training_title: str,
    reason: str,
) -> Notification:
    """Notify user about training rejection."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.TRAINING_REJECTED,
        title="Training Rejected",
        message=f"Your training '{training_title}' was rejected. Reason: {reason}",
        action_url="/trainings",
    )


async def notify_badge_earned(
    session: AsyncSession,
    user_id: UUID,
    badge_type: str,
    year: int,
    hours: float,
) -> Notification:
    """Notify user about earning a badge."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.BADGE_EARNED,
        title=f"🎉 {badge_type} Badge Earned!",
        message=f"Congratulations! You've earned a {badge_type} badge for completing {hours} learning hours in {year}!",
        action_url="/badges",
    )


async def notify_session_reminder(
    session: AsyncSession,
    user_id: UUID,
    training_title: str,
    session_date: str,
    session_time: str,
) -> Notification:
    """Notify user about upcoming training session."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.SESSION_REMINDER,
        title="Upcoming Training Session",
        message=f"Reminder: '{training_title}' is scheduled for {session_date} at {session_time}",
        action_url="/sessions",
    )


async def notify_enrollment_confirmed(
    session: AsyncSession,
    user_id: UUID,
    training_title: str,
) -> Notification:
    """Notify user about enrollment confirmation."""
    return await create_notification(
        session=session,
        user_id=user_id,
        notification_type=NotificationType.SESSION_SCHEDULED,
        title="Enrollment Confirmed",
        message=f"You have been successfully enrolled in '{training_title}'",
        action_url="/trainings",
    )
