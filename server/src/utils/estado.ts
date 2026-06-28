export const VENEZUELA_ESTADO_NAMES = [
  'Amazonas',
  'Anzoátegui',
  'Apure',
  'Aragua',
  'Barinas',
  'Bolívar',
  'Carabobo',
  'Cojedes',
  'Delta Amacuro',
  'Dependencias Federales',
  'Distrito Capital',
  'Falcón',
  'Guárico',
  'La Guaira',
  'Lara',
  'Mérida',
  'Miranda',
  'Monagas',
  'Nueva Esparta',
  'Portuguesa',
  'Sucre',
  'Trujillo',
  'Táchira',
  'Yaracuy',
  'Zulia',
] as const

const ESTADO_ALIASES = new Map<string, string>([
  ['caracas', 'Distrito Capital'],
  ['vargas', 'La Guaira'],
])

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function toEstadoId(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function matchEstadoName(value: string): string | null {
  const normalized = normalizeText(value.replace(/^estado\s+/i, ''))
  if (!normalized) return null

  const alias = ESTADO_ALIASES.get(normalized)
  if (alias) return toEstadoId(alias)

  for (const name of VENEZUELA_ESTADO_NAMES) {
    if (normalizeText(name) === normalized) return toEstadoId(name)
  }

  return null
}

export function resolveEstadoFromDireccion(direccion?: string): string | undefined {
  if (!direccion) return undefined

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
  const orderedNames = [...VENEZUELA_ESTADO_NAMES].sort((a, b) => b.length - a.length)
  for (const name of orderedNames) {
    if (normalized.includes(normalizeText(name))) return toEstadoId(name)
  }

  for (const [alias, canonicalName] of ESTADO_ALIASES) {
    if (normalized.includes(alias)) return toEstadoId(canonicalName)
  }

  return undefined
}
