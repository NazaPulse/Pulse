# Pulse — Backend B (FastAPI / Python)

Implementación **B** del Módulo 0 (Autenticación). Paridad 100 % con el Backend A
(`/backend-node`, NestJS) y con `openapi.yaml` de la raíz: mismos nombres de campos
JSON, mismos esquemas de error y mismos códigos HTTP.

## Stack

| Área | Elección |
|---|---|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x (sync, `psycopg2`) |
| Hashing | **Argon2id** vía `argon2-cffi` — perfil OWASP `m=19456, t=2, p=1`, hash 32 B, salt 16 B. **Sin bcrypt.** |
| JWT | PyJWT (HS256, claims `sub` + `email`, exp 3600 s) |
| Esquema DB | `init.sql` es la única fuente de verdad — la app **no** crea ni migra tablas |

## Estructura (por capas)

```
app/
  main.py              # App FastAPI + handlers de error estilo NestJS
  core/config.py       # Settings (.env)
  core/security.py     # Emisión de JWT
  db/session.py        # Engine + sesión SQLAlchemy
  models/user.py       # ORM de la tabla `users`
  schemas/auth.py      # Pydantic: RegisterRequest, LoginRequest, UserPublic, LoginResponse, ErrorResponse
  services/hashing.py  # Argon2Hasher (Argon2id)
  services/users.py    # Acceso a datos de `users`
  services/auth.py     # Lógica RF-01 / RF-02
  api/auth.py          # Router: POST /api/auth/register, POST /api/auth/login
  errors.py            # Traducción de errores de validación al fraseo class-validator
tests/                 # pytest (hashing + contrato de endpoints, sin depender de PostgreSQL)
```

## Puesta en marcha

```bash
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # valores por defecto = docker-compose.yml de la raíz

# PostgreSQL debe estar arriba (contenedor pulse_postgres de docker-compose.yml).
# Levantar en un puerto alternativo al Backend A (que usa 3000):
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/api/docs`
- OpenAPI JSON: `http://localhost:8000/api/openapi.json`

> **Nota sobre `pulse_db`:** `docker-compose.yml` crea la base **`pulse`** (no `pulse_db`),
> igual que consume el Backend A. `DB_NAME` es configurable en `.env`. Para usar el
> nombre `pulse_db`:
> ```bash
> docker exec pulse_postgres createdb -U pulse pulse_db
> docker exec -i pulse_postgres psql -U pulse -d pulse_db < ../init.sql
> # y poné DB_NAME=pulse_db en .env
> ```

## Tests

```bash
source .venv/bin/activate
python -m pytest
```

## Pruebas manuales (curl)

```bash
BASE=http://localhost:8000

# 1) Registro — 201 Created + UserPublic
curl -i -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@pulse.app","password":"S3gura-y-larga_2026!","full_name":"Ada Lovelace"}'

# 2) Email duplicado — 400 Bad Request (message string)
curl -i -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@pulse.app","password":"S3gura-y-larga_2026!"}'

# 3) Validación — 400 Bad Request (message array)
curl -i -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"no-es-email","password":"corta"}'

# 4) Login — 200 OK -> {"access_token":"..."}
curl -i -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@pulse.app","password":"S3gura-y-larga_2026!"}'

# 5) Credenciales inválidas — 401 Unauthorized
curl -i -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"ada@pulse.app","password":"incorrecta-999"}'
```
