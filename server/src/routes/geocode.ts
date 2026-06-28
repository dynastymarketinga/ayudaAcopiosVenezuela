import { Router } from 'express'

export const geocodeRouter = Router()

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
}

geocodeRouter.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''

  if (q.length < 3) {
    res.status(400).json({ message: 'Escribe al menos 3 caracteres para buscar' })
    return
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', q)
  url.searchParams.set('limit', '5')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('countrycodes', 've')

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HelpAcopio/1.0 (centros de acopio)',
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      res.status(502).json({ message: 'No se pudo buscar la dirección' })
      return
    }

    const data = (await response.json()) as NominatimResult[]

    res.json(
      data.map((item) => ({
        id: item.place_id,
        lat: Number(item.lat),
        lng: Number(item.lon),
        displayName: item.display_name,
      })),
    )
  } catch {
    res.status(502).json({ message: 'Error al conectar con el servicio de búsqueda' })
  }
})
