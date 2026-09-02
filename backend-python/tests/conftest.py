"""Fixtures de test: TestClient con la capa de datos reemplazada por un fake
en memoria (no requiere PostgreSQL). El hashing Argon2id es el real.
"""
from __future__ import annotations

import datetime as dt
import uuid
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

from app import services
from app.db.session import get_db
from app.main import app
from app.services import auth as auth_module


class FakeUsersService:
    def __init__(self) -> None:
        self._by_email: dict[str, SimpleNamespace] = {}

    def get_by_email(self, db, email: str):
        return self._by_email.get(email)

    def exists_by_email(self, db, email: str) -> bool:
        return email in self._by_email

    def create(self, db, *, email: str, password_hash: str, full_name):
        if email in self._by_email:
            raise IntegrityError("duplicate", {}, Exception("23505"))
        now = dt.datetime(2026, 8, 28, 14, 3, 21, 123000, tzinfo=dt.timezone.utc)
        row = SimpleNamespace(
            id=uuid.uuid4(),
            email=email,
            password_hash=password_hash,
            full_name=full_name,
            created_at=now,
            updated_at=now,
        )
        self._by_email[email] = row
        return row

    def update_password_hash(self, db, user_id, password_hash: str) -> None:
        for row in self._by_email.values():
            if row.id == user_id:
                row.password_hash = password_hash


@pytest.fixture
def fake_users(monkeypatch) -> FakeUsersService:
    svc = FakeUsersService()
    monkeypatch.setattr(auth_module, "users_service", svc)
    monkeypatch.setattr(services.users, "users_service", svc, raising=False)
    return svc


@pytest.fixture
def client(fake_users) -> TestClient:
    app.dependency_overrides[get_db] = lambda: iter([None])
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
