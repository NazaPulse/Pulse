"""Controlador de Categorías/Sobres presupuestarios (Issue #9). Rutas
idénticas a openapi.yaml y al Backend A: `/api/categories` y
`/api/categories/{id}`. Todas requieren JWT (`bearerAuth`) y filtran
obligatoriamente por el usuario autenticado.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.finance import Category, CategoryCreateRequest, CategoryUpdateRequest
from app.services.categories import categories_service

router = APIRouter(prefix="/api/categories", tags=["Categories"])


@router.get(
    "",
    response_model=list[Category],
    summary="Listar las categorías/sobres del usuario autenticado",
    operation_id="listCategories",
    responses={401: {"model": ErrorResponse}},
)
def list_categories(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Category]:
    return categories_service.list_for_user(db, current_user.id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Category,
    summary="Crear una nueva categoría/sobre",
    operation_id="createCategory",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def create_category(
    dto: CategoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Category:
    return categories_service.create(db, current_user.id, dto)


@router.get(
    "/{category_id}",
    response_model=Category,
    summary="Obtener una categoría/sobre por id",
    operation_id="getCategoryById",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def get_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Category:
    return categories_service.get_for_user(db, current_user.id, category_id)


@router.put(
    "/{category_id}",
    response_model=Category,
    summary="Actualizar una categoría/sobre existente",
    operation_id="updateCategory",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def update_category(
    category_id: str,
    dto: CategoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Category:
    return categories_service.update(db, current_user.id, category_id, dto)


@router.delete(
    "/{category_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Eliminar una categoría/sobre",
    operation_id="deleteCategory",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_category(
    category_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    categories_service.remove(db, current_user.id, category_id)
