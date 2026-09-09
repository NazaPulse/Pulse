"""Dependencia de autenticación. Réplica de `JwtAuthGuard` (Backend A):
exige `Authorization: Bearer <access_token>` y expone el usuario autenticado
(`sub`/`email` del JWT). Cualquier token ausente, malformado o expirado
responde `401` con el mismo mensaje genérico.
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass

import jwt
from fastapi import HTTPException, Request

from app.core.security import decode_access_token

UNAUTHORIZED_MESSAGE = "Unauthorized"


@dataclass(frozen=True)
class CurrentUser:
    id: uuid.UUID
    email: str


def _extract_bearer_token(request: Request) -> str | None:
    header = request.headers.get("authorization")
    if not header:
        return None
    scheme, _, value = header.partition(" ")
    if scheme.lower() != "bearer" or not value:
        return None
    return value


def get_current_user(request: Request) -> CurrentUser:
    token = _extract_bearer_token(request)
    if not token:
        raise HTTPException(status_code=401, detail=UNAUTHORIZED_MESSAGE)

    try:
        payload = decode_access_token(token)
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=401, detail=UNAUTHORIZED_MESSAGE) from exc

    sub = payload.get("sub")
    email = payload.get("email")
    if not sub or not email:
        raise HTTPException(status_code=401, detail=UNAUTHORIZED_MESSAGE)

    try:
        user_id = uuid.UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=UNAUTHORIZED_MESSAGE) from exc

    return CurrentUser(id=user_id, email=email)
