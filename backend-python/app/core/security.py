"""Emisión de tokens JWT (PyJWT). Mismo contrato que `@nestjs/jwt` del Backend A:
firma HS256, claims `sub` + `email`, expiración de 3600 s (`iat`/`exp` incluidos).
"""
from __future__ import annotations

import datetime as dt

import jwt

from app.core.config import get_settings


def create_access_token(*, sub: str, email: str) -> str:
    s = get_settings()
    now = dt.datetime.now(tz=dt.timezone.utc)
    payload = {
        "sub": sub,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + dt.timedelta(seconds=s.jwt_expires_in_seconds)).timestamp()),
    }
    return jwt.encode(payload, s.jwt_secret, algorithm=s.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    """Verifica firma y expiración. Lanza `jwt.PyJWTError` si el token es
    inválido o expiró (capturado por `get_current_user` -> `401`)."""
    s = get_settings()
    return jwt.decode(token, s.jwt_secret, algorithms=[s.jwt_algorithm])
