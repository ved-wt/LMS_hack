"""Progress tracking routes."""

from datetime import datetime
from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.progress import LessonProgress
from src.models.content import Lesson, Module
from src.api.deps.auth import get_current_user
from src.models.user import User

router = APIRouter(tags=["progress"])

@router.post("/lessons/{lesson_id}/complete")
async def complete_lesson(
    lesson_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
    quiz_score: float = 0.0,
):
    """Mark a lesson as completed."""
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    # Check if already completed
    query = select(LessonProgress).where(
        LessonProgress.user_id == current_user.id,
        LessonProgress.lesson_id == lesson_id
    )
    result = await session.execute(query)
    progress = result.scalar_one_or_none()

    if progress:
        progress.is_completed = True
        progress.completed_at = datetime.utcnow()
        progress.quiz_score = max(progress.quiz_score, quiz_score)
    else:
        progress = LessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            is_completed=True,
            completed_at=datetime.utcnow(),
            quiz_score=quiz_score
        )
        session.add(progress)

    await session.commit()
    
    # Update Enrollment Progress
    # 1. Get Training ID
    stmt = select(Module.training_id).where(Module.id == lesson.module_id)
    result = await session.execute(stmt)
    training_id = result.scalar_one_or_none()
    
    if training_id:
        # 2. Get Enrollment
        from src.models.enrollment import Enrollment, EnrollmentStatus
        stmt = select(Enrollment).where(
            Enrollment.user_id == current_user.id,
            Enrollment.training_id == training_id
        )
        result = await session.execute(stmt)
        enrollment = result.scalar_one_or_none()
        
        if enrollment:
            # 3. Calculate Progress
            # Get total lessons
            stmt = select(Lesson.id).join(Module).where(Module.training_id == training_id)
            result = await session.execute(stmt)
            all_lesson_ids = result.scalars().all()
            total_lessons = len(all_lesson_ids)
            
            # Get completed lessons
            stmt = select(LessonProgress.lesson_id).where(
                LessonProgress.user_id == current_user.id,
                LessonProgress.lesson_id.in_(all_lesson_ids),
                LessonProgress.is_completed == True
            )
            result = await session.execute(stmt)
            completed_count = len(result.scalars().all())
            
            if total_lessons > 0:
                percentage = (completed_count / total_lessons) * 100
                enrollment.completion_percentage = round(percentage, 2)
                
                if percentage >= 100:
                    enrollment.status = EnrollmentStatus.COMPLETED
                    enrollment.completed_at = datetime.utcnow()
                elif percentage > 0 and enrollment.status == EnrollmentStatus.ENROLLED:
                    enrollment.status = EnrollmentStatus.IN_PROGRESS
                
                session.add(enrollment)
                await session.commit()

    return {"message": "Lesson marked as complete", "lesson_id": str(lesson_id)}


@router.get("/trainings/{training_id}/progress")
async def get_training_progress(
    training_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get completed lesson IDs for a training."""
    # Get all modules for training
    modules_query = select(Module.id).where(Module.training_id == training_id)
    modules_result = await session.execute(modules_query)
    module_ids = modules_result.scalars().all()

    if not module_ids:
        return {"completed_lessons": []}

    # Get all lessons for these modules
    lessons_query = select(Lesson.id).where(Lesson.module_id.in_(module_ids))
    lessons_result = await session.execute(lessons_query)
    lesson_ids = lessons_result.scalars().all()

    if not lesson_ids:
        return {"completed_lessons": []}

    # Get progress for these lessons
    progress_query = select(LessonProgress.lesson_id).where(
        LessonProgress.user_id == current_user.id,
        LessonProgress.lesson_id.in_(lesson_ids),
        LessonProgress.is_completed == True
    )
    progress_result = await session.execute(progress_query)
    completed_lesson_ids = progress_result.scalars().all()

    return {
        "training_id": str(training_id),
        "completed_lessons": [str(lid) for lid in completed_lesson_ids]
    }
