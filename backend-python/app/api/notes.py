"""Controlador de Notas Multimedia (Issue #19). Rutas idénticas a openapi.yaml
y al Backend A: `/api/notes`, `/api/notes/upload-audio` y `/api/notes/{id}`.
Todas requieren JWT (`bearerAuth`) y filtran por el usuario autenticado.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, File, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user
from app.db.session import get_db
from app.schemas.auth import ErrorResponse
from app.schemas.productivity import AudioUploadResponse, Note, NoteCreateRequest, NoteUpdateRequest
from app.services.notes import notes_service, save_audio

router = APIRouter(prefix="/api/notes", tags=["Notes"])


@router.get(
    "",
    response_model=list[Note],
    summary="Listar las notas del usuario autenticado",
    operation_id="listNotes",
    responses={401: {"model": ErrorResponse}},
)
def list_notes(
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> list[Note]:
    return notes_service.list_for_user(db, current_user.id)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=Note,
    summary="Crear una nota (texto y/o audio)",
    operation_id="createNote",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def create_note(
    dto: NoteCreateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Note:
    return notes_service.create(db, current_user.id, dto)


# Declarada antes de `/{note_id}` para que "upload-audio" no se tome como id.
@router.post(
    "/upload-audio",
    status_code=status.HTTP_201_CREATED,
    response_model=AudioUploadResponse,
    summary="Subir un archivo de voz para adjuntar a una nota",
    operation_id="uploadNoteAudio",
    responses={400: {"model": ErrorResponse}, 401: {"model": ErrorResponse}},
)
def upload_note_audio(
    file: UploadFile | None = File(default=None, description="Archivo de audio a subir."),
    current_user: CurrentUser = Depends(get_current_user),
) -> AudioUploadResponse:
    return AudioUploadResponse(audio_url=save_audio(file))


@router.get(
    "/{note_id}",
    response_model=Note,
    summary="Obtener una nota por id",
    operation_id="getNoteById",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def get_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Note:
    return notes_service.get_for_user(db, current_user.id, note_id)


@router.put(
    "/{note_id}",
    response_model=Note,
    summary="Actualizar una nota existente",
    operation_id="updateNote",
    responses={
        400: {"model": ErrorResponse},
        401: {"model": ErrorResponse},
        404: {"model": ErrorResponse},
    },
)
def update_note(
    note_id: str,
    dto: NoteUpdateRequest,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> Note:
    return notes_service.update(db, current_user.id, note_id, dto)


@router.delete(
    "/{note_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_model=None,
    summary="Eliminar una nota",
    operation_id="deleteNote",
    responses={401: {"model": ErrorResponse}, 404: {"model": ErrorResponse}},
)
def delete_note(
    note_id: str,
    db: Session = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    notes_service.remove(db, current_user.id, note_id)
