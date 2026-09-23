"""Esquemas Pydantic del Módulo de Finanzas. Espejo 1:1 de los
`components.schemas` de openapi.yaml y de los DTOs del Backend A
(`src/accounts/dto/*.ts`, `src/categories/dto/*.ts`) — mismos nombres de
propiedad en el JSON, para paridad exacta entre ambos backends.
"""
from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, ConfigDict, Field

HEX_COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}$"


class AccountType(str, Enum):
    BANK = "bank"
    WALLET = "wallet"
    CASH = "cash"


class AccountCreateRequest(BaseModel):
    """`AccountCreateRequest` — cuerpo de `POST /api/accounts`."""

    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(max_length=100)]
    type: AccountType
    initial_balance: float = 0


class AccountUpdateRequest(BaseModel):
    """`AccountUpdateRequest` — cuerpo de `PUT /api/accounts/{id}`.

    Reemplaza `name`/`type`. `balance` no es editable manualmente (se
    recalcula a partir de las transacciones asociadas).
    """

    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(max_length=100)]
    type: AccountType


class Account(BaseModel):
    """`Account` — respuesta de las rutas de Cuentas."""

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    type: AccountType
    balance: float
    created_at: str
    updated_at: str


class CategoryCreateRequest(BaseModel):
    """`CategoryCreateRequest` — cuerpo de `POST /api/categories`."""

    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(max_length=100)]
    target_amount: float
    color: Annotated[str | None, Field(pattern=HEX_COLOR_PATTERN)] = None
    icon: Annotated[str | None, Field(max_length=50)] = None


class CategoryUpdateRequest(BaseModel):
    """`CategoryUpdateRequest` — cuerpo de `PUT /api/categories/{id}`.
    Reemplazo total: todos los campos son requeridos.
    """

    model_config = ConfigDict(extra="forbid")

    name: Annotated[str, Field(max_length=100)]
    target_amount: float
    color: Annotated[str, Field(pattern=HEX_COLOR_PATTERN)]
    icon: Annotated[str, Field(max_length=50)]


class Category(BaseModel):
    """`Category` — respuesta de las rutas de Categorías/Sobres. `color`/
    `icon` son requeridos y no-nulos (el servicio aplica valores por defecto
    cuando el cliente no los envía al crear)."""

    model_config = ConfigDict(extra="forbid")

    id: str
    name: str
    target_amount: float
    color: str
    icon: str
    created_at: str
    updated_at: str
