import L from 'leaflet'
import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import type { Hospital } from '../api/hospitals'
import { createCentroMarkerIcon } from '../utils/leaflet'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster'

interface HospitalClusterLayerProps {
  hospitales: Hospital[]
  onSelectHospital?: (hospital: Hospital) => void
}

export function HospitalClusterLayer({ hospitales, onSelectHospital }: HospitalClusterLayerProps) {
  const map = useMap()
  const groupRef = useRef<L.MarkerClusterGroup | null>(null)
  const onSelectRef = useRef(onSelectHospital)
  onSelectRef.current = onSelectHospital

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 56,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      disableClusteringAtZoom: 14,
      chunkedLoading: true,
      chunkInterval: 120,
      chunkDelay: 16,
    })

    group.on('clusterclick', (event) => {
      const layer = event.layer as L.MarkerCluster
      if (map.getZoom() >= 13) return
      map.fitBounds(layer.getBounds(), { padding: [24, 24], maxZoom: 13 })
    })

    groupRef.current = group
    map.addLayer(group)

    return () => {
      map.removeLayer(group)
      groupRef.current = null
    }
  }, [map])

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    group.clearLayers()

    const layers: L.Marker[] = []

    for (const hospital of hospitales) {
      const marker = L.marker([hospital.lat, hospital.lng], {
        icon: createCentroMarkerIcon('hospital'),
      })
      marker.on('click', () => onSelectRef.current?.(hospital))
      layers.push(marker)
    }

    group.addLayers(layers)
  }, [hospitales])

  return null
}
