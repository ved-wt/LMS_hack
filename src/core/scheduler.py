"""Background scheduler for periodic tasks."""

import logging
from datetime import datetime, timedelta

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from src.core.config import get_settings
from src.core.notifications import notify_session_reminder
from src.models.enrollment import Enrollment
from src.models.training import TrainingSession
from src.models.user import User

logger = logging.getLogger(__name__)

# Global scheduler instance
scheduler: AsyncIOScheduler | None = None


async def send_session_reminders():
    """
    Send reminders for training sessions scheduled for tomorrow.
    Runs daily to check upcoming sessions.
    """
    logger.info("Running session reminders task")

    try:
        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            # Get tomorrow's date
            tomorrow = (datetime.utcnow() + timedelta(days=1)).date()

            # Find all sessions scheduled for tomorrow
            sessions_query = select(TrainingSession).where(
                TrainingSession.session_date == tomorrow
            )
            result = await session.execute(sessions_query)
            upcoming_sessions = result.scalars().all()

            logger.info(
                f"Found {len(upcoming_sessions)} sessions scheduled for {tomorrow}"
            )

            # For each session, find enrolled users and send reminders
            for training_session in upcoming_sessions:
                # Get all enrollments for this training
                enrollments_query = select(Enrollment).where(
                    Enrollment.training_id == training_session.training_id
                )
                enrollments_result = await session.execute(enrollments_query)
                enrollments = enrollments_result.scalars().all()

                # Get training details
                from src.models.training import Training

                training = await session.get(Training, training_session.training_id)

                if not training:
                    continue

                # Send notification to each enrolled user
                for enrollment in enrollments:
                    try:
                        await notify_session_reminder(
                            session=session,
                            user_id=enrollment.user_id,
                            training_title=training.title,
                            session_date=str(training_session.session_date),
                            session_time=training_session.start_time,
                        )
                        logger.info(
                            f"Sent reminder to user {enrollment.user_id} for session {training_session.id}"
                        )
                    except Exception as e:
                        logger.error(
                            f"Failed to send reminder to user {enrollment.user_id}: {e}"
                        )

            await session.commit()
            logger.info("Session reminders task completed successfully")

    except Exception as e:
        logger.error(f"Error in send_session_reminders: {e}")


async def calculate_yearly_badges():
    """
    Calculate and award badges for the previous year.
    Runs once a year on January 1st.
    """
    logger.info("Running yearly badge calculation task")

    try:
        settings = get_settings()
        engine = create_async_engine(settings.DATABASE_URL, echo=False)
        async_session = sessionmaker(
            engine, class_=AsyncSession, expire_on_commit=False
        )

        async with async_session() as session:
            from src.models.completion import TrainingCompletion
            from src.models.badge import Badge

            # Get previous year
            current_year = datetime.utcnow().year
            previous_year = current_year - 1

            logger.info(f"Calculating badges for year {previous_year}")

            # Get all users who completed trainings last year
            completions_query = select(TrainingCompletion).where(
                TrainingCompletion.completed_at >= datetime(previous_year, 1, 1),
                TrainingCompletion.completed_at < datetime(current_year, 1, 1),
            )
            result = await session.execute(completions_query)
            completions = result.scalars().all()

            # Group by user and calculate total hours
            user_hours = {}
            user_trainings = {}
            for completion in completions:
                user_id = completion.user_id
                if user_id not in user_hours:
                    user_hours[user_id] = 0
                    user_trainings[user_id] = 0
                user_hours[user_id] += completion.learning_hours
                user_trainings[user_id] += 1

            logger.info(
                f"Found {len(user_hours)} users with completions in {previous_year}"
            )

            # Award badges
            from src.models.badge import BadgeType
            from src.core.notifications import notify_badge_earned

            for user_id, total_hours in user_hours.items():
                # Check if user already has badge for this year
                existing_badge_query = select(Badge).where(
                    Badge.user_id == user_id,
                    Badge.year_earned == previous_year,
                )
                existing_result = await session.execute(existing_badge_query)
                if existing_result.scalar_one_or_none():
                    logger.info(f"User {user_id} already has badge for {previous_year}")
                    continue

                # Determine badge type
                badge_type = None
                if total_hours >= 80:
                    badge_type = BadgeType.PLATINUM
                elif total_hours >= 60:
                    badge_type = BadgeType.GOLD
                elif total_hours >= 40:
                    badge_type = BadgeType.SILVER
                elif total_hours >= 20:
                    badge_type = BadgeType.BRONZE

                if badge_type:
                    # Create badge
                    badge = Badge(
                        user_id=user_id,
                        badge_type=badge_type,
                        year_earned=previous_year,
                        hours_completed=total_hours,
                        trainings_completed=user_trainings[user_id],
                        awarded_at=datetime.utcnow().isoformat(),
                    )
                    session.add(badge)

                    # Send notification
                    await notify_badge_earned(
                        session=session,
                        user_id=user_id,
                        badge_type=badge_type.value,
                        year=previous_year,
                        hours=total_hours,
                    )
                    logger.info(
                        f"Awarded {badge_type.value} badge to user {user_id} for {previous_year}"
                    )

            await session.commit()
            logger.info("Yearly badge calculation completed successfully")

    except Exception as e:
        logger.error(f"Error in calculate_yearly_badges: {e}")


def start_scheduler():
    """Start the background scheduler."""
    global scheduler

    if scheduler is not None:
        logger.warning("Scheduler already running")
        return

    scheduler = AsyncIOScheduler()

    # Daily job for session reminders (runs at 9 AM every day)
    scheduler.add_job(
        send_session_reminders,
        CronTrigger(hour=9, minute=0),
        id="session_reminders",
        name="Send session reminders",
        replace_existing=True,
    )

    # Yearly job for badge calculations (runs on January 1st at midnight)
    scheduler.add_job(
        calculate_yearly_badges,
        CronTrigger(month=1, day=1, hour=0, minute=0),
        id="yearly_badges",
        name="Calculate yearly badges",
        replace_existing=True,
    )

    scheduler.start()
    logger.info("Background scheduler started")


def stop_scheduler():
    """Stop the background scheduler."""
    global scheduler

    if scheduler is not None:
        scheduler.shutdown()
        scheduler = None
        logger.info("Background scheduler stopped")
