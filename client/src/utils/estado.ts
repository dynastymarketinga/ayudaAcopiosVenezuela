import {
  VENEZUELA_ESTADOS,
  VENEZUELA_ESTADOS_GEO,
} from '../constants/venezuelaEstados'

type LatLng = [lat: number, lng: number]

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

const ESTADO_ALIASES = new Map<string, string>([
  ['caracas', 'distrito_capital'],
  ['distrito capital', 'distrito_capital'],
  ['vargas', 'la_guaira'],
  ['la guaira', 'la_guaira'],
  ['dependencias federales', 'dependencias_federales'],
])

const ESTADOS_BY_NAME = new Map(
  VENEZUELA_ESTADOS.map((estado) => [normalizeText(estado.name), estado.id]),
)

function matchEstadoName(value: string): string | null {
  const normalized = normalizeText(value.replace(/^estado\s+/i, ''))
  if (!normalized) return null

  const alias = ESTADO_ALIASES.get(normalized)
  if (alias) return alias

  return ESTADOS_BY_NAME.get(normalized) ?? null
}

function pointInRing(lat: number, lng: number, ring: LatLng[]): boolean {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i]
    const [yj, xj] = ring[j]
    const intersects = yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function resolveEstadoFromCoords(lat?: number, lng?: number): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  for (const estado of VENEZUELA_ESTADOS_GEO) {
    if (estado.rings.some((ring) => pointInRing(lat, lng, ring as LatLng[]))) {
      return estado.id
    }
  }

  return null
}

export function resolveEstadoFromDireccion(direccion?: string): string | null {
  if (!direccion) return null

  const parts = direccion
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)

  for (let index = parts.length - 1; index >= 0; index--) {
    const part = parts[index]
    const normalizedPart = normalizeText(part)
    if (normalizedPart === 'venezuela' || normalizedPart === 've') continue

    const match = matchEstadoName(part)
    if (match) return match
  }

  const normalized = normalizeText(direccion)
  const orderedNames = [...VENEZUELA_ESTADOS].sort((a, b) => b.name.length - a.name.length)
  for (const estado of orderedNames) {
    if (normalized.includes(normalizeText(estado.name))) return estado.id
  }

  for (const [alias, estadoId] of ESTADO_ALIASES) {
    if (normalized.includes(alias)) return estadoId
  }

  return null
}

export function resolveEstado(item: {
  lat?: number
  lng?: number
  direccion?: string
  estado?: string
}): string | null {
  if (item.estado) {
    const match = matchEstadoName(item.estado)
    if (match) return match
    if (ESTADOS_BY_NAME.has(normalizeText(item.estado)) || VENEZUELA_ESTADOS.some((e) => e.id === item.estado)) {
      return item.estado
    }
  }

  const fromDireccion = resolveEstadoFromDireccion(item.direccion)
  if (fromDireccion) return fromDireccion

  return resolveEstadoFromCoords(item.lat, item.lng)
}

export function matchesEstadoFilter(
  item: { lat?: number; lng?: number; direccion?: string; estado?: string },
  estadoFilter: string,
): boolean {
  if (estadoFilter === 'todos') return true
  return resolveEstado(item) === estadoFilter
}
