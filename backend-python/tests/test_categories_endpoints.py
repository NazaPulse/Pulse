"""Paridad de contrato con openapi.yaml y con el Backend A (NestJS) para
`/api/categories` y `/api/categories/{id}`: estructuras JSON, tipos,
códigos HTTP, JWT obligatorio y aislamiento estricto por usuario.
"""
from tests.helpers import auth_headers, pick


def test_list_categories_without_token_returns_401(client):
    r = client.get("/api/categories")
    assert r.status_code == 401
    assert r.json() == {
        "message": "Unauthorized",
        "error": "Unauthorized",
        "statusCode": 401,
    }


def test_create_category_returns_201_with_exact_field_names(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/categories",
        json={"name": "Supermercado", "target_amount": 500, "color": "#FF5733", "icon": "shopping-cart"},
        headers=auth_headers(token),
    )
    assert r.status_code == 201
    body = r.json()
    assert set(body.keys()) == {
        "id",
        "name",
        "target_amount",
        "color",
        "icon",
        "created_at",
        "updated_at",
    }
    assert pick(body, "target_amount", "color", "icon") == {
        "target_amount": 500,
        "color": "#FF5733",
        "icon": "shopping-cart",
    }


def test_create_category_without_color_icon_uses_defaults(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/categories",
        json={"name": "Transporte", "target_amount": 150},
        headers=auth_headers(token),
    )
    assert r.status_code == 201
    body = r.json()
    defaults = [body["color"], body["icon"]]
    assert all(isinstance(value, str) for value in defaults)
    assert all(defaults)


def test_create_category_invalid_color_returns_400(client, token_for):
    _, token = token_for()
    r = client.post(
        "/api/categories",
        json={"name": "x", "target_amount": 100, "color": "not-a-hex-color"},
        headers=auth_headers(token),
    )
    assert r.status_code == 400


def test_update_category_requires_all_fields(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)
    created = client.post(
        "/api/categories",
        json={"name": "Supermercado", "target_amount": 500},
        headers=headers,
    ).json()

    # PUT es reemplazo total: falta `icon` -> 400.
    r = client.put(
        f"/api/categories/{created['id']}",
        json={"name": "Supermercado", "target_amount": 600, "color": "#FF5733"},
        headers=headers,
    )
    assert r.status_code == 400

    r = client.put(
        f"/api/categories/{created['id']}",
        json={"name": "Supermercado", "target_amount": 600, "color": "#FF5733", "icon": "cart"},
        headers=headers,
    )
    assert r.status_code == 200
    assert r.json()["target_amount"] == 600


def test_delete_category_removes_it(client, token_for):
    _, token = token_for()
    headers = auth_headers(token)
    created = client.post(
        "/api/categories",
        json={"name": "Ocio", "target_amount": 100},
        headers=headers,
    ).json()

    assert client.delete(f"/api/categories/{created['id']}", headers=headers).status_code == 204
    assert client.get(f"/api/categories/{created['id']}", headers=headers).status_code == 404
    assert client.get("/api/categories", headers=headers).json() == []


def test_category_isolated_between_users(client, token_for):
    _, owner_token = token_for()
    _, other_token = token_for()
    owner_headers = auth_headers(owner_token)
    other_headers = auth_headers(other_token)

    created = client.post(
        "/api/categories",
        json={"name": "Supermercado", "target_amount": 500},
        headers=owner_headers,
    ).json()
    category_id = created["id"]

    statuses = [
        client.get(f"/api/categories/{category_id}", headers=other_headers).status_code,
        client.put(
            f"/api/categories/{category_id}",
            json={"name": "x", "target_amount": 1, "color": "#000000", "icon": "x"},
            headers=other_headers,
        ).status_code,
        client.delete(f"/api/categories/{category_id}", headers=other_headers).status_code,
    ]
    assert statuses == [404, 404, 404]
    assert client.get("/api/categories", headers=other_headers).json() == []

    assert client.get(f"/api/categories/{category_id}", headers=owner_headers).status_code == 200
