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
