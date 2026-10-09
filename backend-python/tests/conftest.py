"""Fixtures de test: TestClient con la capa de datos reemplazada por un fake
en memoria (no requiere PostgreSQL). El hashing Argon2id es el real.
"""
from __future__ import annotations

import datetime as dt
import uuid
from collections.abc import Callable
from types import SimpleNamespace

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlalchemy.exc import IntegrityError

import app.api.accounts as accounts_api
import app.api.categories as categories_api
import app.api.notes as notes_api
import app.api.tasks as tasks_api
from app import services
from app.core.security import create_access_token
from app.db.session import get_db
from app.main import app
from app.schemas.finance import Account as AccountSchema
from app.schemas.finance import Category as CategorySchema
from app.services import auth as auth_module
from app.services import notes as notes_module
from app.services.notes import _to_response as note_to_response
from app.services.tasks import EMPTY_UPDATE_MESSAGE
from app.services.tasks import _to_response as task_to_response

_NOT_FOUND_MESSAGE = "Recurso no encontrado."


def _iso_z(value: dt.datetime) -> str:
    return value.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.") + f"{value.microsecond // 1000:03d}Z"


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


class FakeAccountsService:
    """Réplica en memoria de `AccountsService` (mismo contrato/aislamiento)."""

    def __init__(self) -> None:
        self._rows: dict[uuid.UUID, SimpleNamespace] = {}

    def list_for_user(self, db, user_id):
        rows = [r for r in self._rows.values() if r.user_id == user_id and r.is_active]
        rows.sort(key=lambda r: r.created_at)
        return [self._to_schema(r) for r in rows]

    def create(self, db, user_id, dto):
        now = dt.datetime.now(tz=dt.timezone.utc)
        row = SimpleNamespace(
            id=uuid.uuid4(),
            user_id=user_id,
            name=dto.name,
            type=dto.type.value,
            balance=dto.initial_balance,
            is_active=True,
            created_at=now,
            updated_at=now,
        )
        self._rows[row.id] = row
        return self._to_schema(row)

    def get_for_user(self, db, user_id, account_id):
        return self._to_schema(self._find_owned_or_fail(user_id, account_id))

    def update(self, db, user_id, account_id, dto):
        row = self._find_owned_or_fail(user_id, account_id)
        row.name = dto.name
        row.type = dto.type.value
        row.updated_at = dt.datetime.now(tz=dt.timezone.utc)
        return self._to_schema(row)

    def remove(self, db, user_id, account_id) -> None:
        row = self._find_owned_or_fail(user_id, account_id)
        row.is_active = False

    def _find_owned_or_fail(self, user_id, account_id) -> SimpleNamespace:
        try:
            account_uuid = uuid.UUID(str(account_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE) from exc
        row = self._rows.get(account_uuid)
        if row is None or row.user_id != user_id or not row.is_active:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE)
        return row

    @staticmethod
    def _to_schema(row: SimpleNamespace) -> AccountSchema:
        return AccountSchema(
            id=str(row.id),
            name=row.name,
            type=row.type,
            balance=float(row.balance),
            created_at=_iso_z(row.created_at),
            updated_at=_iso_z(row.updated_at),
        )


class FakeCategoriesService:
    """Réplica en memoria de `CategoriesService` (mismo contrato/aislamiento)."""

    DEFAULT_COLOR = "#6B7280"
    DEFAULT_ICON = "tag"

    def __init__(self) -> None:
        self._rows: dict[uuid.UUID, SimpleNamespace] = {}

    def list_for_user(self, db, user_id):
        rows = [r for r in self._rows.values() if r.user_id == user_id]
        rows.sort(key=lambda r: r.created_at)
        return [self._to_schema(r) for r in rows]

    def create(self, db, user_id, dto):
        now = dt.datetime.now(tz=dt.timezone.utc)
        row = SimpleNamespace(
            id=uuid.uuid4(),
            user_id=user_id,
            name=dto.name,
            target_amount=dto.target_amount,
            color=dto.color or self.DEFAULT_COLOR,
            icon=dto.icon or self.DEFAULT_ICON,
            created_at=now,
            updated_at=now,
        )
        self._rows[row.id] = row
        return self._to_schema(row)

    def get_for_user(self, db, user_id, category_id):
        return self._to_schema(self._find_owned_or_fail(user_id, category_id))

    def update(self, db, user_id, category_id, dto):
        row = self._find_owned_or_fail(user_id, category_id)
        row.name = dto.name
        row.target_amount = dto.target_amount
        row.color = dto.color
        row.icon = dto.icon
        row.updated_at = dt.datetime.now(tz=dt.timezone.utc)
        return self._to_schema(row)

    def remove(self, db, user_id, category_id) -> None:
        row = self._find_owned_or_fail(user_id, category_id)
        del self._rows[row.id]

    def _find_owned_or_fail(self, user_id, category_id) -> SimpleNamespace:
        try:
            category_uuid = uuid.UUID(str(category_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE) from exc
        row = self._rows.get(category_uuid)
        if row is None or row.user_id != user_id:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE)
        return row

    @staticmethod
    def _to_schema(row: SimpleNamespace) -> CategorySchema:
        return CategorySchema(
            id=str(row.id),
            name=row.name,
            target_amount=float(row.target_amount),
            color=row.color,
            icon=row.icon,
            created_at=_iso_z(row.created_at),
            updated_at=_iso_z(row.updated_at),
        )


@pytest.fixture
def fake_accounts(monkeypatch) -> FakeAccountsService:
    svc = FakeAccountsService()
    monkeypatch.setattr(accounts_api, "accounts_service", svc)
    return svc


@pytest.fixture
def fake_categories(monkeypatch) -> FakeCategoriesService:
    svc = FakeCategoriesService()
    monkeypatch.setattr(categories_api, "categories_service", svc)
    return svc


class _FakeOwnedStore:
    """Almacén en memoria con el mismo aislamiento por usuario que los servicios."""

    def __init__(self) -> None:
        self._rows: dict[uuid.UUID, SimpleNamespace] = {}

    def _insert(self, user_id, **fields) -> SimpleNamespace:
        now = dt.datetime.now(tz=dt.timezone.utc)
        row = SimpleNamespace(id=uuid.uuid4(), user_id=user_id, created_at=now, updated_at=now, **fields)
        self._rows[row.id] = row
        return row

    def _list(self, user_id) -> list[SimpleNamespace]:
        rows = [r for r in self._rows.values() if r.user_id == user_id]
        rows.sort(key=lambda r: r.created_at, reverse=True)
        return rows

    def _find_owned_or_fail(self, user_id, row_id) -> SimpleNamespace:
        try:
            row_uuid = uuid.UUID(str(row_id))
        except ValueError as exc:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE) from exc
        row = self._rows.get(row_uuid)
        if row is None or row.user_id != user_id:
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE)
        return row

    def remove(self, db, user_id, row_id) -> None:
        del self._rows[self._find_owned_or_fail(user_id, row_id).id]


class FakeTasksService(_FakeOwnedStore):
    """Réplica en memoria de `TasksService` (mismo contrato/aislamiento)."""

    def list_for_user(self, db, user_id, filters):
        rows = self._list(user_id)
        if filters.status is not None:
            rows = [r for r in rows if r.status == filters.status.value]
        if filters.priority is not None:
            rows = [r for r in rows if r.priority == filters.priority.value]
        return [task_to_response(r) for r in rows]

    def create(self, db, user_id, dto):
        row = self._insert(
            user_id,
            title=dto.title,
            description=dto.description,
            priority=(dto.priority.value if dto.priority else "medium"),
            status=(dto.status.value if dto.status else "pending"),
            due_date=dto.due_date,
        )
        return task_to_response(row)

    def get_for_user(self, db, user_id, task_id):
        return task_to_response(self._find_owned_or_fail(user_id, task_id))

    def update(self, db, user_id, task_id, dto):
        sent = dto.model_fields_set
        if not sent:
            raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)
        row = self._find_owned_or_fail(user_id, task_id)
        for field in sent:
            value = getattr(dto, field)
            if value is None and field in {"title", "priority", "status"}:
                continue
            setattr(row, field, value.value if hasattr(value, "value") else value)
        row.updated_at = dt.datetime.now(tz=dt.timezone.utc)
        return task_to_response(row)


class FakeNotesService(_FakeOwnedStore):
    """Réplica en memoria de `NotesService` (mismo contrato/aislamiento)."""

    def list_for_user(self, db, user_id):
        return [note_to_response(r) for r in self._list(user_id)]

    def create(self, db, user_id, dto):
        row = self._insert(user_id, title=dto.title, content=dto.content, audio_url=dto.audio_url)
        return note_to_response(row)

    def get_for_user(self, db, user_id, note_id):
        return note_to_response(self._find_owned_or_fail(user_id, note_id))

    def update(self, db, user_id, note_id, dto):
        row = self._find_owned_or_fail(user_id, note_id)
        row.title, row.content, row.audio_url = dto.title, dto.content, dto.audio_url
        row.updated_at = dt.datetime.now(tz=dt.timezone.utc)
        return note_to_response(row)


@pytest.fixture
def fake_tasks(monkeypatch) -> FakeTasksService:
    svc = FakeTasksService()
    monkeypatch.setattr(tasks_api, "tasks_service", svc)
    return svc


@pytest.fixture
def fake_notes(monkeypatch, tmp_path) -> FakeNotesService:
    svc = FakeNotesService()
    monkeypatch.setattr(notes_api, "notes_service", svc)
    # Los audios subidos en tests van a un directorio temporal.
    monkeypatch.setattr(notes_module, "AUDIO_UPLOAD_DIR", tmp_path / "audio")
    return svc


@pytest.fixture
def client(fake_users, fake_accounts, fake_categories, fake_tasks, fake_notes) -> TestClient:
    app.dependency_overrides[get_db] = lambda: iter([None])
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def token_for() -> Callable[..., tuple[uuid.UUID, str]]:
    """Emite un JWT válido (mismo formato que `create_access_token`) para un
    usuario de prueba y devuelve `(user_id, token)`."""

    def _make(
        user_id: uuid.UUID | None = None, email: str = "usuario@pulse.app"
    ) -> tuple[uuid.UUID, str]:
        uid = user_id or uuid.uuid4()
        token = create_access_token(sub=str(uid), email=email)
        return uid, token

    return _make
