"""Formato de error uniforme, idéntico byte a byte al del Backend A (NestJS).

NestJS serializa sus excepciones como:
    { "message": <str | list[str]>, "error": <str>, "statusCode": <int> }

- Errores de negocio  -> `message` es un string  (ej. "Credenciales inválidas.")
- Errores de validación -> `message` es un array de strings con el mismo
  fraseo que `class-validator` (ver DTOs de `/backend-node`).
"""
from __future__ import annotations

from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

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
}

# Prioridad de ordenamiento cuando un mismo campo acumula varios errores.
_CONSTRAINT_ORDER = {
    "string_too_long": 0,
    "string_too_short": 1,
    "email": 2,
    "string_type": 3,
}
_FIELD_ORDER = {"email": 0, "password": 1, "full_name": 2}


def _phrase(status_code: int) -> str:
    try:
        return HTTPStatus(status_code).phrase  # 400 -> "Bad Request", 401 -> "Unauthorized"
    except ValueError:
        return "Error"


def _single_message(field: str, err: dict) -> str | None:
    etype = err.get("type", "")
    ctx = err.get("ctx", {}) or {}
    if etype == "extra_forbidden":
        return f"property {field} should not exist"
    if etype == "string_too_short":
        min_len = int(ctx.get("min_length", 1))
        if min_len <= 1:
            return f"{field} should not be empty"
        return f"{field} must be longer than or equal to {min_len} characters"
    if etype == "string_too_long":
        max_len = int(ctx.get("max_length", 0))
        return f"{field} must be shorter than or equal to {max_len} characters"
    if etype == "string_type":
        return f"{field} must be a string"
    if field == "email":  # value_error de EmailStr u otro fallo de formato
        return "email must be an email"
    return err.get("msg")


def _translate_validation(path: str, errors: list[dict]) -> list[str]:
    by_field: dict[str, list[dict]] = {}
    extras: list[str] = []
    json_broken = False

    for err in errors:
        etype = err.get("type", "")
        if etype in {"json_invalid", "value_error.jsondecode"}:
            json_broken = True
            continue
        loc = [p for p in err.get("loc", ()) if p != "body"]
        field = str(loc[0]) if loc else "body"
        if etype == "extra_forbidden":
            extras.append(f"property {field} should not exist")
            continue
        by_field.setdefault(field, []).append(err)

    if json_broken and not by_field and not extras:
        return ["Invalid JSON body"]

    messages: list[str] = []
    for field in sorted(by_field, key=lambda f: _FIELD_ORDER.get(f, 99)):
        field_errors = by_field[field]
        if any(e.get("type") == "missing" for e in field_errors):
            expansion = _MISSING_EXPANSION.get((path, field))
            if expansion:
                messages.extend(expansion)
            else:
                messages.append(f"{field} should not be empty")
            continue
        ordered = sorted(
            field_errors,
            key=lambda e: _CONSTRAINT_ORDER.get(
                "email" if field == "email" and e.get("type") == "value_error"
                else e.get("type", ""),
                99,
            ),
        )
        for e in ordered:
            msg = _single_message(field, e)
            if msg:
                messages.append(msg)

    messages.extend(extras)
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
