"""Esquemas Pydantic. Espejo 1:1 de los `components.schemas` de openapi.yaml
y de los DTOs del Backend A (`src/auth/dto/*.ts`).
"""
from __future__ import annotations

from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """`RegisterRequest` — cuerpo de `POST /api/auth/register`.

    `extra="forbid"` reproduce `additionalProperties: false` (equivalente al
    `whitelist + forbidNonWhitelisted` del ValidationPipe de NestJS).
    """

    model_config = ConfigDict(extra="forbid")

    email: Annotated[EmailStr, Field(max_length=255)]
    password: Annotated[str, Field(min_length=12, max_length=128)]
    full_name: Annotated[str | None, Field(max_length=255)] = None


class LoginRequest(BaseModel):
    """`LoginRequest` — cuerpo de `POST /api/auth/login`."""

    model_config = ConfigDict(extra="forbid")

    email: Annotated[EmailStr, Field(max_length=255)]
    password: Annotated[str, Field(min_length=1, max_length=128)]


class UserPublic(BaseModel):
    """`UserPublic` — respuesta `201` de register. NUNCA expone `password_hash`."""

    model_config = ConfigDict(extra="forbid")

    id: str
    email: EmailStr
    full_name: str | None = None
    created_at: str
    updated_at: str


class LoginResponse(BaseModel):
    """`LoginResponse` — respuesta `200` de login: `{ "access_token": "string" }`."""

    model_config = ConfigDict(extra="forbid")

    access_token: str


class ErrorResponse(BaseModel):
    """`ErrorResponse` — formato de error uniforme (idéntico al de NestJS)."""

    statusCode: int
    error: str
    message: str | list[str]
