"""Resumen financiero. Réplica exacta de `src/finances/finances.service.ts`
(Backend A): todas las consultas filtran por `user_id`; `by_category` agrupa
solo egresos y calcula el porcentaje sobre `total_expenses`.
"""
from __future__ import annotations

import uuid

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import CategorySummary, FinancesSummary, TransactionType


def _round2(value: float) -> float:
    return round(value * 100) / 100


class FinancesService:
    def get_summary(self, db: Session, user_id: uuid.UUID) -> FinancesSummary:
        total_balance = db.scalar(
            select(func.coalesce(func.sum(Account.balance), 0)).where(
                Account.user_id == user_id, Account.is_active.is_(True)
            )
        )

        totals = db.execute(
            select(
                func.coalesce(
                    func.sum(Transaction.amount).filter(
                        Transaction.type == TransactionType.INCOME.value
                    ),
                    0,
                ),
                func.coalesce(
                    func.sum(Transaction.amount).filter(
                        Transaction.type == TransactionType.EXPENSE.value
                    ),
                    0,
                ),
            ).where(Transaction.user_id == user_id)
        ).one()

        total_amount = func.sum(Transaction.amount).label("total_amount")
        category_rows = db.execute(
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

        total_income = float(totals[0])
        total_expenses = float(totals[1])

        by_category = []
        for category_id, name, icon, color, amount in category_rows:
            amount_f = float(amount)
            by_category.append(
                CategorySummary(
                    category_id=str(category_id),
                    category_name=name,
                    # `color`/`icon` son nullable en init.sql; igual que el
                    # Backend A, se devuelven como '' (string no-nulo).
                    icon=icon or "",
                    color=color or "",
                    total_amount=amount_f,
                    percentage=_round2(amount_f / total_expenses * 100) if total_expenses > 0 else 0,
                )
            )

        return FinancesSummary(
            total_balance=float(total_balance or 0),
            total_income=total_income,
            total_expenses=total_expenses,
            by_category=by_category,
        )


finances_service = FinancesService()
