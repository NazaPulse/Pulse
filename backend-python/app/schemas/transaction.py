"""Esquemas Pydantic de Transacciones y Resumen Financiero (Issue #14).

Espejo 1:1 de `Transaction`, `TransactionCreateRequest`, `CategorySummary` y
`FinancesSummary` de openapi.yaml y de los DTOs del Backend A
(`src/transactions/dto/*.ts`, `src/finances/dto/*.ts`). Los mensajes de
validación reproducen el fraseo de `class-validator` para paridad exacta.
"""
from __future__ import annotations

import datetime as dt
import re
import uuid
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, field_validator, model_validator
from pydantic_core import PydanticCustomError

# Mismo criterio que `IsDateString` de class-validator: ISO-8601 con fecha
# completa y hora opcional (con o sin zona).
_ISO_8601 = re.compile(
    r"^\d{4}-\d{2}-\d{2}"
    r"(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$"
)

TYPE_ENUM_MESSAGE = "type must be one of the following values: income, expense"


class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"


def _fail(code: str, message: str) -> PydanticCustomError:
    return PydanticCustomError(code, message)


def is_uuid(value: Any) -> bool:
    if not isinstance(value, str):
        return False
    try:
        uuid.UUID(value)
    except ValueError:
        return False
    return True


def parse_iso_datetime(value: str) -> dt.datetime:
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=dt.timezone.utc)
    return parsed


class TransactionCreateRequest(BaseModel):
    """`TransactionCreateRequest` — cuerpo de `POST /api/transactions`.

    `category_id` es obligatorio si `type = expense` y opcional si
    `type = income`.
    """

    model_config = ConfigDict(extra="forbid")

    amount: Any
    type: Any
    account_id: Any
    category_id: Any = None
    date: Any
    description: Any = None

    @field_validator("amount")
    @classmethod
    def _amount(cls, v: Any) -> float:
        if isinstance(v, bool) or not isinstance(v, (int, float)):
            raise _fail("amount_number", "amount must be a number conforming to the specified constraints")
        if v <= 0:
            raise _fail("amount_positive", "amount must be greater than 0")
        return float(v)

    @field_validator("type")
    @classmethod
    def _type(cls, v: Any) -> TransactionType:
        try:
            return TransactionType(v)
        except ValueError as exc:
            raise _fail("type_enum", TYPE_ENUM_MESSAGE) from exc

    @field_validator("account_id")
    @classmethod
    def _account_id(cls, v: Any) -> str:
        if not is_uuid(v):
            raise _fail("account_id_uuid", "account_id must be a UUID")
        return v

    @field_validator("date")
    @classmethod
    def _date(cls, v: Any) -> str:
        if not isinstance(v, str) or not _ISO_8601.match(v):
            raise _fail("date_iso", "date must be a valid ISO 8601 date string")
        try:
            parse_iso_datetime(v)
        except ValueError as exc:
            raise _fail("date_iso", "date must be a valid ISO 8601 date string") from exc
        return v

    @field_validator("description")
    @classmethod
    def _description(cls, v: Any) -> str | None:
        if v is None:
            return None
        if not isinstance(v, str):
            raise _fail("description_string", "description must be a string")
        if len(v) > 255:
            raise _fail(
                "description_long", "description must be shorter than or equal to 255 characters"
            )
        return v

    @model_validator(mode="after")
    def _category_rule(self) -> "TransactionCreateRequest":
        # En egresos siempre se valida (y por lo tanto es obligatorio); en
        # ingresos solo si viene informado. Igual que `@ValidateIf` en Node,
        # que compara contra `undefined`: un `null` explícito también se valida.
        if self.type == TransactionType.EXPENSE or "category_id" in self.model_fields_set:
            if not is_uuid(self.category_id):
                raise _fail(
                    "category_id_uuid", "category_id must be a UUID (required for expense)"
                )
        return self


class Transaction(BaseModel):
    """`Transaction` — respuesta de las rutas de Transacciones."""

    model_config = ConfigDict(extra="forbid")

    id: str
    amount: float
    type: TransactionType
    account_id: str
    category_id: str | None
    date: str
    description: str | None
    created_at: str
    updated_at: str


class TransactionFilters(BaseModel):
    """Query params opcionales de `GET /api/transactions` (AND lógico)."""

    account_id: uuid.UUID | None = None
    category_id: uuid.UUID | None = None
    type: TransactionType | None = None


class CategorySummary(BaseModel):
    """`CategorySummary` — egresos agregados de un sobre."""

    model_config = ConfigDict(extra="forbid")

    category_id: str
    category_name: str
    icon: str
    color: str
    total_amount: float
    percentage: float


class FinancesSummary(BaseModel):
    """`FinancesSummary` — respuesta de `GET /api/finances/summary`."""

    model_config = ConfigDict(extra="forbid")

    total_balance: float
    total_income: float
    total_expenses: float
    by_category: list[CategorySummary]
