"""Controlador del Cronograma diario (Issue #23). Rutas idénticas a openapi.yaml
y al Backend A: `/api/schedule` y `/api/schedule/{id}`. Todas requieren JWT
(`bearerAuth`) y filtran obligatoriamente por el usuario autenticado.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.api.query_params import raise_if_invalid, unknown_param_messages
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.schedule import (
    ScheduleRange,
    TimeBlock,
    TimeBlockCreateRequest,
    TimeBlockUpdateRequest,
    parse_strict_iso,
)
from app.services import schedule as schedule_service

router = APIRouter(prefix="/api/schedule", tags=["Schedule"])

_ALLOWED_FILTERS = ("from", "to")


def _iso_messages(field: str, value: str | None) -> list[str]:
    if value is None or parse_strict_iso(value) is not None:
        return []
    return [f"{field} must be a valid ISO 8601 date string"]


def get_range(
    request: Request,
    start: str | None = Query(default=None, alias="from"),
    end: str | None = Query(default=None, alias="to"),
) -> ScheduleRange:
    """Valida los query params con los mismos mensajes que `ListScheduleQueryDto`
    + `ValidationPipe(forbidNonWhitelisted)` de Node."""
    raise_if_invalid(
        unknown_param_messages(request, _ALLOWED_FILTERS)
        + _iso_messages("from", start)
        + _iso_messages("to", end)
    )
    return ScheduleRange(
        start=parse_strict_iso(start) if start else None,
        end=parse_strict_iso(end) if end else None,
    )


@router.get(
    "",
    response_model=list[TimeBlock],
    summary="Listar los bloques de tiempo del usuario autenticado",
    operation_id="listTimeBlocks",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def list_time_blocks(
    current_user: CurrentUser = Depends(get_current_user),
    rng: ScheduleRange = Depends(get_range),
    db: Session = Depends(get_db),
) -> list[TimeBlock]:
    return schedule_service.list_for_user(db, current_user.id, rng)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=TimeBlock,
    summary="Agendar un nuevo bloque de tiempo",
    operation_id="createTimeBlock",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def create_time_block(
    dto: TimeBlockCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> TimeBlock:
    return schedule_service.create(db, current_user.id, dto)


@router.patch(
    "/{block_id}",
    response_model=TimeBlock,
    summary="Actualizar parcialmente un bloque de tiempo",
    operation_id="updateTimeBlock",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def update_time_block(
    block_id: str,
    dto: TimeBlockUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> TimeBlock:
    return schedule_service.update(db, current_user.id, block_id, dto)


@router.delete(
    "/{block_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Eliminar un bloque de tiempo",
    operation_id="deleteTimeBlock",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_time_block(
    block_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    schedule_service.remove(db, current_user.id, block_id)
