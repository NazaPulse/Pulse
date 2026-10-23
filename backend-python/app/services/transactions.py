"""Lógica de Transacciones. Réplica exacta de
`src/transactions/transactions.service.ts` (Backend A): aislamiento por
usuario y lógica de doble impacto dentro de una única transacción de base de
datos (commit si todo sale bien, rollback ante cualquier error).
"""
from __future__ import annotations

import decimal
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.schemas.transaction import Transaction as TransactionSchema
from app.schemas.transaction import (
    TransactionCreateRequest,
    TransactionFilters,
    TransactionType,
    parse_iso_datetime,
)
from app.services.accounts import _iso_z

NOT_FOUND_MESSAGE = "Recurso no encontrado."
INSUFFICIENT_FUNDS_MESSAGE = "Saldo insuficiente en la cuenta"

_CENT = decimal.Decimal("0.01")


def _to_response(tx: Transaction) -> TransactionSchema:
    return TransactionSchema(
        id=str(tx.id),
        amount=float(tx.amount),
        type=TransactionType(tx.type),
        account_id=str(tx.account_id),
        category_id=str(tx.category_id) if tx.category_id is not None else None,
        date=_iso_z(tx.date),
        description=tx.description,
        created_at=_iso_z(tx.created_at),
        updated_at=_iso_z(tx.updated_at),
    )


def _apply_impact(account: Account, dto: TransactionCreateRequest) -> decimal.Decimal:
    """Ajusta el saldo de la cuenta y devuelve el monto a persistir. Un egreso
    sin saldo suficiente responde `400` antes de tocar la cuenta."""
    # Node compara el saldo contra el monto sin redondear y deja que
    # PostgreSQL (NUMERIC(14,2), half-up) redondee al persistir.
    raw_amount = decimal.Decimal(str(dto.amount))
    amount = raw_amount.quantize(_CENT, rounding=decimal.ROUND_HALF_UP)
    balance = decimal.Decimal(account.balance)
    if dto.type != TransactionType.EXPENSE:
        account.balance = balance + amount
        return amount
    if balance < raw_amount:
        raise HTTPException(status_code=400, detail=INSUFFICIENT_FUNDS_MESSAGE)
    account.balance = balance - amount
    return amount


def list_for_user(
    db: Session, user_id: uuid.UUID, filters: TransactionFilters
) -> list[TransactionSchema]:
    stmt = select(Transaction).where(Transaction.user_id == user_id)
    if filters.account_id is not None:
        stmt = stmt.where(Transaction.account_id == filters.account_id)
    if filters.category_id is not None:
        stmt = stmt.where(Transaction.category_id == filters.category_id)
    if filters.type is not None:
        stmt = stmt.where(Transaction.type == filters.type.value)
    stmt = stmt.order_by(Transaction.date.desc(), Transaction.created_at.desc())
    return [_to_response(row) for row in db.scalars(stmt).all()]


def create(
    db: Session, user_id: uuid.UUID, dto: TransactionCreateRequest
) -> TransactionSchema:
    """Lógica de doble impacto (Issue #14). Validar la cuenta (con lock de
    fila `FOR UPDATE` para evitar carreras sobre `balance`), validar la
    categoría, ajustar el saldo e insertar el movimiento ocurren en la
    misma transacción. Ante cualquier error se hace `rollback()` y la
    cuenta no cambia.

    La "ejecución" de cada sobre no tiene columna propia en `categories`:
    se deriva de la suma de sus egresos (ver `FinancesService`), por lo que
    queda consistente al confirmarse este mismo INSERT.
    """
    try:
        tx = _stage_transaction(db, user_id, dto)
        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(tx)
    return _to_response(tx)


def _stage_transaction(
    db: Session, user_id: uuid.UUID, dto: TransactionCreateRequest
) -> Transaction:
    """Pasos de `create` dentro de la transacción abierta. No hace commit:
    `create` confirma o revierte todo junto."""
    account = _lock_account(db, user_id, dto.account_id)
    category_id = _owned_category_id(db, user_id, dto.category_id)
    amount = _apply_impact(account, dto)
    tx = Transaction(
        user_id=user_id,
        account_id=account.id,
        category_id=category_id,
        amount=amount,
        type=dto.type.value,
        date=parse_iso_datetime(dto.date),
        description=dto.description,
    )
    db.add(tx)
    return tx


def _lock_account(db: Session, user_id: uuid.UUID, account_id: str) -> Account:
    """Cuenta activa del usuario con lock de fila `FOR UPDATE`; `404` si no."""
    account = db.scalar(
        select(Account)
        .where(
            Account.id == uuid.UUID(account_id),
            Account.user_id == user_id,
            Account.is_active.is_(True),
        )
        .with_for_update()
    )
    if account is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
    return account


def _owned_category_id(
    db: Session, user_id: uuid.UUID, category_id: str | None
) -> uuid.UUID | None:
    """`None` si no se envió categoría; `404` si no existe o es de otro usuario."""
    if category_id is None:
        return None
    category = db.scalar(
        select(Category).where(
            Category.id == uuid.UUID(category_id),
            Category.user_id == user_id,
        )
    )
    if category is None:
        raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
    return category.id
