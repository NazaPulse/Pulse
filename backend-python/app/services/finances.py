"""Resumen financiero. Réplica exacta de `src/finances/finances.service.ts`
(Backend A): todas las consultas filtran por `user_id`; `by_category` agrupa
solo egresos y calcula el porcentaje sobre `total_expenses`.
"""
from __future__ import annotations

import uuid
from collections.abc import Sequence

from sqlalchemy import Row, and_, func, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import CategorySummary, FinancesSummary, TransactionType


def _round2(value: float) -> float:
    return round(value * 100) / 100


def _percentage(amount: float, total_expenses: float) -> float:
    return _round2(amount / total_expenses * 100) if total_expenses > 0 else 0


def _sum_of_type(tx_type: TransactionType):
    return func.coalesce(func.sum(Transaction.amount).filter(Transaction.type == tx_type.value), 0)


def _to_category_summary(row: Row, total_expenses: float) -> CategorySummary:
    category_id, name, icon, color, amount = row
    amount_f = float(amount)
    return CategorySummary(
        category_id=str(category_id),
        category_name=name,
        # `color`/`icon` son nullable en init.sql; igual que el
        # Backend A, se devuelven como '' (string no-nulo).
        icon=icon or "",
        color=color or "",
        total_amount=amount_f,
        percentage=_percentage(amount_f, total_expenses),
    )


def get_summary(db: Session, user_id: uuid.UUID) -> FinancesSummary:
    total_balance = _total_balance(db, user_id)
    total_income, total_expenses = _income_and_expenses(db, user_id)
    rows = _expenses_by_category(db, user_id)
    return FinancesSummary(
        total_balance=total_balance,
        total_income=total_income,
        total_expenses=total_expenses,
        by_category=[_to_category_summary(row, total_expenses) for row in rows],
    )


def _total_balance(db: Session, user_id: uuid.UUID) -> float:
    total_balance = db.scalar(
        select(func.coalesce(func.sum(Account.balance), 0)).where(
            Account.user_id == user_id, Account.is_active.is_(True)
        )
    )
    return float(total_balance or 0)


def _income_and_expenses(db: Session, user_id: uuid.UUID) -> tuple[float, float]:
    totals = db.execute(
        select(
            _sum_of_type(TransactionType.INCOME),
            _sum_of_type(TransactionType.EXPENSE),
        ).where(Transaction.user_id == user_id)
    ).one()
    return float(totals[0]), float(totals[1])


def _expenses_by_category(db: Session, user_id: uuid.UUID) -> Sequence[Row]:
    """Solo egresos, agrupados por sobre y ordenados de mayor a menor."""
    total_amount = func.sum(Transaction.amount).label("total_amount")
    return db.execute(
        select(Category.id, Category.name, Category.icon, Category.color, total_amount)
        .join(
            Category,
            and_(
                Category.id == Transaction.category_id,
                Category.user_id == Transaction.user_id,
            ),
        )
        .where(
            Transaction.user_id == user_id,
            Transaction.type == TransactionType.EXPENSE.value,
        )
        .group_by(Category.id, Category.name, Category.icon, Category.color)
        .order_by(total_amount.desc())
    ).all()
