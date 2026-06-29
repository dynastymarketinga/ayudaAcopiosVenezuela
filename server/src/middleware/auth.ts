import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

export interface AuthRequest extends Request {
  centroId?: string
  admin?: boolean
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string }
    req.centroId = payload.id
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

export function signToken(centroId: string): string {
  return jwt.sign({ id: centroId }, JWT_SECRET, { expiresIn: '7d' })
}

export function signAdminToken(): string {
  return jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '7d' })
}

export function adminAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No autorizado' })
    return
  }

  const token = header.slice(7)

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { role?: string }
    if (payload.role !== 'admin') {
      res.status(401).json({ message: 'No autorizado' })
      return
    }
    req.admin = true
    next()
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' })
  }
}

import type { TipoLugarId } from '../constants/placeTypes.js'
import { DEFAULT_TIPO_LUGAR } from '../constants/placeTypes.js'
import type { PrioridadId } from '../constants/prioridades.js'
import { DEFAULT_PRIORIDAD } from '../constants/prioridades.js'
import { normalizeSuministrosNecesarios } from '../utils/suministros.js'

export function toPublicCentro(centro: {
  _id: unknown
  email?: string
  nombre: string
  tipoLugar?: TipoLugarId
  prioridad?: PrioridadId
  lat?: number
  lng?: number
  direccion?: string
  estado?: string
  telefonos?: string[]
  correosContacto?: string[]
  sitiosWeb?: string[]
  suministrosNecesarios: unknown
  imagenes?: string[]
  imagenPrincipal?: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    _id: String(centro._id),
    email: centro.email,
    nombre: centro.nombre,
    tipoLugar: centro.tipoLugar ?? DEFAULT_TIPO_LUGAR,
    prioridad: centro.prioridad ?? DEFAULT_PRIORIDAD,
    lat: centro.lat,
    lng: centro.lng,
    direccion: centro.direccion,
    estado: centro.estado,
    telefonos: centro.telefonos ?? [],
    correosContacto: centro.correosContacto ?? [],
    sitiosWeb: centro.sitiosWeb ?? [],
    suministrosNecesarios: normalizeSuministrosNecesarios(centro.suministrosNecesarios),
    imagenes: centro.imagenes ?? [],
    imagenPrincipal: centro.imagenPrincipal,
    createdAt: centro.createdAt,
    updatedAt: centro.updatedAt,
  }
}
