import { SUMINISTROS, type Suministro } from '../constants/supplies.js'

export interface SuministroNecesarioDoc {
  categoria: string
  detalle: string
}

export function isSuministro(value: string): value is Suministro {
  return (SUMINISTROS as readonly string[]).includes(value)
}

export function normalizeSuministrosNecesarios(raw: unknown): SuministroNecesarioDoc[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item): SuministroNecesarioDoc[] => {
    if (typeof item === 'string') {
      const categoria = item.trim()
      return isSuministro(categoria) ? [{ categoria, detalle: '' }] : []
    }

    if (item && typeof item === 'object' && 'categoria' in item) {
      const categoria = String(item.categoria).trim()
      if (!isSuministro(categoria)) return []
      return [{ categoria, detalle: String(item.detalle ?? '').trim() }]
    }

    return []
  })
}

export function parseSuministrosNecesarios(raw: unknown): SuministroNecesarioDoc[] | null {
  if (!Array.isArray(raw)) return null

  const parsed: SuministroNecesarioDoc[] = []

  for (const item of raw) {
    if (typeof item === 'string') {
      const categoria = item.trim()
      if (!isSuministro(categoria)) return null
      parsed.push({ categoria, detalle: '' })
      continue
    }

    if (!item || typeof item !== 'object' || !('categoria' in item)) return null

    const categoria = String(item.categoria).trim()
    const detalle = String(item.detalle ?? '').trim()

    if (!isSuministro(categoria) || !detalle) return null

    parsed.push({ categoria, detalle })
  }

  return parsed
}
