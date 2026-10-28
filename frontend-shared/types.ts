// Espejo de components.schemas de openapi.yaml (raíz del repo).

export interface RegisterRequest {
  email: string
  password: string
  full_name?: string | null
}

export interface LoginRequest {
  email: string
  password: string
}

export interface UserPublic {
  id: string
  email: string
  full_name?: string | null
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  access_token: string
}

export interface ErrorResponse {
  statusCode: number
  error?: string
  message: string | string[]
}

export type AccountType = 'bank' | 'wallet' | 'cash'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  initial_balance: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AccountCreateRequest {
  name: string
  type: AccountType
  initial_balance: number
}

export interface AccountUpdateRequest {
  name: string
  type: AccountType
}

export interface Category {
  id: string
  name: string
  target_amount: number
  color: string
  icon: string
  created_at: string
  updated_at: string
}

export interface CategoryCreateRequest {
  name: string
  target_amount: number
  color?: string
  icon?: string
}

export interface CategoryUpdateRequest {
  name: string
  target_amount: number
  color: string
  icon: string
}

export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  amount: number
  type: TransactionType
  account_id: string
  category_id: string | null
  date: string
  description: string | null
  created_at: string
  updated_at: string
}

/** Cuerpo de `POST /api/transactions` (`TransactionCreateRequest`). */
export interface CreateTransactionDTO {
  amount: number
  type: TransactionType
  account_id: string
  /** Obligatorio si `type = expense`; opcional si `type = income`. */
  category_id?: string
  date: string
  description?: string
}

export interface TransactionFilters {
  account_id?: string
  category_id?: string
  type?: TransactionType
}

export interface CategorySummary {
  category_id: string
  category_name: string
  icon: string
  color: string
  total_amount: number
  percentage: number
}

export interface FinanceSummary {
  total_balance: number
  total_income: number
  total_expenses: number
  by_category: CategorySummary[]
}

// ── Productividad: Tareas ───────────────────────────────────

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'completed'

export interface Task {
  id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  /** Duración estimada (5–1440 min); el Cronograma la usa al agendar. */
  estimated_minutes: number | null
  user_id: string
  created_at: string
  updated_at: string
}

/** Cuerpo de `POST /api/tasks` (`CreateTaskDTO`). */
export interface CreateTaskDTO {
  title: string
  description?: string
  priority?: TaskPriority
  status?: TaskStatus
  /** ISO 8601; no puede ser una fecha pasada. */
  due_date?: string
  estimated_minutes?: number
}

/** Cuerpo de `PATCH /api/tasks/{id}` (`UpdateTaskDTO`): al menos un campo. */
export interface UpdateTaskDTO {
  title?: string
  description?: string | null
  priority?: TaskPriority
  status?: TaskStatus
  due_date?: string | null
  estimated_minutes?: number | null
}

export interface TaskFilters {
  status?: TaskStatus
  priority?: TaskPriority
}

// ── Productividad: Cronograma diario (Gantt) ────────────────

export type TimeBlockCategory = 'work' | 'sleep' | 'leisure' | 'exercise' | 'other'

export interface TimeBlock {
  id: string
  title: string
  description: string | null
  /** ISO 8601; siempre anterior a `end_time`. */
  start_time: string
  end_time: string
  actual_duration_minutes: number
  category: TimeBlockCategory
  task_id: string | null
  is_completed: boolean
  user_id: string
}

/** Cuerpo de `POST /api/schedule` (`CreateTimeBlockDTO`). */
export interface CreateTimeBlockDTO {
  title: string
  description?: string
  start_time: string
  end_time: string
  actual_duration_minutes?: number
  category?: TimeBlockCategory
  task_id?: string
  is_completed?: boolean
}

/** Cuerpo de `PATCH /api/schedule/{id}` (`UpdateTimeBlockDTO`): al menos un campo. */
export interface UpdateTimeBlockDTO {
  title?: string
  description?: string | null
  start_time?: string
  end_time?: string
  actual_duration_minutes?: number
  category?: TimeBlockCategory
  task_id?: string | null
  is_completed?: boolean
}

/** Query params de `GET /api/schedule`: bloques que se superponen con `[from, to)`. */
export interface ScheduleRange {
  from?: string
  to?: string
}

// ── Productividad: Notas multimedia ─────────────────────────

export interface Note {
  id: string
  title: string
  content: string | null
  audio_url: string | null
  user_id: string
  created_at: string
  updated_at: string
}

/** Cuerpo de `POST /api/notes` (`CreateNoteDTO`). */
export interface CreateNoteDTO {
  title: string
  content?: string
  audio_url?: string
}

export interface AudioUploadResponse {
  audio_url: string
}
