import { VENEZUELA_ESTADOS, type VenezuelaEstado } from '../constants/venezuelaEstados'

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function bboxArea(bbox: VenezuelaEstado['bbox']): number {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return (maxLng - minLng) * (maxLat - minLat)
}

function isInsideBbox(lat: number, lng: number, bbox: VenezuelaEstado['bbox']): boolean {
  const [minLng, minLat, maxLng, maxLat] = bbox
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng
}

const ESTADOS_BY_NAME = VENEZUELA_ESTADOS.flatMap((estado) => {
  const aliases = [estado.name]
  if (estado.id === 'distrito_capital') aliases.push('Caracas')
  if (estado.id === 'la_guaira') aliases.push('Vargas')
  return aliases.map((alias) => [normalizeText(alias), estado.id] as const)
}).sort((a, b) => b[0].length - a[0].length)

export function resolveEstadoFromCoords(lat?: number, lng?: number): string | null {
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const matches = VENEZUELA_ESTADOS.filter((estado) => isInsideBbox(lat, lng, estado.bbox))
  if (matches.length === 0) return null

  matches.sort((a, b) => bboxArea(a.bbox) - bboxArea(b.bbox))
  return matches[0].id
}

export function resolveEstadoFromDireccion(direccion?: string): string | null {
  if (!direccion) return null

  const normalized = normalizeText(direccion)
  for (const [alias, estadoId] of ESTADOS_BY_NAME) {
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
    const normalized = normalizeText(item.estado)
    const match = VENEZUELA_ESTADOS.find(
      (estado) => estado.id === item.estado || normalizeText(estado.name) === normalized,
    )
    if (match) return match.id
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
