export interface GeocodeResult {
  id: number
  lat: number
  lng: number
  displayName: string
}

export async function searchAddress(query: string): Promise<GeocodeResult[]> {
  const params = new URLSearchParams({ q: query })
  const response = await fetch(`/api/geocode/search?${params}`)

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.message || 'No se pudo buscar la dirección')
  }

  return response.json()
}
