"""Columnas comunes de las tablas (init.sql) como mixins declarativos."""
from __future__ import annotations

import datetime as dt
import uuid

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


def tz_datetime_column(**kwargs):
    """`TIMESTAMPTZ` de init.sql."""
    return mapped_column(DateTime(timezone=True), **kwargs)


def money_column(*args, **kwargs):
    """`NUMERIC(14, 2)` de init.sql (montos y saldos)."""
    return mapped_column(*args, Numeric(14, 2), **kwargs)


def uuid_column(references: str | None = None, ondelete: str | None = None, **kwargs):
    """`UUID`, opcionalmente clave foránea a `references` (`tabla.columna`)."""
    foreign = (ForeignKey(references, ondelete=ondelete),) if references else ()
    return mapped_column(PGUUID(as_uuid=True), *foreign, **kwargs)


class IdMixin:
    """`id` UUID generado por la base (`gen_random_uuid()`)."""

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )


class OwnedMixin:
    """Registro de un usuario (`user_id`): toda consulta debe filtrar por él."""

    user_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)


class TimestampMixin:
    """Marcas de creación y de última edición."""

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )


class OwnedRecord(IdMixin, OwnedMixin, TimestampMixin, Base):
    """Base abstracta de las tablas con dueño: `id`, `user_id` y marcas de tiempo."""

    __abstract__ = True
