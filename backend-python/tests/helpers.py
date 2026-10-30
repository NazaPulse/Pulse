"""Utilidades compartidas por los tests de endpoints."""


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def pick(body: dict, *keys: str) -> dict:
    """Subconjunto de `body` con `keys`, para comparar varios campos en un solo assert."""
    return {key: body.get(key) for key in keys}
