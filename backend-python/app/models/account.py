"""ORM de la tabla `accounts` (definida en init.sql, raíz del repo).

Equivalente a `src/accounts/account.entity.ts` del Backend A. No altera el
esquema.
"""
from __future__ import annotations

import decimal

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import OwnedRecord, money_column


class Account(OwnedRecord):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(50), nullable=False)
    balance: Mapped[decimal.Decimal] = money_column(nullable=False, server_default="0")
    # borrado lógico: el DELETE marca `is_active=False` en lugar de eliminar la fila
    # (preserva integridad referencial con transacciones).
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
