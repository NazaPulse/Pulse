"""Capa de acceso a datos de `users`. Espejo de `src/users/users.service.ts`."""
from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.models.user import User


class UsersService:
    def get_by_email(self, db: Session, email: str) -> User | None:
        return db.scalar(select(User).where(User.email == email))

    def exists_by_email(self, db: Session, email: str) -> bool:
        return db.scalar(
            select(func.count()).select_from(User).where(User.email == email)
        ) > 0

    def create(
        self, db: Session, *, email: str, password_hash: str, full_name: str | None
    ) -> User:
        user = User(email=email, password_hash=password_hash, full_name=full_name)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_password_hash(
        self, db: Session, user_id: uuid.UUID, password_hash: str
    ) -> None:
        db.execute(
            update(User).where(User.id == user_id).values(password_hash=password_hash)
        )
        db.commit()


users_service = UsersService()
