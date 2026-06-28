import { TileLayer } from 'react-leaflet'
import { MAP_LABELS, MAP_TILES } from '../constants/map'

export function MapTileLayers() {
  return (
    <>
      <TileLayer
        url={MAP_TILES.url}
        attribution={MAP_TILES.attribution}
        subdomains={MAP_TILES.subdomains}
        maxZoom={MAP_TILES.maxZoom}
      />
      <TileLayer
        url={MAP_LABELS.url}
        subdomains={MAP_LABELS.subdomains}
        maxZoom={MAP_LABELS.maxZoom}
        pane="overlayPane"
      />
    </>
  )
}
