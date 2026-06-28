import { apiUrl } from '../config/api'

export interface Hospital {
  id: string
  nombre: string
  lat: number
  lng: number
  direccion?: string
  telefono?: string
  fuente: 'openstreetmap'
}

const CACHE_KEY = 'helpAcopio:hospitals:v1'
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000

interface HospitalCache {
  cachedAt: number
  hospitals: Hospital[]
}

function readCache(): HospitalCache | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as HospitalCache
    if (!Array.isArray(parsed.hospitals) || typeof parsed.cachedAt !== 'number') return null
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(hospitals: Hospital[]) {
  const payload: HospitalCache = { cachedAt: Date.now(), hospitals }
  sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload))
}

export async function fetchHospitals(): Promise<Hospital[]> {
  const cached = readCache()
  if (cached) return cached.hospitals

  const response = await fetch(apiUrl('/api/hospitals'))

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudieron cargar los hospitales')
  }

  const hospitals = (await response.json()) as Hospital[]
  writeCache(hospitals)
  return hospitals
}

/** Devuelve caché local al instante, o null si no existe. */
export function getCachedHospitals(): Hospital[] | null {
  return readCache()?.hospitals ?? null
}
