"""Punto de entrada FastAPI — Backend B (paridad con el Backend A / NestJS).

Contrato: `openapi.yaml` en la raíz del repo. Swagger UI en `/api/docs`.
"""
from __future__ import annotations

from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.errors import register_exception_handlers

app = FastAPI(
    title="Pulse API",
    description="Backend B (FastAPI). Contrato: openapi.yaml en la raíz del repo.",
    version="0.2.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

register_exception_handlers(app)
app.include_router(auth_router)


@app.get("/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}
