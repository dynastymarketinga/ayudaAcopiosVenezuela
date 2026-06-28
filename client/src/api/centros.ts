import { apiUrl } from '../config/api'
import type { TipoLugarId } from '../constants/placeTypes'
import type { SuministroNecesario } from '../constants/supplies'

export interface Centro {
  _id: string
  email?: string
  nombre: string
  tipoLugar: TipoLugarId
  lat?: number
  lng?: number
  direccion?: string
  telefonos: string[]
  correosContacto: string[]
  sitiosWeb: string[]
  suministrosNecesarios: SuministroNecesario[]
  imagenes: string[]
  imagenPrincipal?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  token: string
  centro: Centro
}

function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
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

export async function register(data: {
  email: string
  password: string
  nombre: string
}): Promise<AuthResponse> {
  return apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  return apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function fetchMe(): Promise<Centro> {
  return apiFetch('/api/auth/me')
}

export async function fetchCentros(tipo?: string): Promise<Centro[]> {
  const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : ''
  return apiFetch(`/api/centros${query}`)
}

export async function createCentro(data: {
  nombre: string
  lat: number
  lng: number
  direccion?: string
  tipoLugar?: TipoLugarId
  telefonos?: string[]
  correosContacto?: string[]
  sitiosWeb?: string[]
  suministrosNecesarios: SuministroNecesario[]
}): Promise<Centro> {
  return apiFetch('/api/centros', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCentro(data: {
  nombre?: string
  lat?: number
  lng?: number
  direccion?: string
  tipoLugar?: TipoLugarId
  telefonos?: string[]
  correosContacto?: string[]
  sitiosWeb?: string[]
  suministrosNecesarios?: SuministroNecesario[]
}): Promise<Centro> {
  return apiFetch('/api/centros/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function fetchSuministros(): Promise<string[]> {
  return apiFetch('/api/centros/supplies')
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'Error en la solicitud')
  }

  return response.json()
}

export async function uploadCentroImagenes(files: File[]): Promise<Centro> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('imagenes', file)
  }
  return apiUpload('/api/centros/me/imagenes', formData)
}

export async function uploadCentroImagenesPublic(centroId: string, files: File[]): Promise<Centro> {
  const formData = new FormData()
  for (const file of files) {
    formData.append('imagenes', file)
  }
  return apiUpload(`/api/centros/${centroId}/imagenes`, formData)
}

export async function setImagenPrincipal(url: string): Promise<Centro> {
  return apiFetch('/api/centros/me/imagen-principal', {
    method: 'PUT',
    body: JSON.stringify({ url }),
  })
}

export async function deleteCentroImagen(url: string): Promise<Centro> {
  return apiFetch('/api/centros/me/imagenes', {
    method: 'DELETE',
    body: JSON.stringify({ url }),
  })
}
