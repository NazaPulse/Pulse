# Pulse — Frontend B (Vue 3 + Vite + TypeScript + Tailwind)

Vistas de autenticación (Issue #6). **Paridad visual y funcional** con
`/frontend-react`: misma paleta, mismo maquetado responsive mobile-first, mismos
textos, mismos estados de carga/validación y mismo contrato (`openapi.yaml`).

## Stack

| Área | Elección | Equivalente en React |
|---|---|---|
| Build | Vite 8 | Vite |
| UI | Vue 3 + TypeScript (`<script setup lang="ts">`) | React 19 + TS |
| Estilos | TailwindCSS 4 (`@tailwindcss/vite`) — **mismas clases** | idem |
| Routing | `vue-router` 4 + navigation guard | `react-router-dom` 7 + `<ProtectedRoute>` |
| HTTP | Axios (misma instancia y helpers) | Axios |

## Mapa de equivalencias con /frontend-react

| React | Vue |
|---|---|
| `src/lib/{types,validation,api}.ts` | idénticos |
| `src/auth/{context,AuthProvider,useAuth}` | `src/auth/useAuth.ts` (estado singleton con `ref` + `watch`) |
| `src/components/*.tsx` | `src/components/*.vue` (Spinner, Alert, AuthCard, Field, SubmitButton) |
| `src/routes/ProtectedRoute.tsx` | `router.beforeEach` guard (`meta.requiresAuth` / `meta.guestOnly`) |
| `src/pages/{Login,Register,Dashboard}Page.tsx` | `src/pages/{Login,Register,Dashboard}View.vue` |
| `src/App.tsx` (`<BrowserRouter>`) | `src/App.vue` (`<RouterView/>`) + `src/router/index.ts` |

## Rutas

| Ruta | Vista | Protegida |
|---|---|---|
| `/login` | Inicio de sesión | no (`guestOnly`: si hay token → `/dashboard`) |
| `/register` | Registro | no (`guestOnly`) |
| `/dashboard` | Placeholder de sesión activa | **sí** (`requiresAuth`: sin token → `/login`) |
| `/` y `*` | Redirigen a `/login` | — |

El guard verifica la presencia del JWT en `localStorage` (clave
**`pulse.access_token`**, la misma que usa React).

## Variables de entorno

`cp .env.example .env`. Configuración **idéntica a React**:

| Variable | Descripción |
|---|---|
| `VITE_API_BASE_URL` | Base para Axios. Vacío = mismo origen → el proxy de Vite reenvía `/api/*` (evita CORS). Con URL, Axios pega directo (requiere CORS en el backend). |
| `VITE_DEV_PROXY_TARGET` | Destino del proxy `/api/*`. NestJS: `http://localhost:3000` · FastAPI: `http://localhost:8000`. |

## Puesta en marcha

```bash
cd frontend-vue
npm install
cp .env.example .env
# levantá un backend (NestJS :3000 o FastAPI :8000; ajustá VITE_DEV_PROXY_TARGET si usás :8000)
npm run dev            # http://localhost:5174   (React usa 5173; se pueden correr ambos)
```

## Verificación

```bash
npm run typecheck      # vue-tsc -b   -> 0 errores
npm run build          # vue-tsc -b && vite build
```

## Comportamiento (idéntico a React)

- **Botón deshabilitado** con email inválido, campos requeridos vacíos o
  contraseña de registro con menos de 12 caracteres.
- **Estado de carga**: spinner + `disabled` + texto ("Ingresando…", "Creando cuenta…").
- **Registro**: `201` → alerta de éxito y redirección a `/login` (con bandera
  `history.state.registered` que Login muestra como aviso); `400` → muestra el
  `message` de la API (string, o lista de strings unida con ` · `).
- **Login**: `200` → guarda `access_token` en `localStorage['pulse.access_token']`
  y estado de sesión, redirige a `/dashboard`; `401` / `400` → mensaje claro en
  pantalla ("Credenciales incorrectas." o el `message` del backend).
- El token se envía como `Authorization: Bearer <access_token>` en Axios.
