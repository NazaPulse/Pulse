"""Controlador de Cuentas financieras (Issue #9). Rutas idénticas a
openapi.yaml y al Backend A: `/api/accounts` y `/api/accounts/{id}`. Todas
requieren JWT (`bearerAuth`) y filtran obligatoriamente por el usuario
autenticado.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.finance import Account, AccountCreateRequest, AccountUpdateRequest
from app.services.accounts import accounts_service

router = APIRouter(prefix="/api/accounts", tags=["Accounts"])


@router.get(
    "",
    response_model=list[Account],
    summary="Listar las cuentas financieras del usuario autenticado",
    operation_id="listAccounts",
    responses={401: {"model": ErrorResponse}},
)
def list_accounts(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Account]:
    return accounts_service.list_for_user(db, current_user.id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Account,
    summary="Crear una nueva cuenta financiera",
    operation_id="createAccount",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def create_account(
    dto: AccountCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Account:
    return accounts_service.create(db, current_user.id, dto)


@router.get(
    "/{account_id}",
    response_model=Account,
    summary="Obtener una cuenta financiera por id",
    operation_id="getAccountById",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def get_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Account:
    return accounts_service.get_for_user(db, current_user.id, account_id)


@router.put(
    "/{account_id}",
    response_model=Account,
    summary="Actualizar una cuenta financiera existente",
    operation_id="updateAccount",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def update_account(
    account_id: str,
    dto: AccountUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Account:
    return accounts_service.update(db, current_user.id, account_id, dto)


@router.delete(
    "/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Eliminar una cuenta financiera",
    operation_id="deleteAccount",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_account(
    account_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    accounts_service.remove(db, current_user.id, account_id)
