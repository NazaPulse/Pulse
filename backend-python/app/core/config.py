"""Configuración central (12-factor). Espejo de `.env` del Backend A (NestJS)."""
from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # App
    port: int = Field(default=8000, alias="PORT")
    node_env: str = Field(default="development", alias="NODE_ENV")

    # PostgreSQL — valores por defecto = docker-compose.yml de la raíz
    # (POSTGRES_USER/PASSWORD/DB => "pulse"). init.sql es la única fuente de verdad
    # del esquema: la app NO crea ni migra tablas.
    db_host: str = Field(default="localhost", alias="DB_HOST")
    db_port: int = Field(default=5432, alias="DB_PORT")
    db_user: str = Field(default="pulse", alias="DB_USER")
    db_password: str = Field(default="pulse", alias="DB_PASSWORD")
    db_name: str = Field(default="pulse", alias="DB_NAME")

    # JWT — mismo contrato que el Backend A
    jwt_secret: str = Field(
        default="dev-only-change-me-please-use-a-long-random-string", alias="JWT_SECRET"
    )
    jwt_expires_in_seconds: int = Field(default=3600, alias="JWT_EXPIRES_IN_SECONDS")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    # Argon2id — perfil OWASP documentado en openapi.yaml (RegisterRequest.password)
    argon2_memory_cost: int = Field(default=19456, alias="ARGON2_MEMORY_COST")
    argon2_time_cost: int = Field(default=2, alias="ARGON2_TIME_COST")
    argon2_parallelism: int = Field(default=1, alias="ARGON2_PARALLELISM")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.db_user}:{self.db_password}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
        )


@lru_cache
def get_settings() -> Settings:
    return Settings()
