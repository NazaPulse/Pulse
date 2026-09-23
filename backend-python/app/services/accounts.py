"""Lógica de Cuentas. Réplica exacta de `src/accounts/accounts.service.ts`
(Backend A): aislamiento por usuario, `balance` inicial = `initial_balance`,
borrado lógico (`is_active=False`).
"""
from __future__ import annotations

import datetime as dt
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.schemas.finance import Account as AccountSchema
from app.schemas.finance import AccountCreateRequest, AccountUpdateRequest

NOT_FOUND_MESSAGE = "Recurso no encontrado."


def _iso_z(value: dt.datetime) -> str:
    """Formato ISO-8601 con milisegundos y sufijo `Z` (igual que `Date.toISOString()`)."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    value = value.astimezone(dt.timezone.utc)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


def _to_response(account: Account) -> AccountSchema:
    return AccountSchema(
        id=str(account.id),
        name=account.name,
        type=account.type,
        balance=float(account.balance),
        created_at=_iso_z(account.created_at),
        updated_at=_iso_z(account.updated_at),
    )


class AccountsService:
    def list_for_user(self, db: Session, user_id: uuid.UUID) -> list[AccountSchema]:
        rows = db.scalars(
            select(Account)
            .where(Account.user_id == user_id, Account.is_active.is_(True))
            .order_by(Account.created_at.asc())
        ).all()
        return [_to_response(row) for row in rows]

    def create(
        self, db: Session, user_id: uuid.UUID, dto: AccountCreateRequest
    ) -> AccountSchema:
        account = Account(
            user_id=user_id,
            name=dto.name,
            type=dto.type.value,
            balance=dto.initial_balance,
        )
        db.add(account)
        db.commit()
        db.refresh(account)
        return _to_response(account)

    def get_for_user(self, db: Session, user_id: uuid.UUID, account_id: str) -> AccountSchema:
        account = self._find_owned_or_fail(db, user_id, account_id)
        return _to_response(account)

    def update(
        self,
        db: Session,
        user_id: uuid.UUID,
        account_id: str,
        dto: AccountUpdateRequest,
    ) -> AccountSchema:
        account = self._find_owned_or_fail(db, user_id, account_id)
        account.name = dto.name
        account.type = dto.type.value
        db.commit()
        db.refresh(account)
        return _to_response(account)

    def remove(self, db: Session, user_id: uuid.UUID, account_id: str) -> None:
        account = self._find_owned_or_fail(db, user_id, account_id)
        account.is_active = False
        db.commit()

    def _find_owned_or_fail(
        self, db: Session, user_id: uuid.UUID, account_id: str
    ) -> Account:
        """Aislamiento por usuario: cualquier operación por `id` filtra siempre
        por `user_id`. Un `id` de otro usuario (o inexistente, o con formato
        inválido) responde `404` — nunca revela si el recurso existe para
        otro usuario."""
        try:
            account_uuid = uuid.UUID(str(account_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE) from exc

        account = db.scalar(
            select(Account).where(
                Account.id == account_uuid,
                Account.user_id == user_id,
                Account.is_active.is_(True),
            )
        )
        if account is None:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
        return account


accounts_service = AccountsService()
