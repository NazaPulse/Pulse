"""Esquemas Pydantic del Módulo de Productividad (Issue #19).

Espejo 1:1 de `Task`, `CreateTaskDTO`, `UpdateTaskDTO`, `Note`,
`CreateNoteDTO`, `UpdateNoteDTO` y `AudioUploadResponse` de openapi.yaml y de
los DTOs del Backend A (`src/tasks/dto/*.ts`, `src/notes/dto/*.ts`). Los
mensajes de validación reproducen el fraseo de `class-validator`; los códigos
que en Node producen varios mensajes se expanden en `app/errors.py`.

Igual que `@IsOptional`, un `null` en un campo opcional equivale a omitirlo.
"""
from __future__ import annotations

import datetime as dt
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

from app.schemas.transaction import _ISO_8601, parse_iso_datetime

TITLE_MAX_LENGTH = 200
TASK_DESCRIPTION_MAX_LENGTH = 1000
AUDIO_URL_MAX_LENGTH = 2048

PRIORITY_ENUM_MESSAGE = "priority must be one of the following values: low, medium, high"
STATUS_ENUM_MESSAGE = "status must be one of the following values: pending, completed"
DUE_DATE_ISO_MESSAGE = "due_date must be a valid ISO 8601 date string"
DUE_DATE_PAST_MESSAGE = "due_date must be a date equal to or later than the current date"


class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"


def _fail(code: str, message: str) -> PydanticCustomError:
    return PydanticCustomError(code, message)


# ── Validadores reutilizables (mismo orden de chequeo que class-validator) ──


def _title(v: Any) -> str:
    if not isinstance(v, str):
        # IsString + MinLength + MaxLength fallan a la vez (ver `title_string`).
        raise _fail("title_string", "title must be a string")
    if len(v) > TITLE_MAX_LENGTH:
        raise _fail("title_long", f"title must be shorter than or equal to {TITLE_MAX_LENGTH} characters")
    if len(v) < 1:
        raise _fail("title_short", "title must be longer than or equal to 1 characters")
    return v


def _task_description(v: Any) -> str | None:
    if v is None:
        return None
    if not isinstance(v, str):
        raise _fail("task_description_string", "description must be a string")
    if len(v) > TASK_DESCRIPTION_MAX_LENGTH:
        raise _fail(
            "task_description_long",
            f"description must be shorter than or equal to {TASK_DESCRIPTION_MAX_LENGTH} characters",
        )
    return v


def _priority(v: Any) -> TaskPriority | None:
    if v is None:
        return None
    if isinstance(v, str):
        try:
            return TaskPriority(v)
        except ValueError:
            pass
    raise _fail("priority_enum", PRIORITY_ENUM_MESSAGE)


def _status(v: Any) -> TaskStatus | None:
    if v is None:
        return None
    if isinstance(v, str):
        try:
            return TaskStatus(v)
        except ValueError:
            pass
    raise _fail("status_enum", STATUS_ENUM_MESSAGE)


def _due_date(v: Any) -> dt.datetime | None:
    """`@IsDateString({ strict: true })` + `@IsNotPastDate()` del Backend A."""
    if v is None:
        return None
    parsed: dt.datetime | None = None
    if isinstance(v, str) and _ISO_8601.match(v):
        try:
            parsed = parse_iso_datetime(v)
        except ValueError:
            parsed = None
    if parsed is None:
        # Un valor no parseable tampoco pasa `IsNotPastDate` (ver `due_date_invalid`).
        raise _fail("due_date_invalid", DUE_DATE_ISO_MESSAGE)
    if parsed < dt.datetime.now(tz=dt.timezone.utc):
        raise _fail("due_date_past", DUE_DATE_PAST_MESSAGE)
    return parsed


def _note_content(v: Any) -> str | None:
    if v is None:
        return None
    if not isinstance(v, str):
        raise _fail("content_string", "content must be a string")
    return v


def _audio_url(v: Any) -> str | None:
    if v is None:
        return None
    if not isinstance(v, str):
        raise _fail("audio_url_string", "audio_url must be a string")
    if len(v) > AUDIO_URL_MAX_LENGTH:
        raise _fail(
            "audio_url_long",
            f"audio_url must be shorter than or equal to {AUDIO_URL_MAX_LENGTH} characters",
        )
    return v


# ── Tareas ──


class TaskCreateRequest(BaseModel):
    """`CreateTaskDTO` — cuerpo de `POST /api/tasks`. `user_id` sale del JWT."""

    model_config = ConfigDict(extra="forbid")

    title: Any
    description: Any = None
    priority: Any = None
    status: Any = None
    due_date: Any = None

    _v_title = field_validator("title")(lambda cls, v: _title(v))
    _v_description = field_validator("description")(lambda cls, v: _task_description(v))
    _v_priority = field_validator("priority")(lambda cls, v: _priority(v))
    _v_status = field_validator("status")(lambda cls, v: _status(v))
    _v_due_date = field_validator("due_date")(lambda cls, v: _due_date(v))


class TaskUpdateRequest(BaseModel):
    """`UpdateTaskDTO` — cuerpo de `PATCH /api/tasks/{id}` (y alias `PUT`).

    Edición parcial: solo se aplican los campos presentes en el payload
    (`model_fields_set`). `description`/`due_date` en `null` los eliminan.
    """

    model_config = ConfigDict(extra="forbid")

    title: Any = None
    description: Any = None
    priority: Any = None
    status: Any = None
    due_date: Any = None

    @field_validator("title")
    @classmethod
    def _v_title(cls, v: Any) -> str | None:
        return None if v is None else _title(v)

    _v_description = field_validator("description")(lambda cls, v: _task_description(v))
    _v_priority = field_validator("priority")(lambda cls, v: _priority(v))
    _v_status = field_validator("status")(lambda cls, v: _status(v))
    _v_due_date = field_validator("due_date")(lambda cls, v: _due_date(v))


class Task(BaseModel):
    """`Task` — respuesta de las rutas de Tareas."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    description: str | None
    priority: TaskPriority
    status: TaskStatus
    due_date: str | None
    user_id: str
    created_at: str
    updated_at: str


class TaskFilters(BaseModel):
    """Query params opcionales de `GET /api/tasks` (AND lógico)."""

    status: TaskStatus | None = None
    priority: TaskPriority | None = None


# ── Notas ──


class NoteCreateRequest(BaseModel):
    """`CreateNoteDTO` — cuerpo de `POST /api/notes`. `user_id` sale del JWT."""

    model_config = ConfigDict(extra="forbid")

    title: Any
    content: Any = None
    audio_url: Any = None

    _v_title = field_validator("title")(lambda cls, v: _title(v))
    _v_content = field_validator("content")(lambda cls, v: _note_content(v))
    _v_audio_url = field_validator("audio_url")(lambda cls, v: _audio_url(v))


class NoteUpdateRequest(NoteCreateRequest):
    """`UpdateNoteDTO` — cuerpo de `PUT /api/notes/{id}` (reemplazo total:
    `content`/`audio_url` omitidos o en `null` quedan vacíos)."""


class Note(BaseModel):
    """`Note` — respuesta de las rutas de Notas."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    content: str | None
    audio_url: str | None
    user_id: str
    created_at: str
    updated_at: str


class AudioUploadResponse(BaseModel):
    """`AudioUploadResponse` — respuesta de `POST /api/notes/upload-audio`."""

    model_config = ConfigDict(extra="forbid")

    audio_url: str
