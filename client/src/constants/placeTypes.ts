export const TIPOS_LUGAR = [
  { id: 'centro_acopio', label: 'Centro de acopio', color: '#0d9488' },
  { id: 'hospital', label: 'Hospital', color: '#dc2626' },
  { id: 'hotel', label: 'Hotel', color: '#7c3aed' },
  { id: 'iglesia', label: 'Iglesia / Templo', color: '#ca8a04' },
  { id: 'escuela', label: 'Escuela / Universidad', color: '#2563eb' },
  { id: 'deportivo', label: 'Centro deportivo', color: '#16a34a' },
  { id: 'comunitario', label: 'Centro comunitario', color: '#0891b2' },
  { id: 'albergue', label: 'Albergue / Refugio', color: '#db2777' },
  { id: 'otro', label: 'Otro', color: '#64748b' },
] as const

export type TipoLugarId = (typeof TIPOS_LUGAR)[number]['id']

export const DEFAULT_TIPO_LUGAR: TipoLugarId = 'centro_acopio'

export function getTipoLugar(id: TipoLugarId) {
  return TIPOS_LUGAR.find((tipo) => tipo.id === id) ?? TIPOS_LUGAR[0]
}

export function getTipoLugarLabel(id: TipoLugarId): string {
  return getTipoLugar(id).label
}
