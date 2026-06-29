import { useEffect } from 'react'
import { MapContainer, Marker, useMap, useMapEvents } from 'react-leaflet'
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../constants/map'
import type { TipoLugarId } from '../constants/placeTypes'
import { DEFAULT_TIPO_LUGAR } from '../constants/placeTypes'
import type { PrioridadId } from '../constants/prioridades'
import { DEFAULT_PRIORIDAD } from '../constants/prioridades'
import { createCentroMarkerIcon } from '../utils/leaflet'
import { MapTileLayers } from './MapTileLayers'
import 'leaflet/dist/leaflet.css'

interface MapPickerProps {
  position: [number, number] | null
  onPositionChange: (pos: [number, number]) => void
  flyTo?: [number, number] | null
  tipoLugar?: TipoLugarId
  prioridad?: PrioridadId
  height?: string
}

function MapFlyTo({ target }: { target: [number, number] | null | undefined }) {
  const map = useMap()

  useEffect(() => {
    if (target) {
      map.flyTo(target, 16, { duration: 1.2 })
    }
  }, [target, map])

  return null
}

function ClickHandler({
  onPositionChange,
}: {
  onPositionChange: (pos: [number, number]) => void
}) {
  useMapEvents({
    click(e) {
      onPositionChange([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

export function MapPicker({
  position,
  onPositionChange,
  flyTo,
  tipoLugar = DEFAULT_TIPO_LUGAR,
  prioridad = DEFAULT_PRIORIDAD,
  height = '320px',
}: MapPickerProps) {
  const center = position ?? DEFAULT_MAP_CENTER

  return (
    <div className="map-container" style={{ height }}>
      <MapContainer center={center} zoom={position ? 15 : DEFAULT_MAP_ZOOM} style={{ height: '100%', width: '100%' }}>
        <MapTileLayers />
        <MapFlyTo target={flyTo} />
        <ClickHandler onPositionChange={onPositionChange} />
        {position && (
          <Marker
            position={position}
            icon={createCentroMarkerIcon(tipoLugar, 'selected', prioridad)}
          />
        )}
      </MapContainer>
    </div>
  )
}
