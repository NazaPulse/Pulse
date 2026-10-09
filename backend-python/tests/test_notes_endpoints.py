"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/notes`, `/api/notes/upload-audio` y `/api/notes/{id}`.
"""
from app.services import notes as notes_module

NOTE_KEYS = {"id", "title", "content", "audio_url", "user_id", "created_at", "updated_at"}


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_notes_require_jwt(client):
    assert client.get("/api/notes").status_code == 401
    r = client.post("/api/notes/upload-audio", files={"file": ("a.webm", b"x", "audio/webm")})
    assert r.status_code == 401


def test_note_crud_roundtrip(client, token_for):
    uid, token = token_for()
    h = auth_headers(token)

    r = client.post("/api/notes", json={"title": "Ideas", "content": "Revisar"}, headers=h)
    assert r.status_code == 201
    note = r.json()
    assert set(note) == NOTE_KEYS
    assert note["audio_url"] is None
    assert note["user_id"] == str(uid)

    assert client.get(f"/api/notes/{note['id']}", headers=h).json()["title"] == "Ideas"
    assert len(client.get("/api/notes", headers=h).json()) == 1

    # PUT = reemplazo total: `content` omitido queda vacío.
    r = client.put(
        f"/api/notes/{note['id']}", json={"title": "Nueva", "audio_url": "/uploads/audio/x.webm"}, headers=h
    )
    assert r.status_code == 200
    assert r.json()["content"] is None
    assert r.json()["audio_url"] == "/uploads/audio/x.webm"

    assert client.delete(f"/api/notes/{note['id']}", headers=h).status_code == 204
    assert client.get(f"/api/notes/{note['id']}", headers=h).status_code == 404


def test_create_note_validation_messages(client, token_for):
    _, token = token_for()
    r = client.post("/api/notes", json={"content": 5}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [
        "title must be shorter than or equal to 200 characters",
        "title must be longer than or equal to 1 characters",
        "title must be a string",
        "content must be a string",
    ]


def test_put_note_requires_title(client, token_for):
    _, token = token_for()
    h = auth_headers(token)
    note = client.post("/api/notes", json={"title": "T"}, headers=h).json()
    r = client.put(f"/api/notes/{note['id']}", json={"content": "c"}, headers=h)
    assert r.status_code == 400
    assert r.json()["message"][-1] == "title must be a string"


def test_other_users_note_is_not_found(client, token_for):
    _, owner = token_for()
    _, intruder = token_for()
    note = client.post("/api/notes", json={"title": "T"}, headers=auth_headers(owner)).json()
    for r in (
        client.get(f"/api/notes/{note['id']}", headers=auth_headers(intruder)),
        client.put(f"/api/notes/{note['id']}", json={"title": "x"}, headers=auth_headers(intruder)),
        client.delete(f"/api/notes/{note['id']}", headers=auth_headers(intruder)),
    ):
        assert r.status_code == 404
        assert r.json() == {"message": "Recurso no encontrado.", "error": "Not Found", "statusCode": 404}


def test_upload_audio_saves_file_and_returns_audio_url(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/notes/upload-audio",
        files={"file": ("voz.webm", b"OggS-fake-audio", "audio/webm;codecs=opus")},
        headers=auth_headers(token),
    )
    assert r.status_code == 201
    body = r.json()
    assert list(body) == ["audio_url"]
    assert body["audio_url"].startswith("/uploads/audio/")
    assert body["audio_url"].endswith(".webm")
    saved = notes_module.AUDIO_UPLOAD_DIR / body["audio_url"].rsplit("/", 1)[1]
    assert saved.read_bytes() == b"OggS-fake-audio"


def test_upload_audio_rejects_unsupported_format(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/notes/upload-audio",
        files={"file": ("doc.pdf", b"%PDF", "application/pdf")},
        headers=auth_headers(token),
    )
    assert r.status_code == 400
    assert r.json() == {
        "message": "Formato de audio no soportado.",
        "error": "Bad Request",
        "statusCode": 400,
    }


def test_upload_audio_without_file_returns_400(client, token_for):
    _, token = token_for()
    r = client.post("/api/notes/upload-audio", data={"x": "1"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == 'Debe enviarse un archivo de audio en el campo "file".'


def test_upload_audio_rejects_files_over_10mb(client, token_for, monkeypatch):
    _, token = token_for()
    monkeypatch.setattr(notes_module, "MAX_AUDIO_SIZE_BYTES", 10)
    r = client.post(
        "/api/notes/upload-audio",
        files={"file": ("voz.mp3", b"x" * 11, "audio/mpeg")},
        headers=auth_headers(token),
    )
    assert r.status_code == 400
    assert r.json()["message"] == "El archivo de audio supera el tamaño máximo de 10 MB."
    assert not any(notes_module.AUDIO_UPLOAD_DIR.glob("*"))
