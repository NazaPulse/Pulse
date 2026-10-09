"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/tasks` y `/api/tasks/{id}`: estructuras JSON, enums estrictos,
validación de `due_date`, JWT obligatorio y aislamiento por usuario.
"""
import datetime as dt

TASK_KEYS = {
    "id", "title", "description", "priority", "status",
    "due_date", "user_id", "created_at", "updated_at",
}


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def future_iso(days: int = 3) -> str:
    when = dt.datetime.now(tz=dt.timezone.utc) + dt.timedelta(days=days)
    return when.strftime("%Y-%m-%dT%H:%M:%S.000Z")


def test_tasks_require_jwt(client):
    r = client.get("/api/tasks")
    assert r.status_code == 401
    assert r.json() == {"message": "Unauthorized", "error": "Unauthorized", "statusCode": 401}


def test_create_task_applies_defaults_and_exact_shape(client, token_for):
    uid, token = token_for()
    r = client.post("/api/tasks", json={"title": "Pagar la tarjeta"}, headers=auth_headers(token))
    assert r.status_code == 201
    body = r.json()
    assert set(body) == TASK_KEYS
    assert body["priority"] == "medium"
    assert body["status"] == "pending"
    assert body["description"] is None
    assert body["due_date"] is None
    assert body["user_id"] == str(uid)


def test_create_task_with_future_due_date(client, token_for):
    _, token = token_for()
    due = future_iso()
    r = client.post(
        "/api/tasks",
        json={"title": "T", "priority": "high", "due_date": due},
        headers=auth_headers(token),
    )
    assert r.status_code == 201
    assert r.json()["due_date"] == due
    assert r.json()["priority"] == "high"


def test_create_task_rejects_past_due_date(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/tasks",
        json={"title": "T", "due_date": "2020-01-01T00:00:00.000Z"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400
    assert r.json() == {
        "message": ["due_date must be a date equal to or later than the current date"],
        "error": "Bad Request",
        "statusCode": 400,
    }


def test_create_task_rejects_invalid_due_date(client, token_for):
    _, token = token_for()
    r = client.post("/api/tasks", json={"title": "T", "due_date": "mañana"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [
        "due_date must be a date equal to or later than the current date",
        "due_date must be a valid ISO 8601 date string",
    ]


def test_create_task_rejects_invalid_enums_and_missing_title(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/tasks",
        json={"priority": "HIGH", "status": "done"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400
    assert r.json()["message"] == [
        "title must be shorter than or equal to 200 characters",
        "title must be longer than or equal to 1 characters",
        "title must be a string",
        "priority must be one of the following values: low, medium, high",
        "status must be one of the following values: pending, completed",
    ]


def test_create_task_rejects_unknown_property(client, token_for):
    _, token = token_for()
    r = client.post("/api/tasks", json={"title": "T", "user_id": "x"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == ["property user_id should not exist"]


def test_list_tasks_filters_by_status_and_priority(client, token_for):
    _, token = token_for()
    h = auth_headers(token)
    client.post("/api/tasks", json={"title": "A", "priority": "high"}, headers=h)
    client.post("/api/tasks", json={"title": "B", "priority": "low", "status": "completed"}, headers=h)
    client.post("/api/tasks", json={"title": "C", "priority": "high", "status": "completed"}, headers=h)

    r = client.get("/api/tasks", params={"status": "completed", "priority": "high"}, headers=h)
    assert r.status_code == 200
    assert [t["title"] for t in r.json()] == ["C"]
    assert len(client.get("/api/tasks", headers=h).json()) == 3


def test_list_tasks_rejects_invalid_filter(client, token_for):
    _, token = token_for()
    r = client.get("/api/tasks", params={"status": "archived", "foo": "1"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [
        "property foo should not exist",
        "status must be one of the following values: pending, completed",
    ]


def test_patch_and_put_update_partially(client, token_for):
    _, token = token_for()
    h = auth_headers(token)
    created = client.post(
        "/api/tasks", json={"title": "T", "description": "d", "due_date": future_iso()}, headers=h
    ).json()

    r = client.patch(f"/api/tasks/{created['id']}", json={"status": "completed"}, headers=h)
    assert r.status_code == 200
    assert r.json()["status"] == "completed"
    assert r.json()["description"] == "d"

    r = client.put(
        f"/api/tasks/{created['id']}", json={"description": None, "due_date": None}, headers=h
    )
    assert r.status_code == 200
    assert r.json()["description"] is None
    assert r.json()["due_date"] is None
    assert r.json()["title"] == "T"


def test_update_with_empty_body_returns_400(client, token_for):
    _, token = token_for()
    h = auth_headers(token)
    created = client.post("/api/tasks", json={"title": "T"}, headers=h).json()
    r = client.patch(f"/api/tasks/{created['id']}", json={}, headers=h)
    assert r.status_code == 400
    assert r.json()["message"] == "Debe enviarse al menos un campo para actualizar."


def test_other_users_task_is_not_found(client, token_for):
    _, owner = token_for()
    _, intruder = token_for()
    created = client.post("/api/tasks", json={"title": "T"}, headers=auth_headers(owner)).json()
    not_found = {"message": "Recurso no encontrado.", "error": "Not Found", "statusCode": 404}

    for method in ("get", "delete"):
        r = getattr(client, method)(f"/api/tasks/{created['id']}", headers=auth_headers(intruder))
        assert r.status_code == 404
        assert r.json() == not_found
    r = client.patch(
        f"/api/tasks/{created['id']}", json={"title": "x"}, headers=auth_headers(intruder)
    )
    assert r.status_code == 404
    assert client.get("/api/tasks/no-es-uuid", headers=auth_headers(owner)).status_code == 404


def test_delete_task_returns_204(client, token_for):
    _, token = token_for()
    h = auth_headers(token)
    created = client.post("/api/tasks", json={"title": "T"}, headers=h).json()
    r = client.delete(f"/api/tasks/{created['id']}", headers=h)
    assert r.status_code == 204
    assert r.content == b""
    assert client.get(f"/api/tasks/{created['id']}", headers=h).status_code == 404
