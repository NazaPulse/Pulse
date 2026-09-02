"""Servicio de hashing de contraseñas.

Única implementación permitida en Pulse: **Argon2id** vía `argon2-cffi`
(equivalente a `Argon2HashingService` del Backend A). Prohibido bcrypt, scrypt
legacy, SHA-* «a secas» o cualquier hash sin factor de trabajo configurable.

Parámetros por defecto = perfil OWASP de openapi.yaml (RegisterRequest.password):
m = 19456 KiB, t = 2, p = 1, hash de 32 bytes, salt aleatorio de 16 bytes
(CSPRNG de la librería). Salida en formato PHC:
    $argon2id$v=19$m=19456,t=2,p=1$<salt-b64>$<hash-b64>
"""
from __future__ import annotations

import logging

from argon2 import PasswordHasher, Type
from argon2.exceptions import (
    InvalidHashError,
    VerificationError,
    VerifyMismatchError,
)

from app.core.config import get_settings

logger = logging.getLogger("pulse.hashing")


class Argon2Hasher:
    def __init__(self) -> None:
        s = get_settings()
        self._ph = PasswordHasher(
            time_cost=s.argon2_time_cost,       # t = 2
            memory_cost=s.argon2_memory_cost,   # m = 19456 KiB
            parallelism=s.argon2_parallelism,   # p = 1
            hash_len=32,
            salt_len=16,
            type=Type.ID,                       # <- Argon2id (variante híbrida obligatoria)
        )

    def hash(self, plain: str) -> str:
        """Deriva un hash PHC a partir de una contraseña en texto plano."""
        return self._ph.hash(plain)

    def verify(self, hashed: str, plain: str) -> bool:
        """Verifica en tiempo constante. `False` ante mismatch o hash corrupto."""
        try:
            return self._ph.verify(hashed, plain)
        except VerifyMismatchError:
            return False
        except (VerificationError, InvalidHashError) as exc:
            logger.warning("verify() falló para un hash almacenado: %s", exc)
            return False

    def needs_rehash(self, hashed: str) -> bool:
        """`True` si el hash quedó por debajo de la política vigente."""
        try:
            return self._ph.check_needs_rehash(hashed)
        except Exception:  # noqa: BLE001 - hash con formato desconocido => forzar rehash
            return True


hasher = Argon2Hasher()
