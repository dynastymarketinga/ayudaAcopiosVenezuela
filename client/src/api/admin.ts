import { apiUrl } from '../config/api'
import type { Centro } from './centros'

const ADMIN_TOKEN_KEY = 'adminToken'

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function adminFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(apiUrl(path), { ...options, headers })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Error en la solicitud')
  }

  if (response.status === 204) return undefined as T
  return response.json()
}

export async function adminLogin(data: {
  email: string
  password: string
}): Promise<{ token: string }> {
  return adminFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchAdminCentros(): Promise<Centro[]> {
  return adminFetch('/api/admin/centros')
}

export async function deleteCentro(id: string): Promise<void> {
  return adminFetch(`/api/admin/centros/${id}`, { method: 'DELETE' })
}
