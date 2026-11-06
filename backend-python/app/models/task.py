"""ORM de la tabla `tasks` (Módulo de Productividad, Issue #19).

Equivalente a `src/tasks/task.entity.ts` del Backend A. No altera el esquema.
"""
from __future__ import annotations

import datetime as dt

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import OwnedRecord, tz_datetime_column


class Task(OwnedRecord):
    __tablename__ = "tasks"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, server_default="medium")
    status: Mapped[str] = mapped_column(String(20), nullable=False, server_default="pending")
    due_date: Mapped[dt.datetime | None] = tz_datetime_column(nullable=True)
    estimated_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
