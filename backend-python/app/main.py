"""Punto de entrada FastAPI — Backend B (paridad con el Backend A / NestJS).

Contrato: `openapi.yaml` en la raíz del repo. Swagger UI en `/api/docs`.
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.api.accounts import router as accounts_router
from app.api.auth import router as auth_router
from app.api.categories import router as categories_router
from app.api.finances import router as finances_router
from app.api.notes import router as notes_router
from app.api.tasks import router as tasks_router
from app.api.transactions import router as transactions_router
from app.errors import register_exception_handlers
from app.services.notes import UPLOADS_ROOT

app = FastAPI(
    title="Pulse API",
    description="Backend B (FastAPI). Contrato: openapi.yaml en la raíz del repo.",
    version="0.4.0",
    docs_url="/api/docs",
    redoc_url=None,
    openapi_url="/api/openapi.json",
)

register_exception_handlers(app)
app.include_router(auth_router)
app.include_router(accounts_router)
app.include_router(categories_router)
app.include_router(transactions_router)
app.include_router(finances_router)
app.include_router(tasks_router)
app.include_router(notes_router)

# Archivos subidos (notas de voz) servidos públicamente en /uploads/*.
UPLOADS_ROOT.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_ROOT), name="uploads")


@app.get("/health", include_in_schema=False)
def health() -> dict[str, str]:
    return {"status": "ok"}
