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
