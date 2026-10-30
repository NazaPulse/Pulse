"""ORM de la tabla `notes` (Módulo de Productividad, Issue #19).

Equivalente a `src/notes/note.entity.ts` del Backend A. No altera el esquema.
"""
from __future__ import annotations


from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import OwnedRecord


class Note(OwnedRecord):
    __tablename__ = "notes"

    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
