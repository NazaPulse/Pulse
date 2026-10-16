"""Formato de error uniforme, idéntico byte a byte al del Backend A (NestJS).

NestJS serializa sus excepciones como:
    { "message": <str | list[str]>, "error": <str>, "statusCode": <int> }

- Errores de negocio  -> `message` es un string  (ej. "Credenciales inválidas.")
- Errores de validación -> `message` es un array de strings con el mismo
  fraseo que `class-validator` (ver DTOs de `/backend-node`).
"""
from __future__ import annotations

from collections.abc import Callable
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

_TITLE_MESSAGES = [
    "title must be shorter than or equal to 200 characters",
    "title must be longer than or equal to 1 characters",
    "title must be a string",
]

# ── Expansión de un campo ausente a la lista completa de mensajes que
#    `class-validator` produciría (todos los validadores fallan sobre `undefined`).
#    El orden replica exactamente la salida observada del Backend A.
_MISSING_EXPANSION: dict[tuple[str, str], list[str]] = {
    ("/api/auth/register", "email"): [
        "email must be shorter than or equal to 255 characters",
        "email must be an email",
    ],
    ("/api/auth/register", "password"): [
        "password must be shorter than or equal to 128 characters",
        "password must be longer than or equal to 12 characters",
        "password must be a string",
    ],
    ("/api/auth/login", "email"): [
        "email must be shorter than or equal to 255 characters",
        "email must be an email",
    ],
    ("/api/auth/login", "password"): [
        "password must be shorter than or equal to 128 characters",
        "password should not be empty",
        "password must be a string",
    ],
    ("/api/transactions", "amount"): [
        "amount must be greater than 0",
        "amount must be a number conforming to the specified constraints",
    ],
    ("/api/transactions", "type"): [
        "type must be one of the following values: income, expense",
    ],
    ("/api/transactions", "account_id"): ["account_id must be a UUID"],
    ("/api/transactions", "date"): ["date must be a valid ISO 8601 date string"],
    ("/api/tasks", "title"): _TITLE_MESSAGES,
    ("/api/notes", "title"): _TITLE_MESSAGES,
    ("/api/notes/{id}", "title"): _TITLE_MESSAGES,
}

# Errores de tipo en los que `class-validator` también reporta el resto de los
# validadores del campo (todos fallan sobre un valor del tipo equivocado).
_TYPE_ERROR_EXPANSION: dict[str, list[str]] = {
    "amount_number": [
        "amount must be greater than 0",
        "amount must be a number conforming to the specified constraints",
    ],
    "description_string": [
        "description must be shorter than or equal to 255 characters",
        "description must be a string",
    ],
    # Módulo de Productividad (app/schemas/productivity.py)
    "title_string": _TITLE_MESSAGES,
    "task_description_string": [
        "description must be shorter than or equal to 1000 characters",
        "description must be a string",
    ],
    "audio_url_string": [
        "audio_url must be shorter than or equal to 2048 characters",
        "audio_url must be a string",
    ],
    "due_date_invalid": [
        "due_date must be a date equal to or later than the current date",
        "due_date must be a valid ISO 8601 date string",
    ],
}

# Prioridad de ordenamiento cuando un mismo campo acumula varios errores.
_CONSTRAINT_ORDER = {
    "string_too_long": 0,
    "string_too_short": 1,
    "email": 2,
    "string_type": 3,
}
_FIELD_ORDER = {"email": 0, "password": 1, "full_name": 2}
_JSON_ERROR_TYPES = {"json_invalid", "value_error.jsondecode"}


def _phrase(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase  # 400 -> "Bad Request", 401 -> "Unauthorized"
    except ValueError:
        return "Error"


def _too_short_message(field: str, ctx: dict) -> str:
    min_len = int(ctx.get("min_length", 1))
    if min_len <= 1:
        return f"{field} should not be empty"
    return f"{field} must be longer than or equal to {min_len} characters"


def _too_long_message(field: str, ctx: dict) -> str:
    max_len = int(ctx.get("max_length", 0))
    return f"{field} must be shorter than or equal to {max_len} characters"


# Traducción de cada `type` de Pydantic a la frase de `class-validator`.
_MESSAGE_BUILDERS: dict[str, Callable[[str, dict], str]] = {
    "extra_forbidden": lambda field, _ctx: f"property {field} should not exist",
    "string_too_short": _too_short_message,
    "string_too_long": _too_long_message,
    "string_type": lambda field, _ctx: f"{field} must be a string",
}


def _single_message(field: str, err: dict) -> str | None:
    builder = _MESSAGE_BUILDERS.get(err.get("type", ""))
    if builder:
        return builder(field, err.get("ctx", {}) or {})
    if field == "email":  # value_error de EmailStr u otro fallo de formato
        return "email must be an email"
    return err.get("msg")


def _route_key(path: str) -> str:
    """`/api/notes/<id>` -> `/api/notes/{id}` para las claves de expansión."""
    parts = path.rstrip("/").split("/")
    if len(parts) == 4 and parts[1] == "api":
        return "/".join(parts[:3] + ["{id}"])
    return path


def _field_of(err: dict) -> str:
    loc = [p for p in err.get("loc", ()) if p != "body"]
    return str(loc[0]) if loc else "body"


def _group_errors(errors: list[dict]) -> tuple[dict[str, list[dict]], list[str], bool]:
    """Agrupa los errores por campo y separa propiedades extra y JSON inválido."""
    by_field: dict[str, list[dict]] = {}
    extras: list[str] = []
    json_broken = False
    for err in errors:
        etype = err.get("type", "")
        if etype in _JSON_ERROR_TYPES:
            json_broken = True
            continue
        field = _field_of(err)
        if etype == "extra_forbidden":
            extras.append(f"property {field} should not exist")
            continue
        by_field.setdefault(field, []).append(err)
    return by_field, extras, json_broken


def _missing_messages(path: str, field: str) -> list[str]:
    expansion = _MISSING_EXPANSION.get((path, field)) or _MISSING_EXPANSION.get(
        (_route_key(path), field)
    )
    return expansion or [f"{field} should not be empty"]


def _constraint_rank(field: str, err: dict) -> int:
    etype = err.get("type", "")
    if field == "email" and etype == "value_error":
        etype = "email"
    return _CONSTRAINT_ORDER.get(etype, 99)


def _error_messages(field: str, err: dict) -> list[str]:
    expansion = _TYPE_ERROR_EXPANSION.get(err.get("type", ""))
    if expansion:
        return expansion
    msg = _single_message(field, err)
    return [msg] if msg else []


def _field_messages(path: str, field: str, field_errors: list[dict]) -> list[str]:
    if any(e.get("type") == "missing" for e in field_errors):
        return _missing_messages(path, field)
    messages: list[str] = []
    for err in sorted(field_errors, key=lambda e: _constraint_rank(field, e)):
        messages.extend(_error_messages(field, err))
    return messages


def _only_json_error(by_field: dict, extras: list[str], json_broken: bool) -> bool:
    return json_broken and not by_field and not extras


def _translate_validation(path: str, errors: list[dict]) -> list[str]:
    by_field, extras, json_broken = _group_errors(errors)
    if _only_json_error(by_field, extras, json_broken):
        return ["Invalid JSON body"]

    messages: list[str] = []
    for field in sorted(by_field, key=lambda f: _FIELD_ORDER.get(f, 99)):
        messages.extend(_field_messages(path, field, by_field[field]))

    # Igual que `ValidationPipe(forbidNonWhitelisted)`: las propiedades no
    # declaradas se reportan antes que los validadores de cada campo.
    messages = extras + messages
    return messages or ["Solicitud inválida."]


def _body(status_code: int, message: str | list[str]) -> JSONResponse:
    # El orden de claves reproduce el de NestJS: message, error, statusCode.
    return JSONResponse(
        status_code=status_code,
        content={
            "message": message,
            "error": _phrase(status_code),
            "statusCode": status_code,
        },
    )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _on_validation(request: Request, exc: RequestValidationError):
        messages = _translate_validation(request.url.path, list(exc.errors()))
        return _body(400, messages)

    @app.exception_handler(StarletteHTTPException)
    async def _on_http(request: Request, exc: StarletteHTTPException):
        detail = exc.detail
        message = detail if isinstance(detail, (str, list)) else _phrase(exc.status_code)
        return _body(exc.status_code, message)
