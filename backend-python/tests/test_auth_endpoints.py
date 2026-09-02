"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS):
estructuras JSON, tipos y códigos HTTP de `/api/auth/register` y `/api/auth/login`.
"""

VALID = {
    "email": "usuario@pulse.app",
    "password": "S3gura-y-larga_2026!",
    "full_name": "Ada Lovelace",
}


def test_register_returns_201_userpublic_without_secrets(client):
    r = client.post("/api/auth/register", json=VALID)
    assert r.status_code == 201
    body = r.json()
    assert set(body.keys()) == {"id", "email", "full_name", "created_at", "updated_at"}
    assert body["email"] == "usuario@pulse.app"
    assert body["full_name"] == "Ada Lovelace"
    assert "password" not in body and "password_hash" not in body


def test_register_duplicate_email_returns_400_string_message(client):
    client.post("/api/auth/register", json=VALID)
    r = client.post("/api/auth/register", json={"email": VALID["email"], "password": VALID["password"]})
    assert r.status_code == 400
    assert r.json() == {
        "message": "El email ya se encuentra registrado.",
        "error": "Bad Request",
        "statusCode": 400,
    }


def test_register_validation_returns_400_array_message(client):
    r = client.post("/api/auth/register", json={"email": "no-es-email", "password": "corta"})
    assert r.status_code == 400
    body = r.json()
    assert body["error"] == "Bad Request" and body["statusCode"] == 400
    assert isinstance(body["message"], list)
    assert "email must be an email" in body["message"]
    assert "password must be longer than or equal to 12 characters" in body["message"]


def test_register_extra_property_rejected(client):
    r = client.post(
        "/api/auth/register",
        json={"email": "a@pulse.app", "password": VALID["password"], "role": "admin"},
    )
    assert r.status_code == 400
    assert r.json()["message"] == ["property role should not exist"]


def test_login_returns_200_access_token_only(client):
    client.post("/api/auth/register", json=VALID)
    r = client.post("/api/auth/login", json={"email": VALID["email"], "password": VALID["password"]})
    assert r.status_code == 200
    body = r.json()
    assert list(body.keys()) == ["access_token"]
    assert isinstance(body["access_token"], str) and body["access_token"].count(".") == 2


def test_login_bad_password_returns_401_generic(client):
    client.post("/api/auth/register", json=VALID)
    r = client.post("/api/auth/login", json={"email": VALID["email"], "password": "incorrecta-999"})
    assert r.status_code == 401
    assert r.json() == {
        "message": "Credenciales inválidas.",
        "error": "Unauthorized",
        "statusCode": 401,
    }


def test_login_unknown_email_returns_401_generic(client):
    r = client.post("/api/auth/login", json={"email": "nadie@pulse.app", "password": "x" * 12})
    assert r.status_code == 401
    assert r.json()["message"] == "Credenciales inválidas."


def test_login_empty_body_returns_400_array(client):
    r = client.post("/api/auth/login", json={})
    assert r.status_code == 400
    assert r.json()["message"] == [
        "email must be shorter than or equal to 255 characters",
        "email must be an email",
        "password must be shorter than or equal to 128 characters",
        "password should not be empty",
        "password must be a string",
    ]
