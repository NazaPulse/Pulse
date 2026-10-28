"""ORM de la tabla `time_blocks` (Cronograma diario, Issue #23).

Equivalente a `src/models/time-block.entity.ts` del Backend A. No altera el esquema.
"""
from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import Boolean, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import IdMixin, OwnedMixin, TimestampMixin


class TimeBlock(IdMixin, OwnedMixin, TimestampMixin, Base):
    __tablename__ = "time_blocks"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    start_time: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    end_time: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    actual_duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    category: Mapped[str] = mapped_column(String(20), nullable=False, server_default="other")
    task_id: Mapped[uuid.UUID | None] = mapped_column(PGUUID(as_uuid=True), nullable=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
