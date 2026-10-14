"""Lógica de autenticación. Réplica exacta de `src/auth/auth.service.ts` (Backend A):
RF-01 registro y RF-02 login, con los mismos mensajes, códigos y efectos.
"""
from __future__ import annotations

import datetime as dt
import logging

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest, UserPublic
from app.services.hashing import hasher
from app.services.users import users_service

logger = logging.getLogger("pulse.auth")

PG_UNIQUE_VIOLATION = "23505"
EMAIL_TAKEN_MESSAGE = "El email ya se encuentra registrado."
INVALID_CREDENTIALS_MESSAGE = "Credenciales inválidas."


def _iso_z(value: dt.datetime) -> str:
    """Formato ISO-8601 con milisegundos y sufijo `Z` (igual que `Date.toISOString()`)."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=dt.timezone.utc)
    value = value.astimezone(dt.timezone.utc)
    return value.strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


def _to_public(user: User) -> UserPublic:
    return UserPublic(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        created_at=_iso_z(user.created_at),
        updated_at=_iso_z(user.updated_at),
    )


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _invalid_credentials() -> HTTPException:
    return HTTPException(status_code=401, detail=INVALID_CREDENTIALS_MESSAGE)


def _is_unique_violation(exc: IntegrityError) -> bool:
    return getattr(getattr(exc, "orig", None), "pgcode", None) == PG_UNIQUE_VIOLATION


def _equalize_timing(password: str) -> None:
    """Igual coste aproximado que una verificación real (no filtrar por tiempo)."""
    try:
        hasher.hash(password)
    except Exception:  # noqa: BLE001
        pass


class AuthService:
    def register(self, db: Session, dto: RegisterRequest) -> UserPublic:
        """RF-01 — `201` con UserPublic; `400` si el email existe o el payload es inválido."""
        email = _normalize_email(dto.email)
        if users_service.exists_by_email(db, email):
            raise HTTPException(status_code=400, detail=EMAIL_TAKEN_MESSAGE)
        user = self._create_user(db, email, hasher.hash(dto.password), dto.full_name)
        return _to_public(user)

    def login(self, db: Session, dto: LoginRequest) -> LoginResponse:
        """RF-02 — `200` con `{ access_token }`; `401` genérico en cualquier otro caso."""
        user = self._authenticate(db, dto)
        self._rehash_if_needed(db, user, dto.password)
        token = create_access_token(sub=str(user.id), email=user.email)
        return LoginResponse(access_token=token)

    def _create_user(
        self, db: Session, email: str, password_hash: str, full_name: str | None
    ) -> User:
        try:
            return users_service.create(
                db, email=email, password_hash=password_hash, full_name=full_name
            )
        except IntegrityError as exc:  # carrera con la constraint UNIQUE
            db.rollback()
            if _is_unique_violation(exc):
                raise HTTPException(status_code=400, detail=EMAIL_TAKEN_MESSAGE) from exc
            raise

    def _authenticate(self, db: Session, dto: LoginRequest) -> User:
        user = users_service.get_by_email(db, _normalize_email(dto.email))
        if user is None:
            _equalize_timing(dto.password)
            raise _invalid_credentials()
        if not hasher.verify(user.password_hash, dto.password):
            raise _invalid_credentials()
        return user

    def _rehash_if_needed(self, db: Session, user: User, password: str) -> None:
        """Rehash transparente si los parámetros almacenados quedaron por debajo
        de la política vigente (openapi.yaml · "rehash on login")."""
        if not hasher.needs_rehash(user.password_hash):
            return
        try:
            users_service.update_password_hash(db, user.id, hasher.hash(password))
        except Exception as exc:  # noqa: BLE001
            logger.warning("No se pudo re-hashear al usuario %s: %s", user.id, exc)


auth_service = AuthService()
