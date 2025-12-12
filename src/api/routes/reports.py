"""Reporting and analytics routes."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.badge import Badge
from src.models.completion import TrainingCompletion
from src.models.department import Department
from src.models.enrollment import Enrollment, EnrollmentStatus
from src.models.training import Training
from src.models.user import User

router = APIRouter(prefix="/reports", tags=["reports"])


# ============================================================================
# User Reports
# ============================================================================


@router.get("/user/{user_id}/training-history")
async def get_user_training_history(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    year: int | None = None,
):
    """
    Get user's completed training history.

    Optionally filter by year.
    """
    query = select(TrainingCompletion).where(TrainingCompletion.user_id == user_id)

    if year:
        query = query.where(
            func.extract("year", TrainingCompletion.completed_at) == year
        )

    query = query.order_by(TrainingCompletion.completed_at.desc())
    result = await session.execute(query)
    completions = result.scalars().all()

    items = []
    for completion in completions:
        training = await session.get(Training, completion.training_id)
        items.append(
            {
                "completion_id": str(completion.id),
                "training_id": str(completion.training_id),
                "training_title": training.title if training else "Unknown",
                "training_category": training.category if training else "Unknown",
                "completed_at": completion.completed_at.isoformat(),
                "learning_hours": completion.learning_hours,
                "attendance_percentage": completion.attendance_percentage,
                "assessment_score": completion.assessment_score,
                "passed": completion.passed,
                "certificate_issued": completion.certificate_issued,
            }
        )

    total_hours = sum(c.learning_hours for c in completions)

    return {
        "user_id": str(user_id),
        "total_completions": len(items),
        "total_learning_hours": total_hours,
        "items": items,
    }


@router.get("/user/{user_id}/learning-hours")
async def get_user_learning_hours_by_year(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get user's learning hours grouped by year.
    """
    query = (
        select(
            func.extract("year", TrainingCompletion.completed_at).label("year"),
            func.sum(TrainingCompletion.learning_hours).label("total_hours"),
            func.count(TrainingCompletion.id).label("training_count"),
        )
        .where(TrainingCompletion.user_id == user_id)
        .group_by(func.extract("year", TrainingCompletion.completed_at))
        .order_by(func.extract("year", TrainingCompletion.completed_at).desc())
    )

    result = await session.execute(query)
    rows = result.all()

    items = []
    for row in rows:
        year = int(row.year)
        total_hours = float(row.total_hours)
        training_count = int(row.training_count)

        items.append(
            {
                "year": year,
                "total_hours": total_hours,
                "training_count": training_count,
            }
        )

    overall_total = sum(item["total_hours"] for item in items)
    overall_count = sum(item["training_count"] for item in items)

    return {
        "user_id": str(user_id),
        "overall_total_hours": overall_total,
        "overall_training_count": overall_count,
        "years": items,
    }


@router.get("/user/{user_id}/badges")
async def get_user_badge_history(
    user_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get user's badge achievement history.
    """
    query = (
        select(Badge).where(Badge.user_id == user_id).order_by(Badge.year_earned.desc())
    )
    result = await session.execute(query)
    badges = result.scalars().all()

    return {
        "user_id": str(user_id),
        "total_badges": len(badges),
        "badges": [
            {
                "id": str(b.id),
                "badge_type": b.badge_type.value,
                "year_earned": b.year_earned,
                "hours_completed": b.hours_completed,
                "trainings_completed": b.trainings_completed,
                "awarded_at": b.awarded_at,
            }
            for b in badges
        ],
    }


# ============================================================================
# Manager Reports
# ============================================================================


@router.get("/manager/{manager_id}/team-progress")
async def get_team_training_progress(
    manager_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get training progress for all team members.

    Shows enrollments, completions, and learning hours for each team member.
    """
    # Get team members
    team_query = select(User).where(User.manager_id == manager_id)
    team_result = await session.execute(team_query)
    team_members = team_result.scalars().all()

    if not team_members:
        return {
            "manager_id": str(manager_id),
            "team_size": 0,
            "team_members": [],
        }

    team_data = []
    for member in team_members:
        # Get enrollments
        enrollments_query = select(Enrollment).where(Enrollment.user_id == member.id)
        enrollments_result = await session.execute(enrollments_query)
        enrollments = enrollments_result.scalars().all()

        # Get completions
        completions_query = select(TrainingCompletion).where(
            TrainingCompletion.user_id == member.id
        )
        completions_result = await session.execute(completions_query)
        completions = completions_result.scalars().all()

        total_hours = sum(c.learning_hours for c in completions)

        # Count by status
        enrolled_count = sum(
            1 for e in enrollments if e.status == EnrollmentStatus.ENROLLED
        )
        in_progress_count = sum(
            1 for e in enrollments if e.status == EnrollmentStatus.IN_PROGRESS
        )
        completed_count = sum(
            1 for e in enrollments if e.status == EnrollmentStatus.COMPLETED
        )

        team_data.append(
            {
                "user_id": str(member.id),
                "full_name": member.full_name,
                "email": member.email,
                "total_enrollments": len(enrollments),
                "enrolled": enrolled_count,
                "in_progress": in_progress_count,
                "completed": completed_count,
                "total_learning_hours": total_hours,
            }
        )

    return {
        "manager_id": str(manager_id),
        "team_size": len(team_members),
        "team_members": team_data,
    }


@router.get("/manager/{manager_id}/team-completion-rate")
async def get_team_completion_statistics(
    manager_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get team-wide completion statistics.

    Shows completion rates, average learning hours, and top performers.
    """
    # Get team members
    team_query = select(User).where(User.manager_id == manager_id)
    team_result = await session.execute(team_query)
    team_members = team_result.scalars().all()

    if not team_members:
        return {
            "manager_id": str(manager_id),
            "team_size": 0,
            "statistics": {},
        }

    team_member_ids = [m.id for m in team_members]

    # Get all enrollments for team
    enrollments_query = select(Enrollment).where(
        Enrollment.user_id.in_(team_member_ids)
    )
    enrollments_result = await session.execute(enrollments_query)
    all_enrollments = enrollments_result.scalars().all()

    # Get all completions for team
    completions_query = select(TrainingCompletion).where(
        TrainingCompletion.user_id.in_(team_member_ids)
    )
    completions_result = await session.execute(completions_query)
    all_completions = completions_result.scalars().all()

    total_enrollments = len(all_enrollments)
    total_completions = len(all_completions)
    completion_rate = (
        (total_completions / total_enrollments * 100) if total_enrollments > 0 else 0
    )

    total_hours = sum(c.learning_hours for c in all_completions)
    avg_hours_per_member = total_hours / len(team_members) if team_members else 0

    # Calculate per-member stats for top performers
    member_stats = []
    for member in team_members:
        member_completions = [c for c in all_completions if c.user_id == member.id]
        member_hours = sum(c.learning_hours for c in member_completions)

        member_stats.append(
            {
                "user_id": str(member.id),
                "full_name": member.full_name,
                "completions": len(member_completions),
                "learning_hours": member_hours,
            }
        )

    # Sort by hours and get top 5
    top_performers = sorted(
        member_stats, key=lambda x: x["learning_hours"], reverse=True
    )[:5]

    return {
        "manager_id": str(manager_id),
        "team_size": len(team_members),
        "statistics": {
            "total_enrollments": total_enrollments,
            "total_completions": total_completions,
            "completion_rate_percentage": round(completion_rate, 2),
            "total_learning_hours": total_hours,
            "average_hours_per_member": round(avg_hours_per_member, 2),
        },
        "top_performers": top_performers,
    }


# ============================================================================
# Admin Reports
# ============================================================================


@router.get("/admin/training-stats")
async def get_overall_training_statistics(
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get overall training statistics across the organization.
    """
    # Total trainings
    trainings_query = select(func.count(Training.id))
    trainings_result = await session.execute(trainings_query)
    total_trainings = trainings_result.scalar() or 0

    # Trainings by status
    status_query = select(Training.status, func.count(Training.id)).group_by(
        Training.status
    )
    status_result = await session.execute(status_query)
    status_counts = {str(row[0].value): row[1] for row in status_result.all()}

    # Total enrollments
    enrollments_query = select(func.count(Enrollment.id))
    enrollments_result = await session.execute(enrollments_query)
    total_enrollments = enrollments_result.scalar() or 0

    # Enrollments by status
    enrollment_status_query = select(
        Enrollment.status, func.count(Enrollment.id)
    ).group_by(Enrollment.status)
    enrollment_status_result = await session.execute(enrollment_status_query)
    enrollment_status_counts = {
        str(row[0].value): row[1] for row in enrollment_status_result.all()
    }

    # Total completions
    completions_query = select(func.count(TrainingCompletion.id))
    completions_result = await session.execute(completions_query)
    total_completions = completions_result.scalar() or 0

    # Total learning hours
    hours_query = select(func.sum(TrainingCompletion.learning_hours))
    hours_result = await session.execute(hours_query)
    total_hours = hours_result.scalar() or 0

    # Average completion rate
    completion_rate = (
        (total_completions / total_enrollments * 100) if total_enrollments > 0 else 0
    )

    # Most popular trainings (by enrollment count)
    popular_query = (
        select(
            Training.id,
            Training.title,
            Training.category,
            func.count(Enrollment.id).label("enrollment_count"),
        )
        .join(Enrollment, Training.id == Enrollment.training_id, isouter=True)
        .group_by(Training.id, Training.title, Training.category)
        .order_by(func.count(Enrollment.id).desc())
        .limit(10)
    )
    popular_result = await session.execute(popular_query)
    popular_trainings = [
        {
            "training_id": str(row.id),
            "title": row.title,
            "category": row.category,
            "enrollment_count": row.enrollment_count,
        }
        for row in popular_result.all()
    ]

    return {
        "total_trainings": total_trainings,
        "trainings_by_status": status_counts,
        "total_enrollments": total_enrollments,
        "enrollments_by_status": enrollment_status_counts,
        "total_completions": total_completions,
        "completion_rate_percentage": round(completion_rate, 2),
        "total_learning_hours": float(total_hours),
        "most_popular_trainings": popular_trainings,
    }


@router.get("/admin/department-stats")
async def get_department_statistics(
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """
    Get department-wise analytics.

    Shows training participation and completion rates by department.
    """
    # Get all departments
    departments_query = select(Department)
    departments_result = await session.execute(departments_query)
    departments = departments_result.scalars().all()

    department_stats = []
    for dept in departments:
        # Get users in department
        users_query = select(User).where(User.department_id == dept.id)
        users_result = await session.execute(users_query)
        dept_users = users_result.scalars().all()

        if not dept_users:
            department_stats.append(
                {
                    "department_id": str(dept.id),
                    "department_name": dept.name,
                    "employee_count": 0,
                    "total_enrollments": 0,
                    "total_completions": 0,
                    "total_learning_hours": 0,
                    "completion_rate_percentage": 0,
                }
            )
            continue

        user_ids = [u.id for u in dept_users]

        # Get enrollments
        enrollments_query = select(Enrollment).where(Enrollment.user_id.in_(user_ids))
        enrollments_result = await session.execute(enrollments_query)
        dept_enrollments = enrollments_result.scalars().all()

        # Get completions
        completions_query = select(TrainingCompletion).where(
            TrainingCompletion.user_id.in_(user_ids)
        )
        completions_result = await session.execute(completions_query)
        dept_completions = completions_result.scalars().all()

        total_hours = sum(c.learning_hours for c in dept_completions)
        completion_rate = (
            len(dept_completions) / len(dept_enrollments) * 100
            if dept_enrollments
            else 0
        )

        department_stats.append(
            {
                "department_id": str(dept.id),
                "department_name": dept.name,
                "employee_count": len(dept_users),
                "total_enrollments": len(dept_enrollments),
                "total_completions": len(dept_completions),
                "total_learning_hours": total_hours,
                "completion_rate_percentage": round(completion_rate, 2),
                "avg_hours_per_employee": (
                    round(total_hours / len(dept_users), 2) if dept_users else 0
                ),
            }
        )

    # Sort by total learning hours
    department_stats.sort(key=lambda x: x["total_learning_hours"], reverse=True)

    return {
        "total_departments": len(departments),
        "departments": department_stats,
    }


@router.get("/admin/badge-distribution")
async def get_badge_distribution(
    session: Annotated[AsyncSession, Depends(get_session)],
    year: int | None = None,
):
    """
    Get badge distribution across users.

    Shows how many users have earned each badge tier.
    Optionally filter by year.
    """
    query = select(Badge)

    if year:
        query = query.where(Badge.year_earned == year)

    result = await session.execute(query)
    badges = result.scalars().all()

    # Count by badge type
    badge_counts = {}
    for badge in badges:
        badge_type = badge.badge_type.value
        badge_counts[badge_type] = badge_counts.get(badge_type, 0) + 1

    # Get total unique users with badges
    unique_users = len(set(b.user_id for b in badges))

    # Calculate total hours and trainings
    total_hours = sum(b.hours_completed for b in badges)
    total_trainings = sum(b.trainings_completed for b in badges)

    return {
        "year": year if year else "all_time",
        "total_badges_awarded": len(badges),
        "unique_badge_holders": unique_users,
        "badge_distribution": badge_counts,
        "total_learning_hours": total_hours,
        "total_trainings_completed": total_trainings,
        "badges": [
            {
                "user_id": str(b.user_id),
                "badge_type": b.badge_type.value,
                "year_earned": b.year_earned,
                "hours_completed": b.hours_completed,
                "trainings_completed": b.trainings_completed,
            }
            for b in badges
        ],
    }
