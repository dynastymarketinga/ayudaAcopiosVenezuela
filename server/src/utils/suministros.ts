import { SUMINISTROS, type Suministro } from '../constants/supplies.js'

export interface SuministroNecesarioDoc {
  categoria: string
  articulos: string[]
}

export function isSuministro(value: string): value is Suministro {
  return (SUMINISTROS as readonly string[]).includes(value)
}

function cleanArticulos(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}

function splitDetalleToArticulos(value: string): string[] {
  const lines = value
    .split(/\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean)

  if (lines.length === 1 && lines[0].includes(',')) {
    return lines[0]
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
  }

  return lines
}

function normalizeItem(item: unknown): SuministroNecesarioDoc | null {
  if (typeof item === 'string') {
    const categoria = item.trim()
    return isSuministro(categoria) ? { categoria, articulos: [] } : null
  }

  if (!item || typeof item !== 'object' || !('categoria' in item)) return null

  const categoria = String(item.categoria).trim()
  if (!isSuministro(categoria)) return null

  if ('articulos' in item && Array.isArray(item.articulos)) {
    return { categoria, articulos: cleanArticulos(item.articulos.map(String)) }
  }

  if ('detalle' in item) {
    const detalle = String(item.detalle ?? '').trim()
    return { categoria, articulos: detalle ? splitDetalleToArticulos(detalle) : [] }
  }

  return { categoria, articulos: [] }
}

export function normalizeSuministrosNecesarios(raw: unknown): SuministroNecesarioDoc[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    const normalized = normalizeItem(item)
    return normalized ? [normalized] : []
  })
}

export function parseSuministrosNecesarios(raw: unknown): SuministroNecesarioDoc[] | null {
  if (!Array.isArray(raw)) return null

  const parsed: SuministroNecesarioDoc[] = []

  for (const item of raw) {
    const normalized = normalizeItem(item)
    if (!normalized || normalized.articulos.length === 0) return null
    parsed.push(normalized)
  }

  return parsed
}
