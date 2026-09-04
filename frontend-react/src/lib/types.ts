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
