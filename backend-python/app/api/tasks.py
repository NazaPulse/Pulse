"""Controlador de Tareas (Issue #19). Rutas idénticas a openapi.yaml y al
Backend A: `/api/tasks` y `/api/tasks/{id}`. Todas requieren JWT
(`bearerAuth`) y filtran obligatoriamente por el usuario autenticado.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.productivity import (
    PRIORITY_ENUM_MESSAGE,
    STATUS_ENUM_MESSAGE,
    Task,
    TaskCreateRequest,
    TaskFilters,
    TaskPriority,
    TaskStatus,
    TaskUpdateRequest,
)
from app.services.tasks import tasks_service

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

_ALLOWED_FILTERS = ("status", "priority")


def get_filters(
    request: Request,
    status: str | None = Query(default=None),
    priority: str | None = Query(default=None),
) -> TaskFilters:
    """Valida los query params con los mismos mensajes que `ListTasksQueryDto`
    + `ValidationPipe(forbidNonWhitelisted)` de Node."""
    messages: list[str] = [
        f"property {key} should not exist"
        for key in request.query_params
        if key not in _ALLOWED_FILTERS
    ]
    if status is not None and status not in {s.value for s in TaskStatus}:
        messages.append(STATUS_ENUM_MESSAGE)
    if priority is not None and priority not in {p.value for p in TaskPriority}:
        messages.append(PRIORITY_ENUM_MESSAGE)
    if messages:
        raise HTTPException(status_code=400, detail=messages)

    return TaskFilters(
        status=TaskStatus(status) if status else None,
        priority=TaskPriority(priority) if priority else None,
    )


@router.get(
    "",
    response_model=list[Task],
    summary="Listar las tareas del usuario autenticado",
    operation_id="listTasks",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def list_tasks(
    current_user: CurrentUser = Depends(get_current_user),
    filters: TaskFilters = Depends(get_filters),
    db: Session = Depends(get_db),
) -> list[Task]:
    return tasks_service.list_for_user(db, current_user.id, filters)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Task,
    summary="Crear una nueva tarea",
    operation_id="createTask",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def create_task(
    dto: TaskCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Task:
    return tasks_service.create(db, current_user.id, dto)


@router.get(
    "/{task_id}",
    response_model=Task,
    summary="Obtener una tarea por id",
    operation_id="getTaskById",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Task:
    return tasks_service.get_for_user(db, current_user.id, task_id)


@router.patch(
    "/{task_id}",
    response_model=Task,
    summary="Actualizar parcialmente una tarea existente",
    operation_id="updateTask",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def update_task(
    task_id: str,
    dto: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Task:
    return tasks_service.update(db, current_user.id, task_id, dto)


# Alias de `PATCH` (misma semántica de edición parcial), igual que el Backend A.
# No figura en openapi.yaml, por eso se excluye del esquema.
@router.put("/{task_id}", response_model=Task, include_in_schema=False)
def replace_task(
    task_id: str,
    dto: TaskUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Task:
    return tasks_service.update(db, current_user.id, task_id, dto)


@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Eliminar una tarea",
    operation_id="deleteTask",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    tasks_service.remove(db, current_user.id, task_id)
