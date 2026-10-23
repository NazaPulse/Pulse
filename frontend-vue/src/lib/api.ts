import axios from 'axios'

import { createApi, createHttp, extractErrorMessage, resolveMediaUrl as resolveUrl } from '@shared/api'

export { extractErrorMessage }
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').trim()
export const http = createHttp(axios, API_BASE_URL)
export const api = createApi(http)
export const resolveMediaUrl = (path: string) => resolveUrl(API_BASE_URL, path)
