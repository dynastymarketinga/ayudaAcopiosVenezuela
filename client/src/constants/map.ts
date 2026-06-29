export const MAP_TILES = {
  url: 'https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 20,
} as const

export const MAP_LABELS = {
  url: 'https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
  subdomains: 'abcd',
  maxZoom: 20,
} as const

/** Centro geográfico de Venezuela */
export const DEFAULT_MAP_CENTER: [number, number] = [7.0, -66.5]

/** Zoom inicial para ver el país completo */
export const DEFAULT_MAP_ZOOM = 6

/** Límites aproximados de Venezuela (incluye islas y fronteras) */
export const VENEZUELA_BOUNDS: [[number, number], [number, number]] = [
  [0.5, -73.5],
  [13.5, -59.5],
]

/** Zoom mínimo para no alejarse demasiado del país */
export const VENEZUELA_MIN_ZOOM = 5
