<!-- evaluacion:inicio -->
# Evaluación — NazaPulse/Pulse

> Documento **generado automáticamente** por la cátedra de Programación III (RepoSense + análisis de calidad). **No editar a mano**: se regenera en cada evaluación.
> Rama evaluada: `main`. Análisis **heurístico** (regex + métricas): es una criba para orientar la revisión, **no una nota**.
> Generado: 2026-10-17.

## 1. Veredicto

| Aspecto | Resultado |
|---|---|
| Tipo de proyecto | frontend |
| Índice de calidad de servicios | **3/100** (mínimo 60) |
| Criterios cumplidos | **9/15** |
| Aprobado (semáforo) | **NO** |
| Código (LOC) | 15,015 |
| Archivos de código | 254 |
| Capas detectadas | vistas, servicios, estado |
| Tope por duplicación | `DUP>=15%` → índice ≤ 50 |

> **Aprobado** exige cumplir **todos** los criterios del semáforo. No es una nota: sirve para ordenar y priorizar la revisión.

## 2. Autoría (RepoSense)

| Autor | Commits | Código (LOC) | Tests (LOC) | Docs (LOC) | Días activos | % del código |
|---|---:|---:|---:|---:|---:|---:|
| Nazareno Cruz Moreno | 27 | 14,436 | 3,077 | 432 | 11 | 100% |

> _El LOC de autoría lo calcula RepoSense sobre el historial y puede diferir del LOC de código del análisis de calidad (que mira solo el estado de `main`)._

## 3. Aspectos evaluados

Cada aspecto indica **qué mide**, **por qué importa** y **tu resultado**. Cuando el resultado está en rojo, se agregan preguntas para **investigar la causa** (no hay recetas: entender el porqué es parte de la evaluación).

### 1. Índice de calidad de servicios (indice) — A REVISAR

- **Qué mide:** Un resumen numérico (0-100) que combina todas las señales y métricas del análisis, con topes duros por duplicación.
- **Por qué importa:** Ordena y prioriza la revisión: un índice bajo indica varias señales que conviene mirar juntas.
- **Tu resultado:** índice **3/100** _(mínimo 60)_
- **Para investigar la causa:**
    - ¿En qué momento del proyecto se concentraron los problemas (arranque, integración de partes, cierre)?
    - ¿El índice bajó por muchas señales chicas o por una o dos graves?
    - ¿Se revisó el código integrado después de unir el trabajo de cada integrante?

### 2. Duplicación (DRY) (duplicacion) — A REVISAR

- **Qué mide:** Porcentaje de bloques de código repetidos (similitud) en el repositorio.
- **Por qué importa:** Cada copia se mantiene por separado: un arreglo hay que repetirlo y los defectos se multiplican.
- **Tu resultado:** **20.5%** de duplicación _(máximo 15%)_
- **Para investigar la causa:**
    - ¿El trabajo se repartió por pantallas o archivos y se integró copiando y pegando bloques?
    - ¿Qué zonas del sistema cambiaron juntas más de una vez (señal de lógica compartida)?
    - ¿Hubo un lugar común acordado para la lógica repetida antes de empezar, o cada integrante resolvió lo suyo?

### 3. Secretos hardcodeados (SEC) — A REVISAR

- **Qué mide:** Credenciales, tokens o claves escritos directamente en el código en vez de leerse de variables de entorno.
- **Por qué importa:** Un secreto en el repositorio queda expuesto en el historial aunque luego se borre, y compromete al servicio y a sus usuarios.
- **Tu resultado:** **2** secreto(s) hardcodeado(s) _(máximo 0)_
- **Para investigar la causa:**
    - ¿De dónde salió ese valor: un ejemplo, una prueba rápida, una copia de un compañero?
    - ¿En qué momento entró al código y por qué no se sacó antes de cerrar la tarea?
    - ¿Se acordó cómo manejar credenciales antes de empezar, o se postergó para el final?

### 4. Consultas SQL por concatenación (SQL) — OK

- **Qué mide:** Consultas SQL armadas concatenando o interpolando valores en vez de usar parámetros.
- **Por qué importa:** Es la puerta clásica a inyección: un valor que llega de afuera puede cambiar la consulta.
- **Tu resultado:** **0** consulta(s) SQL por concatenación _(máximo 0)_

### 5. Separación en capas (capas) — OK

- **Qué mide:** Si el código está separado en capas reconocibles (backend: presentación / lógica / datos; frontend: vistas / servicios / estado).
- **Por qué importa:** Sin separación, cada archivo hace de todo y cualquier cambio toca varios lugares a la vez.
- **Tu resultado:** **3** capa(s) detectada(s): vistas, servicios, estado _(mínimo 2 capas (a partir de 150 LOC))_

### 6. Acceso a datos dentro del componente (HTTP) — OK

- **Qué mide:** Llamadas `fetch`/`axios` dentro de componentes de UI en vez de una capa de servicios/API.
- **Por qué importa:** Duplica la lógica de acceso a datos y acopla la vista al backend: un cambio de API toca muchos componentes.
- **Tu resultado:** **0** llamada(s) a la API dentro de componente(s) _(máximo 0)_

### 7. Depuración olvidada (DBG) — OK

- **Qué mide:** Mensajes de depuración olvidados (`console.log`, `print`, `debugger`).
- **Por qué importa:** Generan ruido en los registros, pueden filtrar datos y dan sensación de código sin terminar.
- **Tu resultado:** **0** mensaje(s) de depuración olvidado(s) _(máximo 0)_

### 8. Uso del tipo `any` (Any) — OK

- **Qué mide:** Uso de `any` en TypeScript, que desactiva la verificación de tipos.
- **Por qué importa:** Se pierde la ayuda del compilador justo donde los datos vienen de afuera (API, formularios).
- **Tu resultado:** **0** uso(s) de `any` _(máximo 2)_

### 9. Componente demasiado grande (BigC) — A REVISAR

- **Qué mide:** Componentes de UI muy extensos, que suelen mezclar render, estado y lógica.
- **Por qué importa:** Son difíciles de leer, probar y reutilizar, y sus cambios tienen efectos inesperados.
- **Tu resultado:** **6** componente(s) demasiado grande(s) _(máximo 1)_
- **Para investigar la causa:**
    - ¿El componente creció a medida que se agregaban requisitos, sin volver a dividirlo?
    - ¿Mezcla responsabilidades distintas (mostrar, calcular, pedir datos)?
    - ¿Se dividió por pantalla o por unidad de responsabilidad?

### 10. Baja cohesión (Coh) — A REVISAR

- **Qué mide:** Una clase o unidad cuyos métodos y campos no están relacionados entre sí.
- **Por qué importa:** Una unidad que cambia por motivos distintos es frágil y cuesta entenderla.
- **Tu resultado:** **7** unidad(es) con baja cohesión _(máximo 0)_
- **Para investigar la causa:**
    - ¿La unidad agrupa cosas que en realidad pertenecen a lugares distintos?
    - ¿Cambia por motivos diferentes según la tarea?
    - ¿Se pensó su responsabilidad antes de escribirla, o se fue agregando?

### 11. Complejidad alta (Compl) — OK

- **Qué mide:** Complejidad ciclomática: cantidad de caminos posibles dentro de una función (condicionales, bucles, casos).
- **Por qué importa:** Muchos caminos = difícil de seguir y de probar; suelen esconderse casos sin cubrir.
- **Tu resultado:** **42** bloque(s) de complejidad alta _(máximo 5 por 1000 LOC (tenés 15015 LOC))_

### 12. Funciones/métodos largos o con muchos parámetros (Tam) — OK

- **Qué mide:** Tamaño de las funciones/métodos y cantidad de parámetros.
- **Por qué importa:** Una función que hace varias cosas cuesta leerla, nombrarla y reutilizarla.
- **Tu resultado:** **52** función/método(s) largos o con muchos parámetros _(máximo 10 por 1000 LOC)_

### 13. Acoplamiento alto (Acop) — A REVISAR

- **Qué mide:** Cuánto depende una unidad de las partes internas de otra.
- **Por qué importa:** Piezas muy enlazadas hacen que un cambio se propague y que sea difícil reemplazar partes.
- **Tu resultado:** **39** unidad(es) con acoplamiento alto _(máximo 2 por 1000 LOC)_
- **Para investigar la causa:**
    - ¿Las piezas se conocen en detalle entre sí (acceden a campos o estructuras internas)?
    - ¿El acceso a datos ocurre desde lugares que no son los responsables?
    - ¿Se puede cambiar una parte sin tocar las demás?

### 14. Tests automatizados (Tests) — OK

- **Qué mide:** Cantidad de archivos de test separados del código.
- **Por qué importa:** Sin tests no hay red de seguridad: un cambio puede romper algo sin que se note hasta la demo.
- **Tu resultado:** **26** archivo(s) de test _(mínimo 5)_

### 15. Vistas del frontend (Vistas) — OK

- **Qué mide:** Cantidad de vistas/componentes de pantalla del frontend.
- **Por qué importa:** El frontend se mide por pantallas: pocas vistas sugiere poca cobertura de la interfaz pedida.
- **Tu resultado:** **91** vista(s)/componente(s) _(mínimo 8)_

## 4. Anexo: dónde mirar

Archivos donde el análisis encontró cada señal en rojo (sin número de línea, a propósito):

**Secretos hardcodeados (SEC)** — 2 archivo(s):
- `backend-node/src/dto/auth/login-response.dto.ts`
- `backend-python/app/schemas/auth.py`

**Componente demasiado grande (BigC)** — 6 archivo(s):
- `frontend-react/src/components/Notes/NoteComposer.tsx`
- `frontend-react/src/pages/PomodoroPage.tsx`
- `frontend-react/src/pages/TasksPage.tsx`
- `frontend-vue/src/components/Notes/NoteComposer.vue`
- `frontend-vue/src/pages/PomodoroView.vue`
- `frontend-vue/src/pages/TasksView.vue`

**Baja cohesión (Coh)** — 5 archivo(s):
- `backend-python/app/schemas/transaction.py`
- `backend-python/app/services/auth.py`
- `backend-python/app/services/finances.py`
- `backend-python/app/services/transactions.py`
- `backend-python/tests/conftest.py`

**Acoplamiento alto (Acop)** — 39 archivo(s):
- `backend-node/src/controllers/accounts.controller.ts`
- `backend-node/src/controllers/auth.controller.ts`
- `backend-node/src/controllers/categories.controller.ts`
- `backend-node/src/controllers/finances.controller.ts`
- `backend-node/src/controllers/notes.controller.ts`
- `backend-node/src/controllers/tasks.controller.ts`
- `backend-node/src/controllers/transactions.controller.ts`
- `backend-node/src/dto/accounts/create-account.dto.ts`
- `backend-node/src/dto/accounts/update-account.dto.ts`
- `backend-node/src/dto/auth/register.dto.ts`
- `backend-node/src/dto/categories/create-category.dto.ts`
- `backend-node/src/dto/categories/update-category.dto.ts`
- `backend-node/src/dto/notes/create-note.dto.ts`
- `backend-node/src/dto/tasks/create-task.dto.ts`
- `backend-node/src/dto/tasks/task-response.dto.ts`
- `backend-node/src/dto/tasks/update-task.dto.ts`
- `backend-node/src/dto/transactions/create-transaction.dto.ts`
- `backend-node/src/models/transaction.entity.ts`
- `backend-node/src/services/accounts.service.ts`
- `backend-node/src/services/auth.service.ts`
- `backend-node/src/services/categories.service.ts`
- `backend-node/src/services/finances.service.ts`
- `backend-node/src/services/hashing/argon2-hashing.service.ts`
- `backend-node/src/services/notes.service.ts`
- `backend-node/src/services/tasks.service.ts`
- `backend-node/src/services/transactions.service.ts`
- `backend-python/app/core/config.py`
- `backend-python/app/models/account.py`
- `backend-python/app/models/transaction.py`
- `backend-python/app/schemas/auth.py`
- `backend-python/app/schemas/transaction.py`
- `backend-python/app/services/accounts.py`
- `backend-python/app/services/auth.py`
- `backend-python/app/services/categories.py`
- `backend-python/app/services/finances.py`
- `backend-python/app/services/hashing.py`
- `backend-python/app/services/notes.py`
- `backend-python/app/services/tasks.py`
- `backend-python/app/services/transactions.py`

---
_Informe generado por la cátedra. Los umbrales corresponden al perfil `exigente`. Ante dudas, revisá el archivo señalado y el criterio en `CRITERIOS-CALIDAD.md`._
<!-- evaluacion:fin -->
