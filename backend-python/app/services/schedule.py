"""Lógica del Cronograma diario. Réplica exacta de `src/services/schedule.service.ts`
(Backend A): aislamiento por usuario, `start_time < end_time` (400), defaults
`category=other` / `actual_duration_minutes=0` / `is_completed=false`, edición
parcial y borrado físico.
"""
from __future__ import annotations

import datetime as dt
import uuid
from enum import Enum

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.task import Task
from app.models.time_block import TimeBlock
from app.schemas.schedule import TimeBlock as TimeBlockSchema
from app.schemas.schedule import (
    INVALID_RANGE_MESSAGE,
    ScheduleRange,
    TimeBlockCategory,
    TimeBlockCreateRequest,
    TimeBlockUpdateRequest,
)
from app.services.accounts import NOT_FOUND_MESSAGE, _iso_z
from app.services.tasks import EMPTY_UPDATE_MESSAGE

_REQUIRED_FIELDS = (
    "title",
    "start_time",
    "end_time",
    "actual_duration_minutes",
    "category",
    "is_completed",
)
_NULLABLE_FIELDS = ("description", "task_id")


def to_response(block: TimeBlock) -> TimeBlockSchema:
    return TimeBlockSchema(
        id=str(block.id),
        title=block.title,
        description=block.description,
        start_time=_iso_z(block.start_time),
        end_time=_iso_z(block.end_time),
        actual_duration_minutes=block.actual_duration_minutes,
        category=TimeBlockCategory(block.category),
        task_id=str(block.task_id) if block.task_id else None,
        is_completed=block.is_completed,
        user_id=str(block.user_id),
    )


def assert_valid_range(start: dt.datetime, end: dt.datetime) -> None:
    if start >= end:
        raise HTTPException(status_code=400, detail=INVALID_RANGE_MESSAGE)


def _column_value(value: object) -> object:
    return value.value if isinstance(value, Enum) else value


def _task_uuid(value: str | None) -> uuid.UUID | None:
    return uuid.UUID(value) if value else None


def _sent_values(dto: TimeBlockUpdateRequest, sent: set[str]) -> dict[str, object]:
    """Los campos NOT NULL ignoran un `null` explícito; los anulables lo aplican."""
    values = {field: getattr(dto, field) for field in (*_REQUIRED_FIELDS, *_NULLABLE_FIELDS) if field in sent}
    return {field: value for field, value in values.items() if value is not None or field in _NULLABLE_FIELDS}


def _apply_fields(block: TimeBlock, dto: TimeBlockUpdateRequest, sent: set[str]) -> None:
    for field, value in _sent_values(dto, sent).items():
        convert = _task_uuid if field == "task_id" else _column_value
        setattr(block, field, convert(value))


def list_for_user(db: Session, user_id: uuid.UUID, rng: ScheduleRange) -> list[TimeBlockSchema]:
    """Bloques del usuario que se superponen con `[start, end)`, por `start_time` ascendente."""
    stmt = select(TimeBlock).where(TimeBlock.user_id == user_id)
    if rng.start is not None:
        stmt = stmt.where(TimeBlock.end_time > rng.start)
    if rng.end is not None:
        stmt = stmt.where(TimeBlock.start_time < rng.end)
    rows = db.scalars(stmt.order_by(TimeBlock.start_time.asc())).all()
    return [to_response(row) for row in rows]


def create(db: Session, user_id: uuid.UUID, dto: TimeBlockCreateRequest) -> TimeBlockSchema:
    assert_valid_range(dto.start_time, dto.end_time)
    if dto.task_id:
        _assert_owned_task(db, user_id, dto.task_id)

    block = TimeBlock(
        user_id=user_id,
        title=dto.title,
        description=dto.description,
        start_time=dto.start_time,
        end_time=dto.end_time,
        actual_duration_minutes=dto.actual_duration_minutes or 0,
        category=(dto.category or TimeBlockCategory.OTHER).value,
        task_id=uuid.UUID(dto.task_id) if dto.task_id else None,
        is_completed=bool(dto.is_completed),
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return to_response(block)


def update(
    db: Session, user_id: uuid.UUID, block_id: str, dto: TimeBlockUpdateRequest
) -> TimeBlockSchema:
    """Edición parcial: el rango se valida combinando lo enviado con lo guardado."""
    sent = dto.model_fields_set
    if not sent:
        raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)

    block = _find_owned_or_fail(db, user_id, block_id)
    _apply_fields(block, dto, sent)
    try:
        assert_valid_range(block.start_time, block.end_time)
        if dto.task_id:
            _assert_owned_task(db, user_id, dto.task_id)
    except HTTPException:
        db.rollback()
        raise
    db.commit()
    db.refresh(block)
    return to_response(block)


def remove(db: Session, user_id: uuid.UUID, block_id: str) -> None:
    block = _find_owned_or_fail(db, user_id, block_id)
    db.delete(block)
    db.commit()


def _assert_owned_task(db: Session, user_id: uuid.UUID, task_id: str) -> None:
    """Una tarea de otro usuario (o inexistente) responde `404`, igual que un bloque ajeno."""
    found = db.scalar(
        select(Task.id).where(Task.id == uuid.UUID(task_id), Task.user_id == user_id)
    )
    if found is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)


def _find_owned_or_fail(db: Session, user_id: uuid.UUID, block_id: str) -> TimeBlock:
    """Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
    formato inválido) responde `404` — nunca revela si existe para otro."""
    try:
        block_uuid = uuid.UUID(str(block_id))
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE) from exc

    block = db.scalar(
        select(TimeBlock).where(TimeBlock.id == block_uuid, TimeBlock.user_id == user_id)
    )
    if block is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
    return block
