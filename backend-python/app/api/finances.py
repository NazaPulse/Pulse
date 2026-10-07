"""Resumen financiero (Issue #14). Ruta idéntica a openapi.yaml y al Backend
A: `/api/finances/summary`. Requiere JWT (`bearerAuth`).
"""
from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.transaction import FinancesSummary
from app.services.finances import finances_service

router = APIRouter(prefix="/api/finances", tags=["Finances"])


@router.get(
    "/summary",
    response_model=FinancesSummary,
    summary="Obtener el resumen financiero del usuario autenticado",
    operation_id="getFinancesSummary",
    responses={401: {"model": ErrorResponse}},
)
def get_summary(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> FinancesSummary:
    return finances_service.get_summary(db, current_user.id)
