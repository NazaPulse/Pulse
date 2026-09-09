"""Lógica de Categorías/Sobres. Réplica exacta de
`src/categories/categories.service.ts` (Backend A): aislamiento por
usuario, defaults de `color`/`icon`, borrado físico.
"""
from __future__ import annotations

import datetime as dt
import uuid

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.schemas.finance import Category as CategorySchema
from app.schemas.finance import CategoryCreateRequest, CategoryUpdateRequest

NOT_FOUND_MESSAGE = "Recurso no encontrado."

# `color`/`icon` son opcionales en CategoryCreateRequest pero requeridos y
# no-nulos en la respuesta `Category` (openapi.yaml): se aplican estos
# valores por defecto cuando el cliente no los envía.
DEFAULT_COLOR = "#6B7280"
DEFAULT_ICON = "tag"


def _iso_z(value: dt.datetime) -> str:
    """Formato ISO-8601 con milisegundos y sufijo `Z` (igual que `Date.toISOString()`)."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    value = value.astimezone(dt.timezone.utc)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


def _to_response(category: Category) -> CategorySchema:
    return CategorySchema(
        id=str(category.id),
        name=category.name,
        target_amount=float(category.target_amount),
        color=category.color or "",
        icon=category.icon or "",
        created_at=_iso_z(category.created_at),
        updated_at=_iso_z(category.updated_at),
    )


class CategoriesService:
    def list_for_user(self, db: Session, user_id: uuid.UUID) -> list[CategorySchema]:
        rows = db.scalars(
            select(Category)
            .where(Category.user_id == user_id)
            .order_by(Category.created_at.asc())
        ).all()
        return [_to_response(row) for row in rows]

    def create(
        self, db: Session, user_id: uuid.UUID, dto: CategoryCreateRequest
    ) -> CategorySchema:
        category = Category(
            user_id=user_id,
            name=dto.name,
            target_amount=dto.target_amount,
            color=dto.color or DEFAULT_COLOR,
            icon=dto.icon or DEFAULT_ICON,
        )
        db.add(category)
        db.commit()
        db.refresh(category)
        return _to_response(category)

    def get_for_user(
        self, db: Session, user_id: uuid.UUID, category_id: str
    ) -> CategorySchema:
        category = self._find_owned_or_fail(db, user_id, category_id)
        return _to_response(category)

    def update(
        self,
        db: Session,
        user_id: uuid.UUID,
        category_id: str,
        dto: CategoryUpdateRequest,
    ) -> CategorySchema:
        category = self._find_owned_or_fail(db, user_id, category_id)
        category.name = dto.name
        category.target_amount = dto.target_amount
        category.color = dto.color
        category.icon = dto.icon
        db.commit()
        db.refresh(category)
        return _to_response(category)

    def remove(self, db: Session, user_id: uuid.UUID, category_id: str) -> None:
        category = self._find_owned_or_fail(db, user_id, category_id)
        db.delete(category)
        db.commit()

    def _find_owned_or_fail(
        self, db: Session, user_id: uuid.UUID, category_id: str
    ) -> Category:
        """Aislamiento por usuario: cualquier operación por `id` filtra siempre
        por `user_id`. Un `id` de otro usuario (o inexistente, o con formato
        inválido) responde `404` — nunca revela si el recurso existe para
        otro usuario."""
        try:
            category_uuid = uuid.UUID(str(category_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE) from exc

        category = db.scalar(
            select(Category).where(
                Category.id == category_uuid, Category.user_id == user_id
            )
        )
        if category is None:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
        return category


categories_service = CategoriesService()
