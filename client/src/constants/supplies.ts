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
  detalle: string
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

export const SUMINISTRO_PLACEHOLDERS: Record<Suministro, string> = {
  'Agua embotellada': 'Ej: Garrafas de 5L, botellas individuales, packs por caja...',
  'Alimentos no perecederos': 'Ej: Arroz, pasta, latas, aceite, harina, galletas...',
  Ropa: 'Ej: Ropa para niños 4-6 años, pantalones talla M, zapatos 38...',
  Cobijas: 'Ej: Cobijas individuales, frazadas, colchonetas...',
  Medicamentos: 'Ej: Analgésicos, antisépticos, gasas, vitaminas...',
  Pañales: 'Ej: Pañales talla M y G, toallitas húmedas...',
  'Higiene personal': 'Ej: Jabón, pasta dental, shampoo, desodorante...',
  'Leche en polvo': 'Ej: Leche de fórmula etapa 1, leche en polvo entera...',
  'Artículos de limpieza': 'Ej: Cloro, detergente, bolsas de basura, trapeadores...',
  'Alimento para mascotas': 'Ej: Croquetas para perros, latas para gatos...',
}

export function isSuministro(value: string): value is Suministro {
  return (SUMINISTROS as readonly string[]).includes(value)
}

export function normalizeSuministrosNecesarios(raw: unknown): SuministroNecesario[] {
  if (!Array.isArray(raw)) return []

  return raw.flatMap((item): SuministroNecesario[] => {
    if (typeof item === 'string') {
      const categoria = item.trim()
      return isSuministro(categoria) ? [{ categoria, detalle: '' }] : []
    }

    if (item && typeof item === 'object' && 'categoria' in item) {
      const categoria = String(item.categoria).trim()
      if (!isSuministro(categoria)) return []
      return [{ categoria: categoria as Suministro, detalle: String(item.detalle ?? '').trim() }]
    }

    return []
  })
}
