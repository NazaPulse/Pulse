"""ORM de la tabla `categories` (definida en init.sql, raíz del repo).

Equivalente a `src/categories/category.entity.ts` del Backend A. No altera
el esquema.

`target_amount` (openapi.yaml) se persiste en la columna `monthly_limit`
(nombre histórico de la tabla, Issue #1); `icon` se agregó a init.sql en la
Issue #8 para poder cumplir el contrato publicado en la Issue #7.
"""
from __future__ import annotations

import datetime as dt
import decimal
import uuid

from sqlalchemy import DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_amount: Mapped[decimal.Decimal] = mapped_column(
        "monthly_limit", Numeric(14, 2), nullable=False, server_default="0"
    )
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
