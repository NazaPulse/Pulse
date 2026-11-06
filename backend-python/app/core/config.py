"""Configuración central (12-factor). Espejo de `.env` del Backend A (NestJS).

- PostgreSQL: valores por defecto = docker-compose.yml de la raíz (usuario y base
  "pulse"). init.sql es la única fuente de verdad del esquema: la app no crea ni
  migra tablas. Los secretos (`DB_PASSWORD`, `JWT_SECRET`) no tienen default:
  deben venir del entorno.
- JWT: mismo contrato que el Backend A.
- Argon2id: perfil OWASP documentado en openapi.yaml (`RegisterRequest.password`).
"""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Cada campo se lee de la variable de entorno homónima en mayúsculas
    (por ejemplo, `db_host` de `DB_HOST`)."""

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    port: int = 8000
    node_env: str = "development"

    db_host: str = "localhost"
    db_port: int = 5432
    db_user: str = "pulse"
    db_password: str
    db_name: str = "pulse"

    jwt_secret: str
    jwt_expires_in_seconds: int = 3600
    jwt_algorithm: str = "HS256"

    argon2_memory_cost: int = 19456
    argon2_time_cost: int = 2
    argon2_parallelism: int = 1

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
