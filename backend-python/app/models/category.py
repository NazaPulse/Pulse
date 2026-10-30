"""ORM de la tabla `categories` (definida en init.sql, raíz del repo).

Equivalente a `src/categories/category.entity.ts` del Backend A. No altera
el esquema.

`target_amount` (openapi.yaml) se persiste en la columna `monthly_limit`
(nombre histórico de la tabla, Issue #1); `icon` se agregó a init.sql en la
Issue #8 para poder cumplir el contrato publicado en la Issue #7.
"""
from __future__ import annotations

import decimal

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import OwnedRecord, money_column


class Category(OwnedRecord):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    target_amount: Mapped[decimal.Decimal] = money_column("monthly_limit", nullable=False, server_default="0")
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
