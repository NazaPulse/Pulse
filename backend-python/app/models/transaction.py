"""ORM de la tabla `transactions` (init.sql, raíz del repo).

Equivalente a `src/transactions/transaction.entity.ts` del Backend A. No
altera el esquema. `amount` es siempre positivo; el signo del impacto sobre
la cuenta lo determina `type`.
"""
from __future__ import annotations

import datetime as dt
import decimal
import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import OwnedRecord, money_column, tz_datetime_column, uuid_column
from app.models.account import Account
from app.models.category import Category


# Claves foráneas (tabla.columna, ON DELETE) de init.sql.
_ACCOUNT_FK = ("accounts.id", "CASCADE")
_CATEGORY_FK = ("categories.id", "SET NULL")


class Transaction(OwnedRecord):
    __tablename__ = "transactions"

    account_id: Mapped[uuid.UUID] = uuid_column(*_ACCOUNT_FK, nullable=False)
    category_id: Mapped[uuid.UUID | None] = uuid_column(*_CATEGORY_FK, nullable=True)
    amount: Mapped[decimal.Decimal] = money_column(nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[dt.datetime] = tz_datetime_column(nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    account: Mapped[Account] = relationship(Account)
    category: Mapped[Category | None] = relationship(Category)
