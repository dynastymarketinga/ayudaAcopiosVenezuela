export const SUMINISTROS = [
  'Agua embotellada',
  'Alimentos no perecederos',
  'Ropa',
  'Cobijas',
  'Medicamentos',
  'Pañales',
  'Higiene personal',
  'Leche en polvo',
  'Artículos de limpieza',
  'Alimento para mascotas',
] as const

export type Suministro = (typeof SUMINISTROS)[number]

export interface SuministroNecesario {
  categoria: Suministro
  articulos: string[]
}

export const SUMINISTRO_ICONS: Record<Suministro, string> = {
  'Agua embotellada': '💧',
  'Alimentos no perecederos': '🥫',
  Ropa: '👕',
  Cobijas: '🛏️',
  Medicamentos: '💊',
  Pañales: '🍼',
  'Higiene personal': '🧴',
  'Leche en polvo': '🥛',
  'Artículos de limpieza': '🧹',
  'Alimento para mascotas': '🐾',
}

export const SUMINISTRO_ITEM_PLACEHOLDERS: Record<Suministro, string> = {
  'Agua embotellada': 'Ej: Garrafas de 5L',
  'Alimentos no perecederos': 'Ej: Arroz 1kg',
  Ropa: 'Ej: Pantalón talla M',
  Cobijas: 'Ej: Frazada individual',
  Medicamentos: 'Ej: Gasas estériles',
  Pañales: 'Ej: Pañales talla M',
  'Higiene personal': 'Ej: Pasta dental',
  'Leche en polvo': 'Ej: Fórmula etapa 1',
  'Artículos de limpieza': 'Ej: Detergente',
  'Alimento para mascotas': 'Ej: Croquetas para perros',
}

export function isSuministro(value: string): value is Suministro {
  return (SUMINISTROS as readonly string[]).includes(value)
}

export function cleanArticulos(values: string[]): string[] {
  return values.map((value) => value.trim()).filter(Boolean)
}

export function splitDetalleToArticulos(value: string): string[] {
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

export function countArticulos(items: SuministroNecesario[]): number {
  return items.reduce((total, item) => total + item.articulos.length, 0)
}

function normalizeItem(item: unknown): SuministroNecesario | null {
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

export function normalizeSuministrosNecesarios(raw: unknown): SuministroNecesario[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item) => {
    const normalized = normalizeItem(item)
    return normalized ? [normalized] : []
  })
}
