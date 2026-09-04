# Pulse — Frontend A (React + Vite + TypeScript + Tailwind)

Vistas de autenticación (Issue #5). Consume el contrato `openapi.yaml` de la raíz
(`POST /api/auth/register`, `POST /api/auth/login`) contra cualquiera de los dos
backends (NestJS `:3000` o FastAPI `:8000`).

## Stack

| Área | Elección |
|---|---|
| Build | Vite 8 |
| UI | React 19 + TypeScript |
| Estilos | TailwindCSS 4 (`@tailwindcss/vite`), diseño **mobile-first** |
| Routing | `react-router-dom` 7 |
| HTTP | Axios |
| Lint | oxlint |

## Estructura

```
src/
  main.tsx                 Punto de entrada
  App.tsx                  <BrowserRouter> + rutas
  index.css                @import "tailwindcss"
  lib/
    types.ts               Espejo de components.schemas de openapi.yaml
    validation.ts          Reglas de email / password (minLength 12 del contrato)
    api.ts                 Instancia Axios + registerRequest / loginRequest + extractErrorMessage
  auth/
    context.ts             AuthContext + clave de localStorage
    AuthProvider.tsx       Estado de sesión + sync con localStorage + header Authorization
    useAuth.ts             Hook useAuth()
  components/
    AuthCard.tsx  Field.tsx  SubmitButton.tsx  Spinner.tsx  Alert.tsx
  routes/
    ProtectedRoute.tsx     Redirige a /login si no hay token
  pages/
    LoginPage.tsx  RegisterPage.tsx  DashboardPage.tsx
```

## Rutas

| Ruta | Vista | Protegida |
|---|---|---|
| `/login` | Formulario de inicio de sesión | no |
| `/register` | Formulario de registro | no |
| `/dashboard` | Placeholder tras login | **sí** (requiere `access_token`) |
| `/` y `*` | Redirigen a `/login` | — |

## Variables de entorno

`cp .env.example .env` y ajustá:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | URL base para Axios. **Vacío** = mismo origen y el proxy de Vite reenvía `/api/*` (recomendado en dev, evita CORS). Con URL (ej. `http://localhost:3000`) Axios pega directo (requiere CORS habilitado en el backend). |
| `VITE_DEV_PROXY_TARGET` | Destino del proxy de Vite para `/api/*`. Backend A (NestJS): `http://localhost:3000`. Backend B (FastAPI): `http://localhost:8000`. |

## Puesta en marcha

```bash
cd frontend-react
npm install
cp .env.example .env

# 1) Levantá un backend (NestJS en :3000  o  FastAPI en :8000)
#    y ajustá VITE_DEV_PROXY_TARGET en .env si usás el :8000.

# 2) Servidor de desarrollo
npm run dev            # http://localhost:5173
```

## Verificación

```bash
npm run lint           # oxlint  -> 0 errores
npm run typecheck      # tsc -b  -> 0 errores
npm run build          # tsc -b && vite build
```

## Comportamiento de los formularios

- **Botón deshabilitado** mientras el email sea inválido, falten campos
  requeridos o la contraseña de registro tenga menos de 12 caracteres.
- **Estado de carga**: spinner + `disabled` + texto ("Ingresando…", "Creando cuenta…").
- **Registro**: `201` → alerta de éxito y redirección a `/login`; `400` →
  muestra el `message` de la API (string o lista de strings unida con ` · `).
- **Login**: `200` → guarda `access_token` en `localStorage`
  (`pulse.access_token`) y estado de Auth, redirige a `/dashboard`;
  `401` / `400` → mensaje claro en pantalla ("Credenciales incorrectas." o el
  `message` devuelto por la API).
- El token se envía como `Authorization: Bearer <access_token>` en Axios.
