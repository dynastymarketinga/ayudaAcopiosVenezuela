import L from 'leaflet'
import type { TipoLugarId } from '../constants/placeTypes'
import { getTipoLugar } from '../constants/placeTypes'

type MarkerVariant = 'default' | 'selected'

function getPlaceIconContent(tipo: TipoLugarId, accent: string): string {
  switch (tipo) {
    case 'hospital':
      return `
        <rect x="19" y="16" width="6" height="14" rx="1" fill="${accent}"/>
        <rect x="15" y="20" width="14" height="6" rx="1" fill="${accent}"/>
      `
    case 'hotel':
      return `
        <rect x="14" y="17" width="16" height="11" rx="1.5" fill="${accent}"/>
        <rect x="16" y="19" width="5" height="4" rx="0.5" fill="#ffffff"/>
        <rect x="23" y="19" width="5" height="4" rx="0.5" fill="#ffffff"/>
        <rect x="19" y="24" width="6" height="4" rx="0.5" fill="#ffffff"/>
      `
    case 'iglesia':
      return `
        <path d="M22 14 L28 19 L28 28 L16 28 L16 19 Z" fill="${accent}"/>
        <rect x="20" y="21" width="4" height="7" fill="#ffffff"/>
        <path d="M22 11 L22 16 M19 14 L25 14" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
      `
    case 'escuela':
      return `
        <path d="M14 21 L22 16 L30 21 L22 26 Z" fill="${accent}"/>
        <rect x="17" y="21" width="10" height="6" fill="#ffffff"/>
        <line x1="22" y1="16" x2="22" y2="13" stroke="${accent}" stroke-width="1.8" stroke-linecap="round"/>
      `
    case 'deportivo':
      return `
        <circle cx="22" cy="21" r="7" fill="${accent}"/>
        <path d="M16 21 C19 17 25 17 28 21 C25 25 19 25 16 21 Z" fill="#ffffff"/>
        <line x1="22" y1="14" x2="22" y2="28" stroke="#ffffff" stroke-width="1.2"/>
      `
    case 'comunitario':
      return `
        <circle cx="18" cy="19" r="3" fill="${accent}"/>
        <circle cx="26" cy="19" r="3" fill="${accent}"/>
        <path d="M14 28 C15 23 18 21 22 21 C26 21 29 23 30 28 Z" fill="${accent}"/>
      `
    case 'albergue':
      return `
        <path d="M14 27 L22 15 L30 27 Z" fill="${accent}"/>
        <rect x="18" y="23" width="8" height="5" fill="#ffffff"/>
      `
    case 'otro':
      return `
        <rect x="15" y="16" width="14" height="12" rx="2" fill="${accent}"/>
        <rect x="18" y="19" width="3" height="3" fill="#ffffff"/>
        <rect x="23" y="19" width="3" height="3" fill="#ffffff"/>
        <rect x="19" y="24" width="6" height="2" fill="#ffffff"/>
      `
    case 'centro_acopio':
    default:
      return `
        <rect x="15" y="15" width="14" height="10" rx="1.5" fill="${accent}"/>
        <path d="M15 18 L22 22 L29 18" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <line x1="22" y1="22" x2="22" y2="25" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
      `
  }
}

export function createCentroMarkerIcon(
  tipoLugar: TipoLugarId = 'centro_acopio',
  variant: MarkerVariant = 'default',
) {
  const tipo = getTipoLugar(tipoLugar)
  const fill = variant === 'selected' ? '#ea580c' : tipo.color
  const iconColor = variant === 'selected' ? '#c2410c' : tipo.color
  const iconContent = getPlaceIconContent(tipoLugar, iconColor)
  const filterId = `shadow-${tipoLugar}-${variant}`

  const html = `
    <div class="centro-marker-pin" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 52" width="44" height="52">
        <defs>
          <filter id="${filterId}" x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.25"/>
          </filter>
        </defs>
        <path
          filter="url(#${filterId})"
          fill="${fill}"
          stroke="#ffffff"
          stroke-width="2.5"
          d="M22 3 C13.2 3 6 10.2 6 19 C6 31 22 49 22 49 C22 49 38 31 38 19 C38 10.2 30.8 3 22 3 Z"
        />
        <circle cx="22" cy="19" r="10" fill="#ffffff"/>
        ${iconContent}
      </svg>
    </div>
  `

  return L.divIcon({
    className: 'centro-marker',
    html,
    iconSize: [44, 52],
    iconAnchor: [22, 50],
    popupAnchor: [0, -46],
  })
}
