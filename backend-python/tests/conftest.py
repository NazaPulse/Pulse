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


def _touch(row: SimpleNamespace, **fields) -> SimpleNamespace:
    row.__dict__.update(fields, updated_at=dt.datetime.now(tz=dt.timezone.utc))
    return row


def _plain(value):
    """Valor de un Enum como su `value`; el resto tal cual."""
    return value.value if hasattr(value, "value") else value


def _sent_fields(dto, nullable: set[str]) -> dict:
    """Campos enviados en un PATCH; un `null` sólo se aplica a los campos `nullable`."""
    sent = dto.model_fields_set
    if not sent:
        raise HTTPException(status_code=400, detail=EMPTY_UPDATE_MESSAGE)
    fields = {field: getattr(dto, field) for field in sent}
    return {k: _plain(v) for k, v in fields.items() if v is not None or k in nullable}


class Visibility:
    """Reglas de lectura de una tabla: borrado lógico y orden de listado."""

    def __init__(self, soft_delete: bool, newest_first: bool) -> None:
        self.soft_delete = soft_delete
        self.newest_first = newest_first

    def sees(self, row: SimpleNamespace, user_id) -> bool:
        return row.user_id == user_id and (not self.soft_delete or row.is_active)

    def ordered(self, rows: list[SimpleNamespace]) -> list[SimpleNamespace]:
        return sorted(rows, key=lambda r: r.created_at, reverse=self.newest_first)


class RowTable:
    """Filas en memoria con el mismo aislamiento por usuario que los servicios reales: un `id`
    ajeno, inexistente o inválido responde 404 (con borrado lógico, las inactivas no se ven)."""

    def __init__(self, visibility: Visibility) -> None:
        self._rows: dict[uuid.UUID, SimpleNamespace] = {}
        self._visibility = visibility

    def insert(self, user_id, **fields) -> SimpleNamespace:
        now = dt.datetime.now(tz=dt.timezone.utc)
        row = SimpleNamespace(id=uuid.uuid4(), user_id=user_id, created_at=now, updated_at=now, **fields)
        self._rows[row.id] = row
        return row

    def visible(self, user_id) -> list[SimpleNamespace]:
        rows = [r for r in self._rows.values() if self._visibility.sees(r, user_id)]
        return self._visibility.ordered(rows)

    def find(self, user_id, row_id) -> SimpleNamespace:
        try:
            row = self._rows.get(uuid.UUID(str(row_id)))
        except ValueError:
            row = None
        if row is None or not self._visibility.sees(row, user_id):
            raise HTTPException(status_code=404, detail=_NOT_FOUND_MESSAGE)
        return row

    def delete(self, row: SimpleNamespace) -> None:
        if self._visibility.soft_delete:
            _touch(row, is_active=False)
        else:
            del self._rows[row.id]


class FakeStore:
    """Base de los servicios falsos: operaciones comunes sobre una `RowTable`."""

    newest_first = False
    soft_delete = False
    to_schema: Callable = staticmethod(lambda row: row)

    def __init__(self) -> None:
        self.table = RowTable(Visibility(self.soft_delete, self.newest_first))

    def _insert(self, user_id, **fields):
        return self.to_schema(self.table.insert(user_id, **fields))

    def _patch(self, user_id, row_id, **fields):
        return self.to_schema(_touch(self.table.find(user_id, row_id), **fields))

    def list_for_user(self, db, user_id):
        return [self.to_schema(r) for r in self.table.visible(user_id)]

    def get_for_user(self, db, user_id, row_id):
        return self.to_schema(self.table.find(user_id, row_id))

    def remove(self, db, user_id, row_id) -> None:
        self.table.delete(self.table.find(user_id, row_id))


def _account_schema(row) -> AccountSchema:
    return AccountSchema(
        id=str(row.id),
        name=row.name,
        type=row.type,
        balance=float(row.balance),
        created_at=_iso_z(row.created_at),
        updated_at=_iso_z(row.updated_at),
    )


class FakeAccountsService(FakeStore):
    """Réplica en memoria de las cuentas: borrado lógico (`is_active=False`)."""

    soft_delete = True
    to_schema = staticmethod(_account_schema)

    def create(self, db, user_id, dto):
        return self._insert(
            user_id, name=dto.name, type=dto.type.value, balance=dto.initial_balance, is_active=True
        )

    def update(self, db, user_id, row_id, dto):
        return self._patch(user_id, row_id, name=dto.name, type=dto.type.value)


def _category_schema(row) -> CategorySchema:
    return CategorySchema(
        id=str(row.id),
        name=row.name,
        target_amount=float(row.target_amount),
        color=row.color,
        icon=row.icon,
        created_at=_iso_z(row.created_at),
        updated_at=_iso_z(row.updated_at),
    )


class FakeCategoriesService(FakeStore):
    """Réplica en memoria de los sobres presupuestarios."""

    DEFAULT_COLOR = "#6B7280"
    DEFAULT_ICON = "tag"
    to_schema = staticmethod(_category_schema)

    def create(self, db, user_id, dto):
        return self._insert(
            user_id,
            name=dto.name,
            target_amount=dto.target_amount,
            color=dto.color or self.DEFAULT_COLOR,
            icon=dto.icon or self.DEFAULT_ICON,
        )

    def update(self, db, user_id, row_id, dto):
        fields = dict(name=dto.name, target_amount=dto.target_amount, color=dto.color, icon=dto.icon)
        return self._patch(user_id, row_id, **fields)


class FakeTasksService(FakeStore):
    """Réplica en memoria de las tareas (más recientes primero, con filtros)."""

    newest_first = True
    to_schema = staticmethod(task_to_response)

    def list_for_user(self, db, user_id, filters):
        wanted = {"status": filters.status, "priority": filters.priority}
        rows = self.table.visible(user_id)
        for field, value in wanted.items():
            if value is not None:
                rows = [r for r in rows if getattr(r, field) == value.value]
        return [self.to_schema(r) for r in rows]

    def create(self, db, user_id, dto):
        return self._insert(
            user_id,
            title=dto.title,
            description=dto.description,
            priority=(dto.priority.value if dto.priority else "medium"),
            status=(dto.status.value if dto.status else "pending"),
            due_date=dto.due_date,
            estimated_minutes=dto.estimated_minutes,
        )

    def update(self, db, user_id, row_id, dto):
        fields = _sent_fields(dto, nullable={"description", "due_date", "estimated_minutes"})
        return self._patch(user_id, row_id, **fields)


def _as_uuid(value):
    return uuid.UUID(value) if value else None


class FakeScheduleService(FakeStore):
    """Réplica en memoria del cronograma: orden por `start_time`, rango válido
    y `task_id` que debe pertenecer al usuario (según `FakeTasksService`)."""

    to_schema = staticmethod(time_block_to_response)
    # Tareas del usuario (las asigna el fixture `fake_schedule`).
    tasks: FakeTasksService

    def list_for_user(self, db, user_id, rng):
        rows = sorted(self.table.visible(user_id), key=lambda r: r.start_time)
        rows = [r for r in rows if rng.start is None or r.end_time > rng.start]
        rows = [r for r in rows if rng.end is None or r.start_time < rng.end]
        return [self.to_schema(r) for r in rows]

    def create(self, db, user_id, dto):
        assert_valid_range(dto.start_time, dto.end_time)
        if dto.task_id:
            self.tasks.get_for_user(db, user_id, dto.task_id)
        return self._insert(
            user_id,
            title=dto.title,
            description=dto.description,
            start_time=dto.start_time,
            end_time=dto.end_time,
            actual_duration_minutes=dto.actual_duration_minutes or 0,
            category=(dto.category.value if dto.category else "other"),
            task_id=_as_uuid(dto.task_id),
            is_completed=bool(dto.is_completed),
        )

    def update(self, db, user_id, row_id, dto):
        fields = _sent_fields(dto, nullable={"description", "task_id"})
        if "task_id" in fields:
            fields["task_id"] = _as_uuid(fields["task_id"])
        row = self.table.find(user_id, row_id)
        assert_valid_range(fields.get("start_time", row.start_time), fields.get("end_time", row.end_time))
        if dto.task_id:
            self.tasks.get_for_user(db, user_id, dto.task_id)
        return self._patch(user_id, row_id, **fields)


class FakeNotesService(FakeStore):
    """Réplica en memoria de las notas (más recientes primero)."""

    newest_first = True
    to_schema = staticmethod(note_to_response)

    def create(self, db, user_id, dto):
        return self._insert(user_id, title=dto.title, content=dto.content, audio_url=dto.audio_url)

    def update(self, db, user_id, row_id, dto):
        return self._patch(user_id, row_id, title=dto.title, content=dto.content, audio_url=dto.audio_url)


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
    svc = FakeScheduleService()
    svc.tasks = fake_tasks
    return _install(monkeypatch, schedule_api, "schedule_service", svc)


_FAKE_FIXTURES = ("fake_users", "fake_accounts", "fake_categories", "fake_tasks", "fake_notes", "fake_schedule")


@pytest.fixture
def client(request) -> TestClient:
    for name in _FAKE_FIXTURES:
        request.getfixturevalue(name)
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
