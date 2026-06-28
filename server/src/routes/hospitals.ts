import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { Router } from 'express'
import { resolveEstadoFromDireccion } from '../utils/estado.js'

export const hospitalsRouter = Router()

export interface HospitalPublic {
  id: string
  nombre: string
  lat: number
  lng: number
  direccion?: string
  estado?: string
  telefono?: string
  fuente: 'openstreetmap'
}

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

interface OverpassResponse {
  elements: OverpassElement[]
}

interface FileCache {
  cachedAt: number
  hospitals: HospitalPublic[]
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CACHE_FILE = path.join(__dirname, '../../data/hospitals-cache.json')
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

const OVERPASS_QUERY = `
[out:json][timeout:120];
area["ISO3166-1"="VE"]["admin_level"="2"]->.ve;
(
  node["amenity"="hospital"](area.ve);
  way["amenity"="hospital"](area.ve);
  relation["amenity"="hospital"](area.ve);
  node["healthcare"="hospital"](area.ve);
  way["healthcare"="hospital"](area.ve);
  relation["healthcare"="hospital"](area.ve);
);
out center;
`

let memoryCache: FileCache | null = null
let refreshPromise: Promise<HospitalPublic[]> | null = null

function buildDireccion(tags: Record<string, string>): string | undefined {
  const parts = [
    tags['addr:street'],
    tags['addr:city'] || tags['addr:municipality'],
    tags['addr:state'],
  ].filter(Boolean)

  if (parts.length > 0) return parts.join(', ')
  return tags.address
}

function normalizeHospital(element: OverpassElement): HospitalPublic | null {
  const lat = element.lat ?? element.center?.lat
  const lng = element.lon ?? element.center?.lon
  if (typeof lat !== 'number' || typeof lng !== 'number') return null

  const tags = element.tags ?? {}
  const nombre = tags.name || tags['name:es'] || tags['official_name'] || 'Hospital sin nombre'

  const direccion = buildDireccion(tags)

  return {
    id: `osm-${element.type}-${element.id}`,
    nombre,
    lat,
    lng,
    direccion,
    estado: resolveEstadoFromDireccion(tags['addr:state'] || direccion),
    telefono: tags.phone || tags['contact:phone'],
    fuente: 'openstreetmap',
  }
}

async function fetchHospitalsFromOverpass(): Promise<HospitalPublic[]> {
  const response = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      'User-Agent': 'HelpAcopio/1.0 (centros de acopio)',
    },
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
  })

  if (!response.ok) {
    throw new Error(`Overpass respondió con estado ${response.status}`)
  }

  const data = (await response.json()) as OverpassResponse
  const byId = new Map<string, HospitalPublic>()

  for (const element of data.elements) {
    const hospital = normalizeHospital(element)
    if (hospital) byId.set(hospital.id, hospital)
  }

  return [...byId.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
}

async function readFileCache(): Promise<FileCache | null> {
  try {
    const raw = await fs.readFile(CACHE_FILE, 'utf8')
    const parsed = JSON.parse(raw) as FileCache
    if (!Array.isArray(parsed.hospitals) || typeof parsed.cachedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

async function writeFileCache(hospitals: HospitalPublic[]) {
  const payload: FileCache = { cachedAt: Date.now(), hospitals }
  await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true })
  await fs.writeFile(CACHE_FILE, JSON.stringify(payload), 'utf8')
  memoryCache = payload
}

async function refreshHospitalsCache(): Promise<HospitalPublic[]> {
  const hospitals = await fetchHospitalsFromOverpass()
  await writeFileCache(hospitals)
  return hospitals
}

function scheduleRefresh() {
  if (refreshPromise) return
  refreshPromise = refreshHospitalsCache()
    .catch(() => memoryCache?.hospitals ?? [])
    .finally(() => {
      refreshPromise = null
    })
}

async function getHospitalsCache(): Promise<FileCache | null> {
  if (memoryCache) return memoryCache

  const fromFile = await readFileCache()
  if (fromFile) {
    memoryCache = fromFile
    return fromFile
  }

  return null
}

void getHospitalsCache().then((cache) => {
  if (cache && Date.now() - cache.cachedAt > CACHE_TTL_MS) {
    scheduleRefresh()
  }
})

hospitalsRouter.get('/', async (_req, res) => {
  const cached = await getHospitalsCache()

  if (cached) {
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.json(cached.hospitals)

    if (Date.now() - cached.cachedAt > CACHE_TTL_MS) {
      scheduleRefresh()
    }
    return
  }

  try {
    const hospitals = await refreshHospitalsCache()
    res.json(hospitals)
  } catch {
    res.status(502).json({ message: 'No se pudieron cargar los hospitales' })
  }
})
