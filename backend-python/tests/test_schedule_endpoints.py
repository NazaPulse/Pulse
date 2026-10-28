"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/schedule` y `/api/schedule/{id}` (Issue #23): estructura `TimeBlock`,
`start_time < end_time` (400), JWT obligatorio y aislamiento por usuario.
"""
BLOCK_KEYS = {
    "id", "title", "description", "start_time", "end_time",
    "actual_duration_minutes", "category", "task_id", "is_completed", "user_id",
}
START = "2026-10-28T13:00:00.000Z"
END = "2026-10-28T14:30:00.000Z"


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def create_block(client, token, **over):
    payload = {"title": "Foco profundo", "start_time": START, "end_time": END, **over}
    return client.post("/api/schedule", json=payload, headers=auth_headers(token))


def test_schedule_requires_jwt(client):
    r = client.get("/api/schedule")
    assert r.status_code == 401
    assert r.json() == {"message": "Unauthorized", "error": "Unauthorized", "statusCode": 401}


def test_create_block_applies_defaults_and_exact_shape(client, token_for):
    uid, token = token_for()
    r = create_block(client, token)
    assert r.status_code == 201
    body = r.json()
    assert set(body) == BLOCK_KEYS
    assert body["start_time"] == START
    assert body["end_time"] == END
    assert body["actual_duration_minutes"] == 0
    assert body["category"] == "other"
    assert body["task_id"] is None
    assert body["is_completed"] is False
    assert body["description"] is None
    assert body["user_id"] == str(uid)


def test_create_block_rejects_inverted_or_empty_range(client, token_for):
    _, token = token_for()
    for end in (START, "2026-10-28T12:00:00.000Z"):
        r = create_block(client, token, end_time=end)
        assert r.status_code == 400
        assert r.json() == {
            "message": "start_time debe ser anterior a end_time.",
            "error": "Bad Request",
            "statusCode": 400,
        }


def test_create_block_validation_messages(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/schedule",
        json={"title": "B", "start_time": "mañana", "category": "nap", "actual_duration_minutes": "x"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400
    assert sorted(r.json()["message"]) == sorted([
        "start_time must be a valid ISO 8601 date string",
        "end_time must be a valid ISO 8601 date string",
        "category must be one of the following values: work, sleep, leisure, exercise, other",
        "actual_duration_minutes must not be less than 0",
        "actual_duration_minutes must be an integer number",
    ])


def test_create_block_with_foreign_task_is_404(client, token_for):
    _, owner = token_for()
    _, other = token_for()
    task = client.post("/api/tasks", json={"title": "Ajena"}, headers=auth_headers(other)).json()
    r = create_block(client, owner, task_id=task["id"])
    assert r.status_code == 404

    mine = client.post("/api/tasks", json={"title": "Mía"}, headers=auth_headers(owner)).json()
    r = create_block(client, owner, task_id=mine["id"], category="work")
    assert r.status_code == 201
    assert r.json()["task_id"] == mine["id"]


def test_list_is_isolated_sorted_and_filtered_by_range(client, token_for):
    _, owner = token_for()
    _, other = token_for()
    create_block(client, owner, title="Tarde", start_time="2026-10-28T18:00:00.000Z",
                 end_time="2026-10-28T19:00:00.000Z")
    create_block(client, owner, title="Mañana")
    create_block(client, owner, title="Otro día", start_time="2026-10-30T13:00:00.000Z",
                 end_time="2026-10-30T14:00:00.000Z")
    create_block(client, other, title="Ajeno")

    r = client.get(
        "/api/schedule",
        params={"from": "2026-10-28T03:00:00.000Z", "to": "2026-10-29T03:00:00.000Z"},
        headers=auth_headers(owner),
    )
    assert r.status_code == 200
    assert [b["title"] for b in r.json()] == ["Mañana", "Tarde"]


def test_list_rejects_invalid_and_unknown_params(client, token_for):
    _, token = token_for()
    r = client.get("/api/schedule", params={"from": "ayer", "foo": "1"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [
        "property foo should not exist",
        "from must be a valid ISO 8601 date string",
    ]


def test_patch_resizes_and_validates_merged_range(client, token_for):
    _, token = token_for()
    block = create_block(client, token).json()
    url = f"/api/schedule/{block['id']}"

    r = client.patch(url, json={"end_time": "2026-10-28T16:00:00.000Z", "actual_duration_minutes": 50},
                     headers=auth_headers(token))
    assert r.status_code == 200
    assert r.json()["end_time"] == "2026-10-28T16:00:00.000Z"
    assert r.json()["start_time"] == START
    assert r.json()["actual_duration_minutes"] == 50

    r = client.patch(url, json={"start_time": "2026-10-28T17:00:00.000Z"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == "start_time debe ser anterior a end_time."

    r = client.patch(url, json={}, headers=auth_headers(token))
    assert r.status_code == 400


def test_other_user_cannot_patch_or_delete(client, token_for):
    _, owner = token_for()
    _, other = token_for()
    block = create_block(client, owner).json()
    url = f"/api/schedule/{block['id']}"

    assert client.patch(url, json={"is_completed": True}, headers=auth_headers(other)).status_code == 404
    assert client.delete(url, headers=auth_headers(other)).status_code == 404
    assert client.delete("/api/schedule/no-es-uuid", headers=auth_headers(owner)).status_code == 404
    assert client.delete(url, headers=auth_headers(owner)).status_code == 204
    assert client.get("/api/schedule", headers=auth_headers(owner)).json() == []
