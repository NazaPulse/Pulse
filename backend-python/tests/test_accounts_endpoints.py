"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/accounts` y `/api/accounts/{id}`: estructuras JSON, tipos, códigos
HTTP, JWT obligatorio y aislamiento estricto por usuario.
"""


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_list_accounts_without_token_returns_401(client):
    r = client.get("/api/accounts")
    assert r.status_code == 401
    assert r.json() == {
        "message": "Unauthorized",
        "error": "Unauthorized",
        "statusCode": 401,
    }


def test_list_accounts_with_malformed_token_returns_401(client):
    r = client.get("/api/accounts", headers={"Authorization": "Bearer no-es-un-jwt"})
    assert r.status_code == 401


def test_create_account_returns_201_with_exact_field_names(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/accounts",
        json={"name": "Cuenta Corriente Santander", "type": "bank", "initial_balance": 15230.5},
        headers=auth_headers(token),
    )
    assert r.status_code == 201
    body = r.json()
    assert set(body.keys()) == {"id", "name", "type", "balance", "created_at", "updated_at"}
    assert body["name"] == "Cuenta Corriente Santander"
    assert body["type"] == "bank"
    assert body["balance"] == 15230.5


def test_create_account_defaults_balance_to_zero(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/accounts", json={"name": "Efectivo", "type": "cash"}, headers=auth_headers(token)
    )
    assert r.status_code == 201
    assert r.json()["balance"] == 0


def test_create_account_invalid_type_returns_400(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/accounts",
        json={"name": "x", "type": "crypto"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400


def test_create_account_extra_property_rejected(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/accounts",
        json={"name": "x", "type": "bank", "role": "admin"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400


def test_list_get_update_delete_roundtrip(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)

    created = client.post(
        "/api/accounts", json={"name": "Efectivo", "type": "cash"}, headers=headers
    ).json()
    account_id = created["id"]

    listed = client.get("/api/accounts", headers=headers).json()
    assert [a["id"] for a in listed] == [account_id]

    fetched = client.get(f"/api/accounts/{account_id}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json() == created

    updated = client.put(
        f"/api/accounts/{account_id}",
        json={"name": "Efectivo (renombrado)", "type": "wallet"},
        headers=headers,
    )
    assert updated.status_code == 200
    assert updated.json()["name"] == "Efectivo (renombrado)"
    assert updated.json()["type"] == "wallet"
    assert updated.json()["balance"] == created["balance"]  # balance no editable por PUT

    deleted = client.delete(f"/api/accounts/{account_id}", headers=headers)
    assert deleted.status_code == 204
    assert deleted.content == b""

    assert client.get(f"/api/accounts/{account_id}", headers=headers).status_code == 404
    assert client.get("/api/accounts", headers=headers).json() == []


def test_account_isolated_between_users(client, token_for):
    owner_id, owner_token = token_for()
    _, other_token = token_for()
    owner_headers = auth_headers(owner_token)
    other_headers = auth_headers(other_token)

    created = client.post(
        "/api/accounts", json={"name": "Efectivo", "type": "cash"}, headers=owner_headers
    ).json()
    account_id = created["id"]

    assert client.get(f"/api/accounts/{account_id}", headers=other_headers).status_code == 404
    assert (
        client.put(
            f"/api/accounts/{account_id}",
            json={"name": "x", "type": "cash"},
            headers=other_headers,
        ).status_code
        == 404
    )
    assert client.delete(f"/api/accounts/{account_id}", headers=other_headers).status_code == 404
    assert client.get("/api/accounts", headers=other_headers).json() == []

    # El dueño real sigue viendo su cuenta intacta.
    assert client.get(f"/api/accounts/{account_id}", headers=owner_headers).status_code == 200


def test_get_account_malformed_id_returns_404_not_500(client, token_for):
    _, token = token_for()
    r = client.get("/api/accounts/no-es-un-uuid", headers=auth_headers(token))
    assert r.status_code == 404
    assert r.json()["message"] == "Recurso no encontrado."
