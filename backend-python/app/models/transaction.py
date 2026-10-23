"""ORM de la tabla `transactions` (init.sql, raíz del repo).

Equivalente a `src/transactions/transaction.entity.ts` del Backend A. No
altera el esquema. `amount` es siempre positivo; el signo del impacto sobre
la cuenta lo determina `type`.
"""
from __future__ import annotations

import datetime as dt
import decimal
import uuid

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.base import IdMixin, OwnedMixin, TimestampMixin
from app.models.account import Account
from app.models.category import Category


class Transaction(IdMixin, OwnedMixin, TimestampMixin, Base):
    __tablename__ = "transactions"

    account_id: Mapped[uuid.UUID] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("accounts.id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        PGUUID(as_uuid=True), ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[decimal.Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    date: Mapped[dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)

    account: Mapped[Account] = relationship(Account)
    category: Mapped[Category | None] = relationship(Category)
