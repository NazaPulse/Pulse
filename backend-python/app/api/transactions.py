"""Controlador de Transacciones (Issue #14). Rutas idénticas a openapi.yaml y
al Backend A: `/api/transactions`. Todas requieren JWT (`bearerAuth`) y
filtran obligatoriamente por el usuario autenticado.
"""
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.transaction import (
    TYPE_ENUM_MESSAGE,
    Transaction,
    TransactionCreateRequest,
    TransactionFilters,
    TransactionType,
    is_uuid,
)
from app.services.transactions import transactions_service

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
    # Node reporta primero las propiedades no declaradas (whitelist) y luego
    # los validadores de cada campo.
    messages: list[str] = [
        f"property {key} should not exist"
        for key in request.query_params
        if key not in _ALLOWED_FILTERS
    ]
    if account_id is not None and not is_uuid(account_id):
        messages.append("account_id must be a UUID")
    if category_id is not None and not is_uuid(category_id):
        messages.append("category_id must be a UUID")
    if type is not None and type not in {t.value for t in TransactionType}:
        messages.append(TYPE_ENUM_MESSAGE)
    if messages:
        raise HTTPException(status_code=400, detail=messages)

    return TransactionFilters(
        account_id=uuid.UUID(account_id) if account_id else None,
        category_id=uuid.UUID(category_id) if category_id else None,
        type=TransactionType(type) if type else None,
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
