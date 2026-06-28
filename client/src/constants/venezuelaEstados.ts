export interface VenezuelaEstado {
  id: string
  name: string
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number]
}

/** Límites aproximados por estado para ubicar puntos en el mapa. */
export const VENEZUELA_ESTADOS: VenezuelaEstado[] = [
  { id: 'amazonas', name: 'Amazonas', bbox: [-67.5, 0, -62, 6] },
  { id: 'anzoategui', name: 'Anzoátegui', bbox: [-66.5, 7.5, -63.5, 10.5] },
  { id: 'apure', name: 'Apure', bbox: [-68.5, 6.5, -66, 8.5] },
  { id: 'aragua', name: 'Aragua', bbox: [-67.8, 9.8, -66.5, 10.5] },
  { id: 'barinas', name: 'Barinas', bbox: [-71, 7, -68.5, 9] },
  { id: 'bolivar', name: 'Bolívar', bbox: [-67.5, 4, -59.5, 8.5] },
  { id: 'carabobo', name: 'Carabobo', bbox: [-68.5, 10, -67.5, 10.8] },
  { id: 'cojedes', name: 'Cojedes', bbox: [-69, 8.8, -67.5, 10] },
  { id: 'delta_amacuro', name: 'Delta Amacuro', bbox: [-62.5, 7.5, -59.5, 10] },
  { id: 'distrito_capital', name: 'Distrito Capital', bbox: [-67.05, 10.38, -66.75, 10.55] },
  { id: 'falcon', name: 'Falcón', bbox: [-71.5, 10.5, -68, 12.5] },
  { id: 'guarico', name: 'Guárico', bbox: [-67.5, 7.5, -64, 10] },
  { id: 'la_guaira', name: 'La Guaira', bbox: [-67.2, 10.45, -66.7, 10.75] },
  { id: 'lara', name: 'Lara', bbox: [-70.5, 9.5, -68.5, 11.5] },
  { id: 'merida', name: 'Mérida', bbox: [-71.8, 7.5, -70, 9] },
  { id: 'miranda', name: 'Miranda', bbox: [-67.2, 10, -65.5, 10.6] },
  { id: 'monagas', name: 'Monagas', bbox: [-64, 8.5, -61.5, 10.5] },
  { id: 'nueva_esparta', name: 'Nueva Esparta', bbox: [-67.2, 10.8, -63.5, 11.5] },
  { id: 'portuguesa', name: 'Portuguesa', bbox: [-70.5, 8.5, -68.5, 10] },
  { id: 'sucre', name: 'Sucre', bbox: [-64.5, 10, -62, 11] },
  { id: 'tachira', name: 'Táchira', bbox: [-72.5, 7, -71, 8.5] },
  { id: 'trujillo', name: 'Trujillo', bbox: [-72, 9, -70, 10] },
  { id: 'yaracuy', name: 'Yaracuy', bbox: [-69, 10, -68, 10.8] },
  { id: 'zulia', name: 'Zulia', bbox: [-73.5, 8.5, -69.5, 12] },
]

export type EstadoFilter = 'todos' | (typeof VENEZUELA_ESTADOS)[number]['id']

const ESTADOS_BY_ID = new Map(VENEZUELA_ESTADOS.map((estado) => [estado.id, estado]))

export function getEstadoName(estadoId: string): string {
  return ESTADOS_BY_ID.get(estadoId)?.name ?? estadoId
}
