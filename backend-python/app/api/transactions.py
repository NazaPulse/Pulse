"""Controlador de Transacciones (Issue #14). Rutas idénticas a openapi.yaml y
al Backend A: `/api/transactions`. Todas requieren JWT (`bearerAuth`) y
filtran obligatoriamente por el usuario autenticado.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.api.query_params import (
    enum_messages,
    parse_optional,
    raise_if_invalid,
    unknown_param_messages,
    uuid_messages,
)
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.transaction import (
    TYPE_ENUM_MESSAGE,
    Transaction,
    TransactionCreateRequest,
    TransactionFilters,
    TransactionType,
)
from app.services import transactions as transactions_service

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

_ALLOWED_FILTERS = ("account_id", "category_id", "type")


def get_filters(
    request: Request,
    account_id: str | None = Query(default=None),
    category_id: str | None = Query(default=None),
    type: str | None = Query(default=None),
) -> TransactionFilters:
    """Valida los query params con los mismos mensajes que
    `ListTransactionsQueryDto` + `ValidationPipe(forbidNonWhitelisted)` de Node."""
    raise_if_invalid(
        unknown_param_messages(request, _ALLOWED_FILTERS)
        + uuid_messages("account_id", account_id)
        + uuid_messages("category_id", category_id)
        + enum_messages(type, TransactionType, TYPE_ENUM_MESSAGE)
    )
    return TransactionFilters(
        account_id=parse_optional(account_id, uuid.UUID),
        category_id=parse_optional(category_id, uuid.UUID),
        type=parse_optional(type, TransactionType),
    )


@router.get(
    "",
    response_model=list[Transaction],
    summary="Listar el historial de transacciones del usuario autenticado",
    operation_id="listTransactions",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def list_transactions(
    current_user: CurrentUser = Depends(get_current_user),
    filters: TransactionFilters = Depends(get_filters),
    db: Session = Depends(get_db),
) -> list[Transaction]:
    return transactions_service.list_for_user(db, current_user.id, filters)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Transaction,
    summary="Registrar un movimiento de dinero",
    operation_id="createTransaction",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def create_transaction(
    dto: TransactionCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Transaction:
    return transactions_service.create(db, current_user.id, dto)
