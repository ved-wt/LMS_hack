"""Content management routes (Modules & Lessons)."""

from typing import Annotated, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.db import get_session
from src.models.content import Module, Lesson, LessonType
from src.models.training import Training

router = APIRouter(tags=["content"])

# --- Modules ---

from pydantic import BaseModel

class ModuleCreate(BaseModel):
    title: str
    order: int = 0

class ModuleUpdate(BaseModel):
    title: str | None = None
    order: int | None = None

class LessonCreate(BaseModel):
    title: str
    type: LessonType
    duration_minutes: int = 0
    content_url: str | None = None
    content_text: str | None = None
    questions: List[dict] | None = None
    order: int = 0

class LessonUpdate(BaseModel):
    title: str | None = None
    type: LessonType | None = None
    duration_minutes: int | None = None
    content_url: str | None = None
    content_text: str | None = None
    questions: List[dict] | None = None
    order: int | None = None

# --- Modules ---

@router.post("/trainings/{training_id}/modules")
async def create_module(
    training_id: UUID,
    module_in: ModuleCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new module for a training."""
    training = await session.get(Training, training_id)
    if not training:
        raise HTTPException(status_code=404, detail="Training not found")

    module = Module(training_id=training_id, title=module_in.title, order=module_in.order)
    session.add(module)
    await session.commit()
    await session.refresh(module)
    return module


@router.put("/modules/{module_id}")
async def update_module(
    module_id: UUID,
    module_update: ModuleUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a module."""
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    if module_update.title is not None:
        module.title = module_update.title
    if module_update.order is not None:
        module.order = module_update.order

    await session.commit()
    await session.refresh(module)
    return module


@router.delete("/modules/{module_id}")
async def delete_module(
    module_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a module and its lessons."""
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    # Cascade delete lessons (manual for now if not set up in DB)
    lessons_query = select(Lesson).where(Lesson.module_id == module_id)
    result = await session.execute(lessons_query)
    lessons = result.scalars().all()
    for lesson in lessons:
        await session.delete(lesson)

    await session.delete(module)
    await session.commit()
    return {"message": "Module deleted"}


# --- Lessons ---

@router.post("/modules/{module_id}/lessons")
async def create_lesson(
    module_id: UUID,
    lesson_in: LessonCreate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Create a new lesson."""
    module = await session.get(Module, module_id)
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")

    lesson = Lesson(
        module_id=module_id,
        title=lesson_in.title,
        type=lesson_in.type,
        duration_minutes=lesson_in.duration_minutes,
        content_url=lesson_in.content_url,
        content_text=lesson_in.content_text,
        questions=lesson_in.questions or [],
        order=lesson_in.order
    )
    session.add(lesson)
    await session.commit()
    await session.refresh(lesson)
    return lesson


@router.put("/lessons/{lesson_id}")
async def update_lesson(
    lesson_id: UUID,
    lesson_update: LessonUpdate,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Update a lesson."""
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    if lesson_update.title is not None:
        lesson.title = lesson_update.title
    if lesson_update.type is not None:
        lesson.type = lesson_update.type
    if lesson_update.duration_minutes is not None:
        lesson.duration_minutes = lesson_update.duration_minutes
    if lesson_update.content_url is not None:
        lesson.content_url = lesson_update.content_url
    if lesson_update.content_text is not None:
        lesson.content_text = lesson_update.content_text
    if lesson_update.questions is not None:
        lesson.questions = lesson_update.questions
    if lesson_update.order is not None:
        lesson.order = lesson_update.order

    await session.commit()
    await session.refresh(lesson)
    return lesson


@router.delete("/lessons/{lesson_id}")
async def delete_lesson(
    lesson_id: UUID,
    session: Annotated[AsyncSession, Depends(get_session)],
):
    """Delete a lesson."""
    lesson = await session.get(Lesson, lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    await session.delete(lesson)
    await session.commit()
    return {"message": "Lesson deleted"}
