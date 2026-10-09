"""Lógica de Notas Multimedia. Réplica exacta de `src/notes/notes.service.ts`
y `src/notes/audio-upload.config.ts` (Backend A): aislamiento por usuario,
reemplazo total en `PUT`, borrado físico y guardado de audios en
`uploads/audio` (servido públicamente bajo `/uploads`).
"""
from __future__ import annotations

import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.note import Note
from app.schemas.productivity import Note as NoteSchema
from app.schemas.productivity import NoteCreateRequest, NoteUpdateRequest
from app.services.accounts import NOT_FOUND_MESSAGE, _iso_z

# Raíz servida públicamente bajo `/uploads` (ver main.ts del Backend A y
# app/main.py). Ignorada por git.
UPLOADS_ROOT = Path(__file__).resolve().parents[2] / "uploads"
AUDIO_UPLOAD_DIR = UPLOADS_ROOT / "audio"
AUDIO_PUBLIC_PREFIX = "/uploads/audio"

MAX_AUDIO_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB (openapi.yaml)
UNSUPPORTED_AUDIO_MESSAGE = "Formato de audio no soportado."
MISSING_AUDIO_MESSAGE = 'Debe enviarse un archivo de audio en el campo "file".'
AUDIO_TOO_LARGE_MESSAGE = "El archivo de audio supera el tamaño máximo de 10 MB."

# MIME aceptados -> extensión con la que se guarda el archivo. La extensión se
# deriva del MIME (no del nombre original) para no confiar en datos del
# cliente al construir el path en disco.
ALLOWED_AUDIO_MIME_TYPES: dict[str, str] = {
    "audio/webm": ".webm",
    "audio/mpeg": ".mp3",
    "audio/mp3": ".mp3",
    "audio/wav": ".wav",
    "audio/wave": ".wav",
    "audio/x-wav": ".wav",
    "audio/ogg": ".ogg",
    "audio/mp4": ".m4a",
    "audio/m4a": ".m4a",
    "audio/x-m4a": ".m4a",
}

_COPY_CHUNK_BYTES = 1024 * 1024


def _base_mime_type(mimetype: str | None) -> str:
    """Normaliza `audio/webm;codecs=opus` -> `audio/webm`."""
    return (mimetype or "").split(";")[0].strip().lower()


def _to_response(note: Note) -> NoteSchema:
    return NoteSchema(
        id=str(note.id),
        title=note.title,
        content=note.content,
        audio_url=note.audio_url,
        user_id=str(note.user_id),
        created_at=_iso_z(note.created_at),
        updated_at=_iso_z(note.updated_at),
    )


def save_audio(file: UploadFile | None) -> str:
    """Valida y guarda el audio; devuelve su `audio_url` pública. Mismo orden
    de chequeo que Multer: formato -> tamaño -> archivo presente."""
    if file is None or not file.filename:
        raise HTTPException(status_code=400, detail=MISSING_AUDIO_MESSAGE)

    extension = ALLOWED_AUDIO_MIME_TYPES.get(_base_mime_type(file.content_type))
    if extension is None:
        raise HTTPException(status_code=400, detail=UNSUPPORTED_AUDIO_MESSAGE)

    AUDIO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid.uuid4()}{extension}"
    destination = AUDIO_UPLOAD_DIR / filename

    written = 0
    try:
        with destination.open("wb") as out:
            while chunk := file.file.read(_COPY_CHUNK_BYTES):
                written += len(chunk)
                if written > MAX_AUDIO_SIZE_BYTES:
                    raise HTTPException(status_code=400, detail=AUDIO_TOO_LARGE_MESSAGE)
                out.write(chunk)
    except BaseException:
        destination.unlink(missing_ok=True)
        raise

    return f"{AUDIO_PUBLIC_PREFIX}/{filename}"


class NotesService:
    def list_for_user(self, db: Session, user_id: uuid.UUID) -> list[NoteSchema]:
        rows = db.scalars(
            select(Note).where(Note.user_id == user_id).order_by(Note.created_at.desc())
        ).all()
        return [_to_response(row) for row in rows]

    def create(self, db: Session, user_id: uuid.UUID, dto: NoteCreateRequest) -> NoteSchema:
        note = Note(user_id=user_id, title=dto.title, content=dto.content, audio_url=dto.audio_url)
        db.add(note)
        db.commit()
        db.refresh(note)
        return _to_response(note)

    def get_for_user(self, db: Session, user_id: uuid.UUID, note_id: str) -> NoteSchema:
        return _to_response(self._find_owned_or_fail(db, user_id, note_id))

    def update(
        self, db: Session, user_id: uuid.UUID, note_id: str, dto: NoteUpdateRequest
    ) -> NoteSchema:
        """Reemplazo total: `content`/`audio_url` omitidos o `null` quedan vacíos."""
        note = self._find_owned_or_fail(db, user_id, note_id)
        note.title = dto.title
        note.content = dto.content
        note.audio_url = dto.audio_url
        db.commit()
        db.refresh(note)
        return _to_response(note)

    def remove(self, db: Session, user_id: uuid.UUID, note_id: str) -> None:
        note = self._find_owned_or_fail(db, user_id, note_id)
        db.delete(note)
        db.commit()

    def _find_owned_or_fail(self, db: Session, user_id: uuid.UUID, note_id: str) -> Note:
        """Aislamiento por usuario: un `id` de otro usuario (o inexistente, o con
        formato inválido) responde `404` — nunca revela si existe para otro."""
        try:
            note_uuid = uuid.UUID(str(note_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE) from exc

        note = db.scalar(select(Note).where(Note.id == note_uuid, Note.user_id == user_id))
        if note is None:
            raise HTTPException(status_code=404, detail=NOT_FOUND_MESSAGE)
        return note


notes_service = NotesService()
