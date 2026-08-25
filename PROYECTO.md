# PROYECTO.md — Especificación de Requisitos y Alcance del Sistema

## Datos del Proyecto
- **Nombre del Proyecto:** Pulse 
- **Materia:** Programación 3 — 5to Año 
- **Repositorio:** https://github.com/NazarenoMoreno1/Pulse.git

---

## 1. Descripción General del Sistema
**Pulse** es una plataforma web de gestión personal diseñada para centralizar el control financiero por presupuestos, la organización del tiempo diario mediante una distribución de 24 horas, la productividad (tareas y notas) y el acceso a noticias de interés.

El sistema resuelve la dispersión de información al depender de múltiples apps, unificando sus datos en un entorno con persistencia relacional y consumo de API REST.

---

## 2. Arquitectura y Stack Tecnológico

### 2.1. Base de Datos (Dockerizada)
- **Motor:** PostgreSQL 15 running on Docker Container.
- **Persistencia:** Volumen de datos montado (`postgres_data`) para garantizar la durabilidad fuera del ciclo de vida del contenedor.

### 2.2. Backend (Paridad 100% de API)
Servicio Backend que expone una API REST con arquitectura en capas y autenticación basada en tokens JWT.
- **Implementación A (Principal):** Node.js / TypeScript con **NestJS** (o Express.js).
- **Implementación B (Paridad Obligatoria):** Python 3.11+ con **FastAPI**.
- *Ambos backends consumen la misma base de datos PostgreSQL y responden exactamente a la misma especificación OpenAPI/Swagger.*

### 2.3. Frontend (Paridad 100% de Vistas y Flujo)
Aplicación Web Cliente Responsive (Mobile-First y Desktop).
- **Implementación A (Principal):** **React** (Vite + TypeScript) + TailwindCSS.
- **Implementación B (Paridad Obligatoria):** **Vue.js 3** (Vite + TypeScript) o **Svelte**.
- *Ambos frontends poseen paridad visual, idénticos flujos de usuario, ruteo y lógica de consumo de API.*

---

## 3. Límites del Sistema (In-Scope vs. Out-of-Scope)

Para asegurar la viabilidad técnica manteniendo el cumplimiento del requisito dual de frameworks:

### ✅ Dentro del Alcance (In-Scope)
1. **Gestión de Usuarios:** Registro, inicio de sesión (JWT) y perfil único.
2. **Finanzas Personales:** CRUD de Cuentas, CRUD de Categorías/Sobres de Presupuesto y Registro de Transacciones (Ingreso/Gasto), Gráficas de gastos, etc.
3. **Simulación/Integración de Mercado Pago:** Sincronización de movimientos a través de API Key / Mocked Webhook de entrada.
4. **Rutina 24/7:** Visualización del gráfico de dona de las 24hs del día y asignación de bloques horarios por categoría.
5. **Productividad Básica:** CRUD de Tareas (To-Do list con prioridades) y CRUD de Notas/Ideas.
6. **Lector de Noticias:** Consumo de Feeds RSS públicos para mostrar un resumen diario de 5 noticias.
7. **Despliegue Local:** Entorno orquestado mediante `docker-compose.yml`.

### ❌ Fuera del Alcance (Out-of-Scope)
1. Aplicaciones móviles nativas (iOS / Android).
2. Chat o colaboración multiusuario en tiempo real (WebSockets).
3. Procesamiento de pagos reales o transacciones bancarias en producción.
4. Notificaciones push nativas del sistema operativo (se gestionan alertas dentro de la app web).
5. IA o procesamiento de lenguaje natural para categorización automática de notas.

---

## 4. Alcances Funcionales (Casos de Uso y Reglas de Negocio)

### Módulo 0: Autenticación y Autorización
- **RF-01 (Registro de Usuario):** El sistema debe permitir el registro de usuarios validando email único y contraseña con hash (bcrypt).
- **RF-02 (Login JWT):** Emisión de token de acceso JWT al autenticarse correctamente.
- **RF-03 (Protección de Rutas):** Todos los endpoints de datos deben requerir el Header `Authorization: Bearer <token>`.

### Módulo 1: Finanzas Personales & Presupuesto
- **RF-04 (Gestión de Cuentas):** Crear, listar, editar y desactivar cuentas físicas/virtuales (ej. Banco, Mercado Pago, Efectivo) con su saldo actual.
- **RF-05 (Sobres de Presupuesto):** Crear categorías de gasto con un límite mensual asignado.
- **RF-06 (Registro de Transacciones):** Crear ingresos o egresos. **Regla de Negocio:** Al registrar un egreso, el backend resta automáticamente el monto del saldo de la `Account` elegida y suma el gasto a la `Category`.
- **RF-07 (Importación MP):** Endpoint para importar movimientos pendientes de clasificar.

### Módulo 2: Rutina 24/7 (Distribución del Tiempo)
- **RF-08 (Categorías de Tiempo):** Definir actividades (Trabajo, Sueño, Ocio, Estudio, etc.) con un color asignado.
- **RF-09 (Asignación de Horas):** Cargar la cantidad de horas diarias destinadas a cada actividad.
- **Regla de Negocio:** La suma total de horas asignadas para un día no puede superar las 24 horas. El sistema debe calcular en tiempo real las "Horas restantes/Disponibles".
- **RF-10 (Gráfico Circular):** Renderizar un gráfico interactivo (Dona/Pie) en el frontend con la distribución porcentual y horaria del día elegido.

### Módulo 3: Productividad & Notas
- **RF-11 (CRUD de Tareas):** Crear tareas con fecha de vencimiento, prioridad (Baja, Media, Alta) y estado (Pendiente, Completada).
- **RF-12 (CRUD de Notas):** Crear notas con título, contenido en texto plano/markdown y etiquetas de búsqueda. Y poder utilizar audios grabados como notas.

### Módulo 4: Noticias Relevantes
- **RF-13 (Feed de Noticias):** Consultar un servicio externo (RSS/API de noticias) y presentar una lista formateada de noticias con título, bajada y link externo. De Temas Específicos.

---

## 5. Alcances No Funcionales

- **ANF-01 (Mantenibilidad & Paridad):** Los dos backends (NestJS y FastAPI) deben cumplir con el 100% de los mismos contratos de entrada/salida HTTP (JSON) definidos en la especificación OpenAPI.
- **ANF-02 (Seguridad):** Almacenamiento seguro de contraseñas mediante hashing (`bcrypt` o `argon2`). No exponer claves secretas en el repositorio (uso estricto de `.env`).
- **ANF-03 (Performance & Latencia):** Tiempos de respuesta de la API menores a 200ms para consultas CRUD bajo condiciones normales de prueba local.
- **ANF-04 (Usabilidad & Responsive):** La interfaz de usuario debe ser 100% adaptable a pantallas móviles (375px+) y de escritorio (1024px+).
- **ANF-05 (Desplegabilidad):** El comando `docker-compose up` debe ser capaz de levantar el contenedor de PostgreSQL con su esquema inicial funcional en menos de 60 segundos.

---

## 6. Objetivos Específicos y Medibles 

1. **[Arquitectura Base]** Construir y levantar mediante Docker Compose un contenedor con PostgreSQL 15 y volumen persistente en la primera semana de trabajo.
2. **[Backend Dual]** Implementar el 100% de los endpoints de la API REST en dos frameworks distintos (NestJS y FastAPI), logrando paridad del 100% verificable mediante una colección de pruebas en Postman.
3. **[Frontend Dual]** Desarrollar la aplicación cliente consumiendo la API en dos frameworks distintos (React y Vue.js), ofreciendo la misma experiencia de usuario y ruteo en ambas versiones.
4. **[Calidad de Código y Flujo]** Mantener la rama `main` protegida, integrando el 100% de los cambios mediante Pull Requests asociados a Issues y mensajes de commit bajo la convención *Conventional Commits*.
5. **[Documentación]** Exponer la documentación interactiva de la API (Swagger/OpenAPI) en la ruta `/api/docs` de ambos backends.
