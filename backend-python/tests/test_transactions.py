"""Issue #14 — Transacciones y Resumen Financiero (paridad con Backend A).

- Endpoints: JWT obligatorio, validación con los mismos mensajes que
  `class-validator` y claves JSON idénticas a openapi.yaml.
- Servicio: lógica de doble impacto dentro de una única transacción de DB
  (commit si todo sale bien, rollback ante cualquier error).
"""
from __future__ import annotations

import datetime as dt
import decimal
import uuid
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

import app.api.finances as finances_api
import app.api.transactions as transactions_api
from app.models.account import Account
from app.models.category import Category
from app.schemas.transaction import (
    CategorySummary,
    FinancesSummary,
    Transaction as TransactionSchema,
    TransactionCreateRequest,
)
from app.services.transactions import INSUFFICIENT_FUNDS_MESSAGE, TransactionsService

ACCOUNT_ID = "7b2f9e10-1c3a-4b5d-8e6f-2a3b4c5d6e7f"
CATEGORY_ID = "3c4d5e6f-7081-4293-a4b5-c6d7e8f90a1b"
NOW = dt.datetime(2026, 9, 2, 18, 31, tzinfo=dt.timezone.utc)

EXPENSE = {
    "amount": 120.75,
    "type": "expense",
    "account_id": ACCOUNT_ID,
    "category_id": CATEGORY_ID,
    "date": "2026-09-02T18:30:00.000Z",
    "description": "Compra semanal",
}


def auth_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


# ── Endpoints ────────────────────────────────────────────────────────────────


@pytest.fixture
def stub_services(monkeypatch):
    calls: dict[str, object] = {}

    class StubTransactions:
        def list_for_user(self, db, user_id, filters):
            calls["list"] = (user_id, filters)
            return []

        def create(self, db, user_id, dto):
            calls["create"] = (user_id, dto)
            return TransactionSchema(
                id=str(uuid.uuid4()),
                amount=dto.amount,
                type=dto.type,
                account_id=dto.account_id,
                category_id=dto.category_id,
                date=dto.date,
                description=dto.description,
                created_at="2026-09-02T18:31:00.000Z",
                updated_at="2026-09-02T18:31:00.000Z",
            )

    class StubFinances:
        def get_summary(self, db, user_id):
            calls["summary"] = user_id
            return FinancesSummary(
                total_balance=18609.75,
                total_income=3500,
                total_expenses=200,
                by_category=[
                    CategorySummary(
                        category_id=CATEGORY_ID,
                        category_name="Supermercado",
                        icon="shopping-cart",
                        color="#FF5733",
                        total_amount=150,
                        percentage=75,
                    )
                ],
            )

    monkeypatch.setattr(transactions_api, "transactions_service", StubTransactions())
    monkeypatch.setattr(finances_api, "finances_service", StubFinances())
    return calls


@pytest.mark.parametrize(
    ("method", "path"),
    [("get", "/api/transactions"), ("post", "/api/transactions"), ("get", "/api/finances/summary")],
)
def test_routes_require_jwt(client, method, path):
    r = client.request(method, path, json=EXPENSE if method == "post" else None)
    assert r.status_code == 401
    assert r.json() == {"message": "Unauthorized", "error": "Unauthorized", "statusCode": 401}


def test_create_transaction_returns_201_with_exact_keys(client, token_for, stub_services):
    user_id, token = token_for()
    r = client.post("/api/transactions", json=EXPENSE, headers=auth_headers(token))
    assert r.status_code == 201
    assert set(r.json()) == {
        "id", "amount", "type", "account_id", "category_id",
        "date", "description", "created_at", "updated_at",
    }
    assert stub_services["create"][0] == user_id


def test_income_without_category_is_valid(client, token_for, stub_services):
    _, token = token_for()
    body = {"amount": 3500, "type": "income", "account_id": ACCOUNT_ID, "date": "2026-09-01T12:00:00.000Z"}
    r = client.post("/api/transactions", json=body, headers=auth_headers(token))
    assert r.status_code == 201
    assert r.json()["category_id"] is None


def test_income_with_explicit_null_category_returns_400_like_node(client, token_for, stub_services):
    # `@ValidateIf(... category_id !== undefined)` valida un `null` explícito.
    _, token = token_for()
    body = {"amount": 3500, "type": "income", "account_id": ACCOUNT_ID,
            "category_id": None, "date": "2026-09-01T12:00:00.000Z"}
    r = client.post("/api/transactions", json=body, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == ["category_id must be a UUID (required for expense)"]


def test_expense_without_category_returns_400(client, token_for, stub_services):
    _, token = token_for()
    body = {k: v for k, v in EXPENSE.items() if k != "category_id"}
    r = client.post("/api/transactions", json=body, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json() == {
        "message": ["category_id must be a UUID (required for expense)"],
        "error": "Bad Request",
        "statusCode": 400,
    }


@pytest.mark.parametrize(
    ("override", "message"),
    [
        ({"amount": 0}, "amount must be greater than 0"),
        ({"amount": -5}, "amount must be greater than 0"),
        ({"type": "transfer"}, "type must be one of the following values: income, expense"),
        ({"account_id": "nope"}, "account_id must be a UUID"),
        ({"date": "ayer"}, "date must be a valid ISO 8601 date string"),
        ({"extra": 1}, "property extra should not exist"),
    ],
)
def test_create_transaction_validation_messages(client, token_for, stub_services, override, message):
    _, token = token_for()
    r = client.post("/api/transactions", json={**EXPENSE, **override}, headers=auth_headers(token))
    assert r.status_code == 400
    assert message in r.json()["message"]
    assert "create" not in stub_services


@pytest.mark.parametrize(
    ("override", "messages"),
    [
        (
            {"amount": "10"},
            ["amount must be greater than 0", "amount must be a number conforming to the specified constraints"],
        ),
        (
            {"description": 123},
            ["description must be shorter than or equal to 255 characters", "description must be a string"],
        ),
    ],
)
def test_wrong_type_reports_all_field_messages_like_class_validator(
    client, token_for, stub_services, override, messages
):
    _, token = token_for()
    r = client.post("/api/transactions", json={**EXPENSE, **override}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == messages


def test_list_transactions_passes_filters(client, token_for, stub_services):
    user_id, token = token_for()
    r = client.get(
        "/api/transactions",
        params={"account_id": ACCOUNT_ID, "category_id": CATEGORY_ID, "type": "expense"},
        headers=auth_headers(token),
    )
    assert r.status_code == 200
    assert r.json() == []
    got_user, filters = stub_services["list"]
    assert got_user == user_id
    assert str(filters.account_id) == ACCOUNT_ID
    assert str(filters.category_id) == CATEGORY_ID
    assert filters.type.value == "expense"


@pytest.mark.parametrize(
    ("params", "message"),
    [
        ({"account_id": "x"}, "account_id must be a UUID"),
        ({"category_id": "x"}, "category_id must be a UUID"),
        ({"type": "x"}, "type must be one of the following values: income, expense"),
        ({"foo": "1"}, "property foo should not exist"),
    ],
)
def test_list_transactions_invalid_filters_return_400(client, token_for, stub_services, params, message):
    _, token = token_for()
    r = client.get("/api/transactions", params=params, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [message]


def test_summary_returns_exact_keys(client, token_for, stub_services):
    user_id, token = token_for()
    r = client.get("/api/finances/summary", headers=auth_headers(token))
    assert r.status_code == 200
    body = r.json()
    assert set(body) == {"total_balance", "total_income", "total_expenses", "by_category"}
    assert set(body["by_category"][0]) == {
        "category_id", "category_name", "icon", "color", "total_amount", "percentage",
    }
    assert stub_services["summary"] == user_id


# ── Servicio: doble impacto + commit/rollback ────────────────────────────────


def _account(balance: str) -> Account:
    return Account(
        id=uuid.UUID(ACCOUNT_ID),
        user_id=uuid.uuid4(),
        name="Cuenta",
        type="bank",
        balance=decimal.Decimal(balance),
        is_active=True,
    )


def _db(account: Account | None, category: Category | None) -> MagicMock:
    db = MagicMock()
    db.scalar.side_effect = [account, category]

    def _refresh(obj):
        obj.id = uuid.uuid4()
        obj.created_at = NOW
        obj.updated_at = NOW

    db.refresh.side_effect = _refresh
    return db


def _category() -> Category:
    return Category(id=uuid.UUID(CATEGORY_ID), user_id=uuid.uuid4(), name="Súper")


def test_expense_debits_account_and_commits():
    account = _account("500.00")
    db = _db(account, _category())

    result = TransactionsService().create(db, uuid.uuid4(), TransactionCreateRequest(**EXPENSE))

    assert account.balance == decimal.Decimal("379.25")
    db.add.assert_called_once()
    db.commit.assert_called_once()
    db.rollback.assert_not_called()
    assert result.amount == 120.75
    assert result.category_id == CATEGORY_ID
    assert result.date == "2026-09-02T18:30:00.000Z"


def test_expense_insufficient_funds_returns_400_and_rolls_back():
    account = _account("100.00")
    db = _db(account, _category())

    with pytest.raises(HTTPException) as exc:
        TransactionsService().create(db, uuid.uuid4(), TransactionCreateRequest(**EXPENSE))

    assert exc.value.status_code == 400
    assert exc.value.detail == INSUFFICIENT_FUNDS_MESSAGE
    assert account.balance == decimal.Decimal("100.00")
    db.add.assert_not_called()
    db.commit.assert_not_called()
    db.rollback.assert_called_once()


def test_foreign_or_missing_category_returns_404_and_rolls_back():
    account = _account("500.00")
    db = _db(account, None)

    with pytest.raises(HTTPException) as exc:
        TransactionsService().create(db, uuid.uuid4(), TransactionCreateRequest(**EXPENSE))

    assert exc.value.status_code == 404
    assert account.balance == decimal.Decimal("500.00")
    db.rollback.assert_called_once()


def test_foreign_or_missing_account_returns_404_and_rolls_back():
    db = _db(None, None)

    with pytest.raises(HTTPException) as exc:
        TransactionsService().create(db, uuid.uuid4(), TransactionCreateRequest(**EXPENSE))

    assert exc.value.status_code == 404
    db.rollback.assert_called_once()


def test_commit_failure_rolls_back():
    db = _db(_account("500.00"), _category())
    db.commit.side_effect = RuntimeError("db down")

    with pytest.raises(RuntimeError):
        TransactionsService().create(db, uuid.uuid4(), TransactionCreateRequest(**EXPENSE))

    db.rollback.assert_called_once()


def test_income_credits_account_without_category():
    account = _account("100.00")
    db = _db(account, None)
    dto = TransactionCreateRequest(
        amount=3500, type="income", account_id=ACCOUNT_ID, date="2026-09-01T12:00:00.000Z"
    )

    result = TransactionsService().create(db, uuid.uuid4(), dto)

    assert account.balance == decimal.Decimal("3600.00")
    assert db.scalar.call_count == 1  # no consulta categoría
    assert result.category_id is None
    assert result.description is None
    db.commit.assert_called_once()


def test_list_transactions_unknown_params_reported_first_like_node(client, token_for, stub_services):
    _, token = token_for()
    r = client.get("/api/transactions", params={"type": "x", "foo": "1"}, headers=auth_headers(token))
    assert r.status_code == 400
    assert r.json()["message"] == [
        "property foo should not exist",
        "type must be one of the following values: income, expense",
    ]
