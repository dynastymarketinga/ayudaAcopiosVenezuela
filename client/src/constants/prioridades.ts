export const PRIORIDADES = [
  { id: 'alta', label: 'Alta', color: '#dc2626', light: '#fef2f2', hint: 'Urgente' },
  { id: 'media', label: 'Media', color: '#d97706', light: '#fffbeb', hint: 'Importante' },
  { id: 'leve', label: 'Leve', color: '#16a34a', light: '#f0fdf4', hint: 'Puede esperar' },
] as const

export type PrioridadId = (typeof PRIORIDADES)[number]['id']

export const DEFAULT_PRIORIDAD: PrioridadId = 'media'

export function getPrioridad(id: PrioridadId) {
  return PRIORIDADES.find((prioridad) => prioridad.id === id) ?? PRIORIDADES[1]
}

export function getPrioridadLabel(id: PrioridadId): string {
  return getPrioridad(id).label
}
