"""ORM de la tabla `accounts` (definida en init.sql, raíz del repo).

Equivalente a `src/accounts/account.entity.ts` del Backend A. No altera el
esquema.
"""
from __future__ import annotations

import decimal

from sqlalchemy import Boolean, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base
from app.models.base import IdMixin, OwnedMixin, TimestampMixin


class Account(IdMixin, OwnedMixin, TimestampMixin, Base):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    balance: Mapped[decimal.Decimal] = mapped_column(
        Numeric(14, 2), nullable=False, server_default="0"
    )
    # Borrado lógico: DELETE /api/accounts/{id} marca is_active=False en lugar
    # de eliminar la fila (preserva integridad referencial con transacciones).
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
