"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/accounts` y `/api/accounts/{id}`: estructuras JSON, tipos, códigos
HTTP, JWT obligatorio y aislamiento estricto por usuario.
"""
from tests.helpers import auth_headers, pick


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
    assert pick(body, "name", "type", "balance") == {
        "name": "Cuenta Corriente Santander",
        "type": "bank",
        "balance": 15230.5,
    }


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


def _create_cash_account(client, headers) -> dict:
    return client.post("/api/accounts", json={"name": "Efectivo", "type": "cash"}, headers=headers).json()


def test_list_and_get_return_created_account(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)
    created = _create_cash_account(client, headers)

    listed = client.get("/api/accounts", headers=headers).json()
    assert [a["id"] for a in listed] == [created["id"]]

    fetched = client.get(f"/api/accounts/{created['id']}", headers=headers)
    assert fetched.status_code == 200
    assert fetched.json() == created


def test_update_account_keeps_balance(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)
    created = _create_cash_account(client, headers)

    updated = client.put(
        f"/api/accounts/{created['id']}",
        json={"name": "Efectivo (renombrado)", "type": "wallet"},
        headers=headers,
    )
    assert updated.status_code == 200
    # balance no editable por PUT
    assert pick(updated.json(), "name", "type", "balance") == {
        "name": "Efectivo (renombrado)",
        "type": "wallet",
        "balance": created["balance"],
    }


def test_delete_account_hides_it(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)
    account_id = _create_cash_account(client, headers)["id"]

    deleted = client.delete(f"/api/accounts/{account_id}", headers=headers)
    assert (deleted.status_code, deleted.content) == (204, b"")

    assert client.get(f"/api/accounts/{account_id}", headers=headers).status_code == 404
    assert client.get("/api/accounts", headers=headers).json() == []


def test_account_isolated_between_users(client, token_for):
    _, owner_token = token_for()
    _, other_token = token_for()
    owner_headers = auth_headers(owner_token)
    other_headers = auth_headers(other_token)
    account_id = _create_cash_account(client, owner_headers)["id"]

    statuses = [
        client.get(f"/api/accounts/{account_id}", headers=other_headers).status_code,
        client.put(
            f"/api/accounts/{account_id}", json={"name": "x", "type": "cash"}, headers=other_headers
        ).status_code,
        client.delete(f"/api/accounts/{account_id}", headers=other_headers).status_code,
    ]
    assert statuses == [404, 404, 404]
    assert client.get("/api/accounts", headers=other_headers).json() == []

    # El dueño real sigue viendo su cuenta intacta.
    assert client.get(f"/api/accounts/{account_id}", headers=owner_headers).status_code == 200


def test_get_account_malformed_id_returns_404_not_500(client, token_for):
    _, token = token_for()
    r = client.get("/api/accounts/no-es-un-uuid", headers=auth_headers(token))
    assert r.status_code == 404
    assert r.json()["message"] == "Recurso no encontrado."
