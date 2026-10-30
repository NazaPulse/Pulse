// Cliente del contrato openapi.yaml compartido por /frontend-react y /frontend-vue.
// No depende de axios: cada frontend crea su instancia HTTP y la inyecta en `createApi`.
import type {
  Account,
  AccountCreateRequest,
  AccountUpdateRequest,
  Category,
  CategoryCreateRequest,
  CategoryUpdateRequest,
  CreateTransactionDTO,
  ErrorResponse,
  FinanceSummary,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  Transaction,
  TransactionFilters,
  UserPublic,
} from './types'
import { productivityApi } from './productivityApi'

/** Subconjunto de la API de una instancia de axios que usa el cliente. */
export interface HttpClient {
  get<T>(url: string, config?: { params?: Record<string, unknown> }): Promise<{ data: T }>
  post<T>(url: string, body?: unknown, config?: RequestOptions): Promise<{ data: T }>
  put<T>(url: string, body?: unknown): Promise<{ data: T }>
  patch<T>(url: string, body?: unknown): Promise<{ data: T }>
  delete(url: string): Promise<unknown>
}

/** Opciones por pedido que usa el cliente (p. ej. subida de audio con timeout propio). */
export interface RequestOptions {
  headers?: Record<string, string>
  timeout?: number
}

/** Lo único que se necesita de axios para crear la instancia HTTP de cada frontend. */
export interface HttpFactory<T> {
  create(config: { baseURL: string; headers: Record<string, string>; timeout: number }): T
}

/**
 * Instancia HTTP común. `baseUrl` vacío => rutas relativas (mismo origen): el proxy de
 * Vite reenvía `/api/*` al backend. Con valor => pega directo a esa URL.
 */
export function createHttp<T>(axios: HttpFactory<T>, baseUrl: string | undefined): T {
  return axios.create({
    baseURL: (baseUrl ?? '').trim(),
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
  })
}

/** `audio_url` es un path relativo (`/uploads/audio/...`) servido por el backend. */
export function resolveMediaUrl(baseUrl: string, path: string): string {
  return /^https?:\/\//.test(path) ? path : `${baseUrl}${path}`
}

function authApi(http: HttpClient) {
  return {
    async registerRequest(payload: RegisterRequest): Promise<UserPublic> {
      return (await http.post<UserPublic>('/api/auth/register', payload)).data
    },
    async loginRequest(payload: LoginRequest): Promise<LoginResponse> {
      return (await http.post<LoginResponse>('/api/auth/login', payload)).data
    },
  }
}

function accountsApi(http: HttpClient) {
  return {
    async getAccounts(): Promise<Account[]> {
      return (await http.get<Account[]>('/api/accounts')).data
    },
    async createAccount(payload: AccountCreateRequest): Promise<Account> {
      return (await http.post<Account>('/api/accounts', payload)).data
    },
    async updateAccount(id: string, payload: AccountUpdateRequest): Promise<Account> {
      return (await http.put<Account>(`/api/accounts/${id}`, payload)).data
    },
    async deleteAccount(id: string): Promise<void> {
      await http.delete(`/api/accounts/${id}`)
    },
  }
}

function categoriesApi(http: HttpClient) {
  return {
    async getCategories(): Promise<Category[]> {
      return (await http.get<Category[]>('/api/categories')).data
    },
    async createCategory(payload: CategoryCreateRequest): Promise<Category> {
      return (await http.post<Category>('/api/categories', payload)).data
    },
    async updateCategory(id: string, payload: CategoryUpdateRequest): Promise<Category> {
      return (await http.put<Category>(`/api/categories/${id}`, payload)).data
    },
    async deleteCategory(id: string): Promise<void> {
      await http.delete(`/api/categories/${id}`)
    },
  }
}

/** Se omiten los filtros vacíos: el backend rechaza query params inválidos. */
function nonEmptyFilters(params?: TransactionFilters): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params ?? {}).filter(([, value]) => Boolean(value)))
}

function financesApi(http: HttpClient) {
  return {
    async getTransactions(params?: TransactionFilters): Promise<Transaction[]> {
      const config = { params: nonEmptyFilters(params) }
      return (await http.get<Transaction[]>('/api/transactions', config)).data
    },
    async createTransaction(payload: CreateTransactionDTO): Promise<Transaction> {
      return (await http.post<Transaction>('/api/transactions', payload)).data
    },
    async getFinanceSummary(): Promise<FinanceSummary> {
      return (await http.get<FinanceSummary>('/api/finances/summary')).data
    },
  }
}

export function createApi(http: HttpClient) {
  return {
    ...authApi(http),
    ...accountsApi(http),
    ...categoriesApi(http),
    ...financesApi(http),
    ...productivityApi(http),
  }
}

// ── Normalización de errores ────────────────────────────────

interface HttpErrorLike {
  isAxiosError: true
  code?: string
  response?: { status: number; data?: unknown }
}

/** Equivalente a `axios.isAxiosError` sin importar axios. */
function isHttpError(error: unknown): error is HttpErrorLike {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { isAxiosError?: unknown }).isAxiosError === true
  )
}

const joinedMessages = (messages: string[]) => (messages.length > 0 ? messages.join(' · ') : null)

const textMessage = (message: unknown) => (typeof message === 'string' && message.trim() ? message : null)

function messageFromBody(data: Partial<ErrorResponse> | undefined): string | null {
  const msg = data?.message
  return Array.isArray(msg) ? joinedMessages(msg) : textMessage(msg)
}

function messageFromResponse(response: { status: number; data?: unknown }): string {
  const fromBody = messageFromBody(response.data as Partial<ErrorResponse> | undefined)
  if (fromBody) return fromBody
  if (response.status === 401) return 'Credenciales incorrectas.'
  return `Error ${response.status}.`
}

function messageFromHttpError(error: HttpErrorLike): string {
  if (error.response) return messageFromResponse(error.response)
  if (error.code === 'ECONNABORTED') return 'La solicitud tardó demasiado.'
  return 'No se pudo conectar con el servidor.'
}

/**
 * Normaliza cualquier fallo (HTTP / red / contrato) a un mensaje legible.
 * `ErrorResponse.message` puede ser `string` o `string[]` (ver openapi.yaml).
 */
export function extractErrorMessage(
  error: unknown,
  fallback = 'Ocurrió un error. Intentá nuevamente.',
): string {
  return isHttpError(error) ? messageFromHttpError(error) : fallback
}
