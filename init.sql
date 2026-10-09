-- Pulse — Esquema inicial (Issue #1: Infraestructura Base)
-- Ejecutado automáticamente por el contenedor de PostgreSQL en el primer arranque.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Módulo 0: Usuarios
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Módulo 1: Cuentas (Banco, Mercado Pago, Efectivo, etc.)
CREATE TABLE IF NOT EXISTS accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    type            VARCHAR(50) NOT NULL DEFAULT 'other',
    balance         NUMERIC(14,2) NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

-- Módulo 1: Categorías / Sobres de Presupuesto
CREATE TABLE IF NOT EXISTS categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(255) NOT NULL,
    monthly_limit   NUMERIC(14,2) NOT NULL DEFAULT 0,
    color           VARCHAR(20),
    icon            VARCHAR(50),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Issue #8: agrega `icon` para bases ya provisionadas antes de este cambio
-- (los scripts de init de Postgres solo corren una vez, en un volumen nuevo).
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

-- Issue #13/#14: Transacciones (ingresos/egresos). `amount` siempre positivo;
-- el signo del impacto sobre `accounts.balance` lo determina `type`.
CREATE TABLE IF NOT EXISTS transactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount          NUMERIC(14,2) NOT NULL CHECK (amount > 0),
    type            VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    date            TIMESTAMPTZ NOT NULL,
    description     VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id_date ON transactions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);

-- Módulo 2 (Issue #18/#19): Tareas (To-Do)
CREATE TABLE IF NOT EXISTS tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    description     VARCHAR(1000),
    priority        VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
    status          VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'completed')),
    due_date        TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Módulo 2 (Issue #18/#19): Notas multimedia (texto y/o audio)
CREATE TABLE IF NOT EXISTS notes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(200) NOT NULL,
    content         TEXT,
    audio_url       VARCHAR(2048),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
-- Verificación de Issue #1 completada
