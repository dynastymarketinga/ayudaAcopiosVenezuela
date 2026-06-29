import { useEffect, useState } from 'react'
import { MapContainer, Marker } from 'react-leaflet'
import type { Centro } from '../api/centros'
import type { Hospital } from '../api/hospitals'
import {
  DEFAULT_MAP_CENTER,
  DEFAULT_MAP_ZOOM,
  VENEZUELA_BOUNDS,
  VENEZUELA_MIN_ZOOM,
} from '../constants/map'
import { createCentroMarkerIcon } from '../utils/leaflet'
import { HospitalClusterLayer } from './HospitalClusterLayer'
import { MapTileLayers } from './MapTileLayers'
import 'leaflet/dist/leaflet.css'

interface CentrosMapProps {
  centros: Centro[]
  hospitales?: Hospital[]
  showHospitales?: boolean
  onSelectCentro?: (centro: Centro) => void
  onSelectHospital?: (hospital: Hospital) => void
  selectedId?: string | null
  fullScreen?: boolean
}

export function CentrosMap({
  centros,
  hospitales = [],
  showHospitales = true,
  onSelectCentro,
  onSelectHospital,
  selectedId,
  fullScreen = false,
}: CentrosMapProps) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setReady(true)
  }, [])

  const centrosConUbicacion = centros.filter(
    (c) => typeof c.lat === 'number' && typeof c.lng === 'number',
  )

  const center: [number, number] =
    !fullScreen && centrosConUbicacion.length > 0
      ? [centrosConUbicacion[0].lat!, centrosConUbicacion[0].lng!]
      : DEFAULT_MAP_CENTER

  const zoom =
    !fullScreen && centrosConUbicacion.length === 1
      ? 14
      : !fullScreen && centrosConUbicacion.length > 1
        ? 6
        : DEFAULT_MAP_ZOOM

  if (!ready) {
    return <div className="map-loading">Cargando mapa...</div>
  }

  return (
    <div className={`map-container ${fullScreen ? 'map-fullscreen' : ''}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={VENEZUELA_MIN_ZOOM}
        maxBounds={VENEZUELA_BOUNDS}
        maxBoundsViscosity={1}
        worldCopyJump={false}
        style={{ height: '100%', width: '100%' }}
      >
        <MapTileLayers />
        {centrosConUbicacion.map((centro) => (
          <Marker
            key={centro._id}
            position={[centro.lat!, centro.lng!]}
            icon={createCentroMarkerIcon(
              centro.tipoLugar ?? 'centro_acopio',
              selectedId === centro._id ? 'selected' : 'default',
              centro.prioridad ?? 'media',
            )}
            eventHandlers={{
              click: () => onSelectCentro?.(centro),
            }}
          />
        ))}
        {showHospitales && hospitales.length > 0 && (
          <HospitalClusterLayer hospitales={hospitales} onSelectHospital={onSelectHospital} />
        )}
      </MapContainer>
    </div>
  )
}
