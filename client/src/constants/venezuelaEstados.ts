import estadosGeo from '../data/venezuelaEstados.geo.json'

export interface VenezuelaEstado {
  id: string
  name: string
}

export const VENEZUELA_ESTADOS: VenezuelaEstado[] = estadosGeo
  .map(({ id, name }) => ({ id, name }))
  .sort((a, b) => a.name.localeCompare(b.name, 'es'))

export type EstadoFilter = 'todos' | (typeof VENEZUELA_ESTADOS)[number]['id']

const ESTADOS_BY_ID = new Map(VENEZUELA_ESTADOS.map((estado) => [estado.id, estado]))

export function getEstadoName(estadoId: string): string {
  return ESTADOS_BY_ID.get(estadoId)?.name ?? estadoId
}

export { estadosGeo as VENEZUELA_ESTADOS_GEO }
