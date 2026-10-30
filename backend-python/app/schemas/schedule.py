"""Esquemas Pydantic del Cronograma diario (Issue #23).

Espejo 1:1 de `TimeBlock`, `CreateTimeBlockDTO` y `UpdateTimeBlockDTO` de
openapi.yaml y de los DTOs del Backend A (`src/dto/schedule/*.ts`). Los
mensajes reproducen el fraseo de `class-validator`; los códigos que en Node
producen varios mensajes se expanden en `app/errors.py`.

Igual que `@IsOptional`, un `null` en un campo opcional equivale a omitirlo.
"""
from __future__ import annotations

import datetime as dt
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic_core import PydanticCustomError

from app.schemas.productivity import _task_description, _title
from app.schemas.transaction import _ISO_8601, as_number, is_uuid, parse_iso_datetime

CATEGORY_ENUM_MESSAGE = (
    "category must be one of the following values: work, sleep, leisure, exercise, other"
)
INVALID_RANGE_MESSAGE = "start_time debe ser anterior a end_time."


class TimeBlockCategory(str, Enum):
    WORK = "work"
    SLEEP = "sleep"
    LEISURE = "leisure"
    EXERCISE = "exercise"
    OTHER = "other"


def _fail(code: str, message: str) -> PydanticCustomError:
    return PydanticCustomError(code, message)


def parse_strict_iso(v: Any) -> dt.datetime | None:
    """`@IsDateString({ strict: true })`: `None` si el valor no es parseable."""
    if not (isinstance(v, str) and _ISO_8601.match(v)):
        return None
    try:
        return parse_iso_datetime(v)
    except ValueError:
        return None


def _datetime(field: str):
    def validate(v: Any) -> dt.datetime:
        parsed = parse_strict_iso(v)
        if parsed is None:
            raise _fail(f"{field}_iso", f"{field} must be a valid ISO 8601 date string")
        return parsed

    return validate


def _optional(validator):
    return lambda v: None if v is None else validator(v)


_MINUTES_INVALID = ("minutes_invalid", "actual_duration_minutes must be an integer number")
# (negativo, entero) -> error; un número no negativo y entero es válido.
_MINUTES_ERRORS = {
    (True, False): _MINUTES_INVALID,
    (True, True): ("minutes_min", "actual_duration_minutes must not be less than 0"),
    (False, False): ("minutes_int", "actual_duration_minutes must be an integer number"),
}


def _minutes(v: Any) -> int:
    """`@IsInt()` + `@Min(0)`. Un valor que falla ambos usa `minutes_invalid` (ver `app/errors.py`)."""
    n = as_number(v)
    if n is None:
        raise _fail(*_MINUTES_INVALID)
    key = (n < 0, float(n).is_integer())
    if key == (False, True):
        return int(n)
    raise _fail(*_MINUTES_ERRORS[key])


def _category(v: Any) -> TimeBlockCategory:
    if isinstance(v, str):
        try:
            return TimeBlockCategory(v)
        except ValueError:
            pass
    raise _fail("category_enum", CATEGORY_ENUM_MESSAGE)


def _task_id(v: Any) -> str:
    if not is_uuid(v):
        raise _fail("task_id_uuid", "task_id must be a UUID")
    return v


def _is_completed(v: Any) -> bool:
    if not isinstance(v, bool):
        raise _fail("is_completed_bool", "is_completed must be a boolean value")
    return v


_start_time = _datetime("start_time")
_end_time = _datetime("end_time")


class TimeBlockCreateRequest(BaseModel):
    """`CreateTimeBlockDTO` — cuerpo de `POST /api/schedule`. `user_id` sale del JWT."""

    model_config = ConfigDict(extra="forbid")

    title: Any
    description: Any = None
    start_time: Any
    end_time: Any
    actual_duration_minutes: Any = None
    category: Any = None
    task_id: Any = None
    is_completed: Any = None

    _v_title = field_validator("title")(lambda cls, v: _title(v))
    _v_description = field_validator("description")(lambda cls, v: _task_description(v))
    _v_start = field_validator("start_time")(lambda cls, v: _start_time(v))
    _v_end = field_validator("end_time")(lambda cls, v: _end_time(v))
    _v_minutes = field_validator("actual_duration_minutes")(lambda cls, v: _optional(_minutes)(v))
    _v_category = field_validator("category")(lambda cls, v: _optional(_category)(v))
    _v_task_id = field_validator("task_id")(lambda cls, v: _optional(_task_id)(v))
    _v_completed = field_validator("is_completed")(lambda cls, v: _optional(_is_completed)(v))


class TimeBlockUpdateRequest(BaseModel):
    """`UpdateTimeBlockDTO` — cuerpo de `PATCH /api/schedule/{id}`.

    Edición parcial: solo se aplican los campos presentes en el payload
    (`model_fields_set`). `description`/`task_id` en `null` los eliminan.
    """

    model_config = ConfigDict(extra="forbid")

    title: Any = None
    description: Any = None
    start_time: Any = None
    end_time: Any = None
    actual_duration_minutes: Any = None
    category: Any = None
    task_id: Any = None
    is_completed: Any = None

    _v_title = field_validator("title")(lambda cls, v: _optional(_title)(v))
    _v_description = field_validator("description")(lambda cls, v: _task_description(v))
    _v_start = field_validator("start_time")(lambda cls, v: _optional(_start_time)(v))
    _v_end = field_validator("end_time")(lambda cls, v: _optional(_end_time)(v))
    _v_minutes = field_validator("actual_duration_minutes")(lambda cls, v: _optional(_minutes)(v))
    _v_category = field_validator("category")(lambda cls, v: _optional(_category)(v))
    _v_task_id = field_validator("task_id")(lambda cls, v: _optional(_task_id)(v))
    _v_completed = field_validator("is_completed")(lambda cls, v: _optional(_is_completed)(v))


class ScheduleRange(BaseModel):
    """Query params opcionales de `GET /api/schedule` (rango de superposición)."""

    start: dt.datetime | None = None
    end: dt.datetime | None = None


class TimeBlock(BaseModel):
    """`TimeBlock` — respuesta de las rutas del Cronograma."""

    model_config = ConfigDict(extra="forbid")

    id: str
    title: str
    description: str | None
    start_time: str
    end_time: str
    actual_duration_minutes: int
    category: TimeBlockCategory
    task_id: str | None
    is_completed: bool
    user_id: str
