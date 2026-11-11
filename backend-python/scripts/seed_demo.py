"""Seed de la cuenta de demostración de Pulse.

Uso (desde `backend-python/`, con el `.env` existente):

    python -m scripts.seed_demo

Idempotente: borra al usuario demo (y, por `ON DELETE CASCADE` de init.sql, todos
sus registros) y lo vuelve a crear en una única transacción. La conexión a la base
sale de `Settings` (`.env`); no hay credenciales de infraestructura en el código.

El Pomodoro no tiene tabla propia: su historial se modela como bloques del
Cronograma completados con `actual_duration_minutes` (ver `time_blocks` en
openapi.yaml), que es como el contrato registra el tiempo real de foco.
"""
from __future__ import annotations

import datetime as dt
import decimal
import logging
import math
import os
import struct
import wave
from dataclasses import dataclass

from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.account import Account
from app.models.category import Category
from app.models.note import Note
from app.models.task import Task
from app.models.time_block import TimeBlock
from app.models.transaction import Transaction
from app.models.user import User
from app.services.hashing import hasher
from app.services.notes import AUDIO_PUBLIC_PREFIX, AUDIO_UPLOAD_DIR

logger = logging.getLogger("pulse.seed_demo")

DEMO_EMAIL = "pulseprueba@pulse.com"
DEMO_NAME = "PulsePrueba"
# Credencial pública de la demo (no es un secreto de infraestructura);
# se puede sobrescribir con DEMO_USER_PASSWORD.
DEMO_PASSWORD = os.environ.get("DEMO_USER_PASSWORD", "Pulse123!")

POMODORO_MINUTES = 25
DEMO_AUDIO_FILE = "demo-reunion-equipo.wav"

# Paleta "Pulse Dark Cyan" (frontend-shared/chartPalette.ts y schedule.ts).
CATEGORIES = [
    # nombre, sobre mensual, color, ícono (ICON_OPTIONS del frontend)
    ("Comida", 180_000, "#7FF3F9", "utensils"),
    ("Servicios", 90_000, "#7DB7FF", "home"),
    ("Sueldo", 0, "#86E3AE", "tag"),
    ("Ocio", 60_000, "#FF9FC5", "coffee"),
    ("Inversiones", 150_000, "#B9A0FF", "book"),
    ("Salud", 50_000, "#FFE08A", "heart"),
]

ACCOUNTS = [
    # nombre, tipo (enum openapi), saldo inicial
    ("Mercado Pago", "wallet", 85_000),
    ("Banco Galicia", "bank", 420_000),
    ("Efectivo", "cash", 60_000),
]


@dataclass(frozen=True)
class Movement:
    days_ago: int
    hour: int
    account: str
    category: str
    kind: str
    amount: int
    description: str


MOVEMENTS = [
    Movement(29, 9, "Banco Galicia", "Sueldo", "income", 950_000, "Sueldo mensual"),
    Movement(28, 13, "Mercado Pago", "Comida", "expense", 42_300, "Supermercado Coto"),
    Movement(27, 10, "Banco Galicia", "Servicios", "expense", 28_500, "Factura de luz Edenor"),
    Movement(25, 21, "Mercado Pago", "Ocio", "expense", 18_900, "Cine y cena"),
    Movement(24, 11, "Banco Galicia", "Inversiones", "expense", 120_000, "Plazo fijo UVA"),
    Movement(22, 16, "Efectivo", "Salud", "expense", 14_200, "Farmacia"),
    Movement(20, 12, "Mercado Pago", "Comida", "expense", 9_800, "Almuerzo con el equipo"),
    Movement(18, 10, "Banco Galicia", "Servicios", "expense", 21_000, "Internet Fibertel"),
    Movement(16, 18, "Mercado Pago", "Sueldo", "income", 180_000, "Proyecto freelance"),
    Movement(14, 20, "Efectivo", "Ocio", "expense", 12_500, "Salida con amigos"),
    Movement(12, 9, "Mercado Pago", "Comida", "expense", 37_600, "Compra semanal Carrefour"),
    Movement(10, 15, "Banco Galicia", "Salud", "expense", 32_000, "Consulta odontológica"),
    Movement(8, 11, "Banco Galicia", "Inversiones", "income", 46_500, "Rendimiento FCI"),
    Movement(6, 19, "Mercado Pago", "Ocio", "expense", 9_999, "Suscripción streaming"),
    Movement(5, 13, "Efectivo", "Comida", "expense", 8_400, "Verdulería"),
    Movement(3, 10, "Banco Galicia", "Servicios", "expense", 16_800, "Gas Metrogas"),
    Movement(2, 17, "Mercado Pago", "Salud", "expense", 25_000, "Cuota gimnasio"),
    Movement(1, 21, "Mercado Pago", "Comida", "expense", 15_600, "Delivery pizza"),
]

TASKS = [
    # título, descripción, prioridad, estado, vence en (días), minutos estimados
    ("Preparar presentación final", "Diapositivas y demo en vivo de Pulse", "high", "pending", 1, 120),
    ("Revisar contrato OpenAPI", "Validar que ambos backends respeten openapi.yaml", "high", "completed", -2, 60),
    ("Pagar tarjeta de crédito", "Vence el resumen de Galicia", "high", "pending", 3, 15),
    ("Estudiar para el parcial", "Unidades 4 a 6 de Bases de Datos", "medium", "pending", 5, 180),
    ("Actualizar README", "Agregar capturas y pasos de instalación", "medium", "completed", -1, 45),
    ("Turno con el médico", "Control anual", "medium", "pending", 7, 60),
    ("Ordenar escritorio", None, "low", "completed", -3, 30),
    ("Leer capítulo de Clean Code", "Capítulo 3: Funciones", "low", "pending", 10, 40),
]

NOTES = [
    (
        "Ideas para la demo",
        "## Recorrido sugerido\n- Login con la cuenta demo\n- Dashboard de **Finanzas** con la dona por categoría\n"
        "- Tareas con prioridades\n- Pomodoro y Cronograma del día",
        None,
    ),
    (
        "Nota de voz: reunión de equipo",
        "Resumen grabado de la daily: avanzar con el Gantt y revisar tests.",
        f"{AUDIO_PUBLIC_PREFIX}/{DEMO_AUDIO_FILE}",
    ),
    (
        "Lista de compras",
        "- Yerba\n- Café\n- Frutas\n- Pan integral",
        None,
    ),
    (
        "Recursos útiles",
        "Documentación de FastAPI: https://fastapi.tiangolo.com\nVideo de referencia: https://www.youtube.com/watch?v=0sOvCWFmrtA",
        None,
    ),
]

# Bloques del día de hoy (hora local): título, categoría, inicio, fin (horas), completado.
TODAY_BLOCKS = [
    ("Dormir", "sleep", (0, 0), (7, 0), True),
    ("Running en el parque", "exercise", (7, 30), (8, 30), True),
    ("Desarrollo de Pulse", "work", (9, 0), (13, 0), False),
    ("Reuniones y revisión de PRs", "work", (14, 0), (18, 0), False),
    ("Serie y lectura", "leisure", (20, 0), (22, 30), False),
]

POMODORO_SESSIONS = [
    # días atrás, hora de inicio, foco
    (1, 10, "Estudio de Bases de Datos"),
    (1, 16, "Refactor del módulo de finanzas"),
    (2, 11, "Escritura del informe"),
    (3, 9, "Tests del Cronograma"),
    (4, 15, "Diseño de la presentación"),
]


def _write_demo_audio(seconds: float = 2.0, rate: int = 16_000, freq: float = 440.0) -> None:
    """Genera la nota de voz simulada (tono suave) servida bajo `/uploads/audio`."""
    AUDIO_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    frames = b"".join(
        struct.pack("<h", int(8_000 * math.sin(2 * math.pi * freq * i / rate)))
        for i in range(int(seconds * rate))
    )
    with wave.open(str(AUDIO_UPLOAD_DIR / DEMO_AUDIO_FILE), "wb") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(rate)
        wav.writeframes(frames)


def _at(day: dt.date, hour: int, minute: int = 0) -> dt.datetime:
    return dt.datetime.combine(day, dt.time(hour, minute)).astimezone()


def _seed_finances(db: Session, user_id, now: dt.datetime) -> None:
    accounts = {name: Account(user_id=user_id, name=name, type=kind, balance=decimal.Decimal(initial))
                for name, kind, initial in ACCOUNTS}
    categories = {name: Category(user_id=user_id, name=name, target_amount=decimal.Decimal(limit),
                                 color=color, icon=icon)
                  for name, limit, color, icon in CATEGORIES}
    db.add_all([*accounts.values(), *categories.values()])
    db.flush()

    for m in MOVEMENTS:
        account = accounts[m.account]
        amount = decimal.Decimal(m.amount)
        account.balance += amount if m.kind == "income" else -amount
        db.add(Transaction(
            user_id=user_id,
            account_id=account.id,
            category_id=categories[m.category].id,
            amount=amount,
            type=m.kind,
            date=_at((now - dt.timedelta(days=m.days_ago)).date(), m.hour),
            description=m.description,
        ))


def _seed_productivity(db: Session, user_id, now: dt.datetime) -> None:
    db.add_all(
        Task(user_id=user_id, title=title, description=desc, priority=priority, status=status,
             due_date=_at((now + dt.timedelta(days=due)).date(), 18), estimated_minutes=minutes)
        for title, desc, priority, status, due, minutes in TASKS
    )
    db.add_all(Note(user_id=user_id, title=title, content=content, audio_url=audio)
               for title, content, audio in NOTES)


def _seed_schedule(db: Session, user_id, now: dt.datetime) -> None:
    today = now.date()
    for title, category, start, end, done in TODAY_BLOCKS:
        start_at, end_at = _at(today, *start), _at(today, *end)
        minutes = int((end_at - start_at).total_seconds() // 60) if done else 0
        db.add(TimeBlock(user_id=user_id, title=title, category=category, start_time=start_at,
                         end_time=end_at, actual_duration_minutes=minutes, is_completed=done))

    for days_ago, hour, focus in POMODORO_SESSIONS:
        start_at = _at(today - dt.timedelta(days=days_ago), hour)
        db.add(TimeBlock(
            user_id=user_id,
            title=f"Pomodoro: {focus}",
            description="Sesión de foco completada",
            category="work",
            start_time=start_at,
            end_time=start_at + dt.timedelta(minutes=POMODORO_MINUTES),
            actual_duration_minutes=POMODORO_MINUTES,
            is_completed=True,
        ))


def seed_demo(db: Session) -> User:
    """Recrea la cuenta demo desde cero (idempotente)."""
    db.execute(delete(User).where(User.email == DEMO_EMAIL))
    user = User(email=DEMO_EMAIL, full_name=DEMO_NAME, password_hash=hasher.hash(DEMO_PASSWORD))
    db.add(user)
    db.flush()

    now = dt.datetime.now().astimezone()
    _seed_finances(db, user.id, now)
    _seed_productivity(db, user.id, now)
    _seed_schedule(db, user.id, now)
    return user


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    with SessionLocal.begin() as db:
        user = seed_demo(db)
    _write_demo_audio()
    logger.info("Cuenta demo lista: %s (id %s)", DEMO_EMAIL, user.id)


if __name__ == "__main__":
    main()
