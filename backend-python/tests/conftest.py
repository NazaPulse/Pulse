"""Fixtures de test: TestClient con la capa de datos reemplazada por un fake
en memoria (no requiere PostgreSQL). El hashing Argon2id es el real.
"""
from __future__ import annotations

import os

# Secretos solo para tests (Settings no tiene defaults). Deben fijarse antes de importar `app`.
os.environ.setdefault("DB_PASSWORD", "test-db-password")
os.environ.setdefault("JWT_SECRET", "test-only-jwt-secret-with-enough-length-for-hs256")

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
import app.api.schedule as schedule_api
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
from app.services.schedule import assert_valid_range
from app.services.schedule import to_response as time_block_to_response
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


class FakeStore:
    """Base de los servicios falsos: almacén en memoria con el mismo aislamiento por usuario
    que los servicios reales (un `id` ajeno, inexistente o inválido responde 404)."""

    newest_first = False

    def __init__(self) -> None:
        self._rows: dict[uuid.UUID, SimpleNamespace] = {}

    def _schema(self, row: SimpleNamespace):
        raise NotImplementedError

    def _visible(self, row: SimpleNamespace, user_id) -> bool:
        return row.user_id == user_id

    def _insert(self, user_id, **fields) -> SimpleNamespace:
        now = dt.datetime.now(tz=dt.timezone.utc)
        row = SimpleNamespace(id=uuid.uuid4(), user_id=user_id, created_at=now, updated_at=now, **fields)
        self._rows[row.id] = row
        return row

    def _list(self, user_id) -> list[SimpleNamespace]:
        rows = [r for r in self._rows.values() if self._visible(r, user_id)]
        return sorted(rows, key=lambda r: r.created_at, reverse=self.newest_first)

    def _touch(self, row: SimpleNamespace, **fields) -> SimpleNamespace:
        row.__dict__.update(fields, updated_at=dt.datetime.now(tz=dt.timezone.utc))
        return row

    def _find_owned_or_fail(self, user_id, row_id) -> SimpleNamespace:
        try:
            row = self._rows.get(uuid.UUID(str(row_id)))
        except ValueError:
            row = None
        if row is None or not self._visible(row, user_id):
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE)
        return row

    def list_for_user(self, db, user_id):
        return [self._schema(r) for r in self._list(user_id)]

    def get_for_user(self, db, user_id, row_id):
        return self._schema(self._find_owned_or_fail(user_id, row_id))

    def remove(self, db, user_id, row_id) -> None:
        del self._rows[self._find_owned_or_fail(user_id, row_id).id]


class FakeAccountsService(FakeStore):
    """Réplica en memoria de las cuentas: borrado lógico (`is_active=False`)."""

    def _visible(self, row, user_id) -> bool:
        return row.user_id == user_id and row.is_active

    def _schema(self, row) -> AccountSchema:
        return AccountSchema(
            id=str(row.id),
            name=row.name,
            type=row.type,
            balance=float(row.balance),
            created_at=_iso_z(row.created_at),
            updated_at=_iso_z(row.updated_at),
        )

    def create(self, db, user_id, dto):
        row = self._insert(
            user_id, name=dto.name, type=dto.type.value, balance=dto.initial_balance, is_active=True
        )
        return self._schema(row)

    def update(self, db, user_id, row_id, dto):
        row = self._find_owned_or_fail(user_id, row_id)
        return self._schema(self._touch(row, name=dto.name, type=dto.type.value))

    def remove(self, db, user_id, row_id) -> None:
        self._touch(self._find_owned_or_fail(user_id, row_id), is_active=False)


class FakeCategoriesService(FakeStore):
    """Réplica en memoria de los sobres presupuestarios."""

    DEFAULT_COLOR = "#6B7280"
    DEFAULT_ICON = "tag"

    def _schema(self, row) -> CategorySchema:
        return CategorySchema(
            id=str(row.id),
            name=row.name,
            target_amount=float(row.target_amount),
            color=row.color,
            icon=row.icon,
            created_at=_iso_z(row.created_at),
            updated_at=_iso_z(row.updated_at),
        )

    def create(self, db, user_id, dto):
        row = self._insert(
            user_id,
            name=dto.name,
            target_amount=dto.target_amount,
            color=dto.color or self.DEFAULT_COLOR,
            icon=dto.icon or self.DEFAULT_ICON,
        )
        return self._schema(row)

    def update(self, db, user_id, row_id, dto):
        row = self._find_owned_or_fail(user_id, row_id)
        fields = dict(name=dto.name, target_amount=dto.target_amount, color=dto.color, icon=dto.icon)
        return self._schema(self._touch(row, **fields))


class FakeTasksService(FakeStore):
    """Réplica en memoria de las tareas (más recientes primero, con filtros)."""

    newest_first = True

    def _schema(self, row):
        return task_to_response(row)

    def list_for_user(self, db, user_id, filters):
        rows = self._list(user_id)
        if filters.status is not None:
            rows = [r for r in rows if r.status == filters.status.value]
        if filters.priority is not None:
            rows = [r for r in rows if r.priority == filters.priority.value]
        return [self._schema(r) for r in rows]

    def create(self, db, user_id, dto):
        row = self._insert(
            user_id,
            title=dto.title,
            description=dto.description,
            priority=(dto.priority.value if dto.priority else "medium"),
            status=(dto.status.value if dto.status else "pending"),
            due_date=dto.due_date,
            estimated_minutes=dto.estimated_minutes,
        )
        return self._schema(row)

    def update(self, db, user_id, row_id, dto):
        sent = dto.model_fields_set
        if not sent:
            raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)
        row = self._find_owned_or_fail(user_id, row_id)
        for field in sent:
            value = getattr(dto, field)
            if value is None and field in {"title", "priority", "status"}:
                continue
            setattr(row, field, value.value if hasattr(value, "value") else value)
        return self._schema(self._touch(row))


class FakeScheduleService(FakeStore):
    """Réplica en memoria del cronograma: orden por `start_time`, rango válido
    y `task_id` que debe pertenecer al usuario (según `FakeTasksService`)."""

    def __init__(self, tasks: FakeTasksService) -> None:
        super().__init__()
        self._tasks = tasks

    def _schema(self, row):
        return time_block_to_response(row)

    def _assert_owned_task(self, user_id, task_id) -> None:
        if task_id:
            self._tasks._find_owned_or_fail(user_id, task_id)

    def list_for_user(self, db, user_id, rng):
        rows = sorted(self._list(user_id), key=lambda r: r.start_time)
        if rng.start is not None:
            rows = [r for r in rows if r.end_time > rng.start]
        if rng.end is not None:
            rows = [r for r in rows if r.start_time < rng.end]
        return [self._schema(r) for r in rows]

    def create(self, db, user_id, dto):
        assert_valid_range(dto.start_time, dto.end_time)
        self._assert_owned_task(user_id, dto.task_id)
        row = self._insert(
            user_id,
            title=dto.title,
            description=dto.description,
            start_time=dto.start_time,
            end_time=dto.end_time,
            actual_duration_minutes=dto.actual_duration_minutes or 0,
            category=(dto.category.value if dto.category else "other"),
            task_id=uuid.UUID(dto.task_id) if dto.task_id else None,
            is_completed=bool(dto.is_completed),
        )
        return self._schema(row)

    def update(self, db, user_id, row_id, dto):
        sent = dto.model_fields_set
        if not sent:
            raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)
        row = self._find_owned_or_fail(user_id, row_id)
        fields = {}
        for field in sent:
            value = getattr(dto, field)
            if value is None and field not in {"description", "task_id"}:
                continue
            if field == "task_id":
                value = uuid.UUID(value) if value else None
            fields[field] = value.value if hasattr(value, "value") else value
        assert_valid_range(
            fields.get("start_time", row.start_time), fields.get("end_time", row.end_time)
        )
        self._assert_owned_task(user_id, dto.task_id)
        return self._schema(self._touch(row, **fields))


class FakeNotesService(FakeStore):
    """Réplica en memoria de las notas (más recientes primero)."""

    newest_first = True

    def _schema(self, row):
        return note_to_response(row)

    def create(self, db, user_id, dto):
        row = self._insert(user_id, title=dto.title, content=dto.content, audio_url=dto.audio_url)
        return self._schema(row)

    def update(self, db, user_id, row_id, dto):
        row = self._find_owned_or_fail(user_id, row_id)
        return self._schema(self._touch(row, title=dto.title, content=dto.content, audio_url=dto.audio_url))


def _install(monkeypatch, api_module, name: str, fake):
    """Reemplaza un servicio de la API por su doble en memoria."""
    monkeypatch.setattr(api_module, name, fake)
    return fake


@pytest.fixture
def fake_accounts(monkeypatch) -> FakeAccountsService:
    return _install(monkeypatch, accounts_api, "accounts_service", FakeAccountsService())


@pytest.fixture
def fake_categories(monkeypatch) -> FakeCategoriesService:
    return _install(monkeypatch, categories_api, "categories_service", FakeCategoriesService())


@pytest.fixture
def fake_tasks(monkeypatch) -> FakeTasksService:
    return _install(monkeypatch, tasks_api, "tasks_service", FakeTasksService())


@pytest.fixture
def fake_notes(monkeypatch, tmp_path) -> FakeNotesService:
    svc = _install(monkeypatch, notes_api, "notes_service", FakeNotesService())
    # Los audios subidos en tests van a un directorio temporal.
    monkeypatch.setattr(notes_module, "AUDIO_UPLOAD_DIR", tmp_path / "audio")
    return svc


@pytest.fixture
def fake_schedule(monkeypatch, fake_tasks) -> FakeScheduleService:
    return _install(monkeypatch, schedule_api, "schedule_service", FakeScheduleService(fake_tasks))


@pytest.fixture
def client(
    fake_users, fake_accounts, fake_categories, fake_tasks, fake_notes, fake_schedule
) -> TestClient:
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
