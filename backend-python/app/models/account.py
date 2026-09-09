"""ORM de la tabla `accounts` (definida en init.sql, raíz del repo).

Equivalente a `src/accounts/account.entity.ts` del Backend A. No altera el
esquema.
"""
from __future__ import annotations

import datetime as dt
import decimal
import uuid

from sqlalchemy import Boolean, DateTime, Numeric, String, func
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True),
        primary_key=True,
        server_default=func.gen_random_uuid(),
    )
    user_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    balance: Mapped[decimal.Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    # Borrado lógico: DELETE /api/accounts/{id} marca is_active=False en lugar
    # de eliminar la fila (preserva integridad referencial con transacciones).
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )
