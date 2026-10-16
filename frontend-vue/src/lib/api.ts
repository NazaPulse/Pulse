import axios from 'axios'

import { createApi } from '@shared/api'

export { extractErrorMessage } from '@shared/api'

// Vacío => Axios usa rutas relativas (mismo origen) y el proxy de Vite
// reenvía /api/* al backend. Con valor => pega directo a esa URL.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()

export const http = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

export const {
  registerRequest,
  loginRequest,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getTransactions,
  createTransaction,
  getFinanceSummary,
} = createApi(http)
