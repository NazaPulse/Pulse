"""Lógica de Tareas. Réplica exacta de `src/tasks/tasks.service.ts`
(Backend A): aislamiento por usuario, defaults `priority=medium` /
`status=pending`, edición parcial y borrado físico.
"""
from __future__ import annotations

import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.schemas.productivity import Task as TaskSchema
from app.schemas.productivity import (
    TaskCreateRequest,
    TaskFilters,
    TaskPriority,
    TaskStatus,
    TaskUpdateRequest,
)
from app.services.accounts import NOT_FOUND_MESSAGE, _iso_z

EMPTY_UPDATE_MESSAGE = "Debe enviarse al menos un campo para actualizar."


def _to_response(task: Task) -> TaskSchema:
    return TaskSchema(
        id=str(task.id),
        title=task.title,
        description=task.description,
        priority=TaskPriority(task.priority),
        status=TaskStatus(task.status),
        due_date=_iso_z(task.due_date) if task.due_date else None,
        user_id=str(task.user_id),
        created_at=_iso_z(task.created_at),
        updated_at=_iso_z(task.updated_at),
    )


class TasksService:
    def list_for_user(
        self, db: Session, user_id: uuid.UUID, filters: TaskFilters
    ) -> list[TaskSchema]:
        stmt = select(Task).where(Task.user_id == user_id)
        if filters.status is not None:
            stmt = stmt.where(Task.status == filters.status.value)
        if filters.priority is not None:
            stmt = stmt.where(Task.priority == filters.priority.value)
        rows = db.scalars(stmt.order_by(Task.created_at.desc())).all()
        return [_to_response(row) for row in rows]

    def create(self, db: Session, user_id: uuid.UUID, dto: TaskCreateRequest) -> TaskSchema:
        task = Task(
            user_id=user_id,
            title=dto.title,
            description=dto.description,
            priority=(dto.priority or TaskPriority.MEDIUM).value,
            status=(dto.status or TaskStatus.PENDING).value,
            due_date=dto.due_date,
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return _to_response(task)

    def get_for_user(self, db: Session, user_id: uuid.UUID, task_id: str) -> TaskSchema:
        return _to_response(self._find_owned_or_fail(db, user_id, task_id))

    def update(
        self, db: Session, user_id: uuid.UUID, task_id: str, dto: TaskUpdateRequest
    ) -> TaskSchema:
        """Edición parcial: solo se modifican los campos presentes en el payload."""
        sent = dto.model_fields_set
        if not sent:
            raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)

        task = self._find_owned_or_fail(db, user_id, task_id)
        # `title`/`priority`/`status` son NOT NULL: un `null` explícito se ignora.
        if "title" in sent and dto.title is not None:
            task.title = dto.title
        if "description" in sent:
            task.description = dto.description
        if "priority" in sent and dto.priority is not None:
            task.priority = dto.priority.value
        if "status" in sent and dto.status is not None:
            task.status = dto.status.value
        if "due_date" in sent:
            task.due_date = dto.due_date

        db.commit()
        db.refresh(task)
        return _to_response(task)

    def remove(self, db: Session, user_id: uuid.UUID, task_id: str) -> None:
        task = self._find_owned_or_fail(db, user_id, task_id)
        db.delete(task)
        db.commit()

    def _find_owned_or_fail(self, db: Session, user_id: uuid.UUID, task_id: str) -> Task:
        """Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
        formato inválido) responde `404` — nunca revela si existe para otro."""
        try:
            task_uuid = uuid.UUID(str(task_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE) from exc

        task = db.scalar(select(Task).where(Task.id == task_uuid, Task.user_id == user_id))
        if task is None:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
        return task


tasks_service = TasksService()
