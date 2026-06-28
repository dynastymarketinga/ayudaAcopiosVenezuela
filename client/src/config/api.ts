/** Base URL del backend. Vacío en dev → rutas relativas + proxy de Vite. */
const PRODUCTION_API = 'https://ayudaacopiosvenezuela.onrender.com'

export const API_BASE = (
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? PRODUCTION_API : '')
).replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`
}

/** Convierte rutas relativas (/uploads/...) en URL absoluta en producción. */
export function resolveAssetUrl(url: string): string {
  if (!url || url.startsWith('http://') || url.startsWith('https://')) return url
  return `${API_BASE}${url}`
}
