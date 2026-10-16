"""Validación común de query params con el mismo fraseo que
`ValidationPipe(forbidNonWhitelisted)` + `class-validator` del Backend A."""
from __future__ import annotations

from collections.abc import Callable, Iterable
from enum import Enum
from typing import TypeVar

from fastapi import HTTPException, Request

from app.schemas.transaction import is_uuid

T = TypeVar("T")


def unknown_param_messages(request: Request, allowed: Iterable[str]) -> list[str]:
    """Node reporta primero las propiedades no declaradas (whitelist)."""
    return [
        f"property {key} should not exist"
        for key in request.query_params
        if key not in allowed
    ]


def uuid_messages(field: str, value: str | None) -> list[str]:
    if value is None or is_uuid(value):
        return []
    return [f"{field} must be a UUID"]


def enum_messages(value: str | None, enum_cls: type[Enum], message: str) -> list[str]:
    if value is None or value in {member.value for member in enum_cls}:
        return []
    return [message]


def raise_if_invalid(messages: list[str]) -> None:
    if messages:
        raise HTTPException(status_code=400, detail=messages)


def parse_optional(value: str | None, parser: Callable[[str], T]) -> T | None:
    return parser(value) if value else None
