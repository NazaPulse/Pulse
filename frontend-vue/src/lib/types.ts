// Espejo de components.schemas de openapi.yaml (raíz del repo).
// Idéntico a /frontend-react/src/lib/types.ts.

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
