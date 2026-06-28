import { Router } from 'express'
import fs from 'fs'
import { TIPOS_LUGAR } from '../constants/placeTypes.js'
import { isValidTipoLugar } from '../constants/placeTypes.js'
import { SUMINISTROS } from '../constants/supplies.js'
import {
  MAX_IMAGES,
  toPublicImageUrl,
  uploadImagenes,
  urlToFilePath,
} from '../config/upload.js'
import { Centro } from '../models/Centro.js'
import { authMiddleware, toPublicCentro, type AuthRequest } from '../middleware/auth.js'
import {
  normalizeWebsites,
  sanitizeStringArray,
  validateContactEmails,
  validatePhones,
  validateWebsites,
} from '../utils/contact.js'
import { parseSuministrosNecesarios } from '../utils/suministros.js'

export const centrosRouter = Router()

centrosRouter.get('/supplies', (_req, res) => {
  res.json(SUMINISTROS)
})

centrosRouter.get('/place-types', (_req, res) => {
  res.json(TIPOS_LUGAR)
})

centrosRouter.get('/', async (req, res) => {
  const query: Record<string, unknown> = {
    lat: { $exists: true, $ne: null },
    lng: { $exists: true, $ne: null },
  }

  const tipo = typeof req.query.tipo === 'string' ? req.query.tipo : undefined
  if (tipo) {
    if (!isValidTipoLugar(tipo)) {
      res.status(400).json({ message: 'Tipo de lugar inválido' })
      return
    }
    query.tipoLugar = tipo
  }

  const centros = await Centro.find(query).select('-password').sort({ nombre: 1 })

  res.json(centros.map(toPublicCentro))
})

centrosRouter.put('/me', authMiddleware, async (req: AuthRequest, res) => {
  const { lat, lng, direccion, suministrosNecesarios, telefonos, correosContacto, sitiosWeb, tipoLugar, nombre } =
    req.body

  const centro = await Centro.findById(req.centroId).select('-password')
  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  if (nombre !== undefined) {
    if (typeof nombre !== 'string' || !nombre.trim()) {
      res.status(400).json({ message: 'El nombre del centro es obligatorio' })
      return
    }
    centro.nombre = nombre.trim()
  }

  if (lat !== undefined) {
    if (typeof lat !== 'number' || lat < -90 || lat > 90) {
      res.status(400).json({ message: 'Latitud inválida' })
      return
    }
    centro.lat = lat
  }

  if (lng !== undefined) {
    if (typeof lng !== 'number' || lng < -180 || lng > 180) {
      res.status(400).json({ message: 'Longitud inválida' })
      return
    }
    centro.lng = lng
  }

  if (direccion !== undefined) {
    centro.direccion = typeof direccion === 'string' ? direccion.trim() : ''
  }

  if (tipoLugar !== undefined) {
    if (!isValidTipoLugar(tipoLugar)) {
      res.status(400).json({ message: 'Tipo de lugar inválido' })
      return
    }
    centro.tipoLugar = tipoLugar
  }

  if (telefonos !== undefined) {
    const parsed = sanitizeStringArray(telefonos)
    if (!parsed) {
      res.status(400).json({ message: 'Los teléfonos deben ser un arreglo' })
      return
    }
    const phoneError = validatePhones(parsed)
    if (phoneError) {
      res.status(400).json({ message: phoneError })
      return
    }
    centro.telefonos = parsed
  }

  if (correosContacto !== undefined) {
    const parsed = sanitizeStringArray(correosContacto)?.map((email) => email.toLowerCase())
    if (!parsed) {
      res.status(400).json({ message: 'Los correos deben ser un arreglo' })
      return
    }
    const emailError = validateContactEmails(parsed)
    if (emailError) {
      res.status(400).json({ message: emailError })
      return
    }
    centro.correosContacto = parsed
  }

  if (sitiosWeb !== undefined) {
    const parsed = sanitizeStringArray(sitiosWeb)
    if (!parsed) {
      res.status(400).json({ message: 'Los sitios web deben ser un arreglo' })
      return
    }
    const siteError = validateWebsites(parsed)
    if (siteError) {
      res.status(400).json({ message: siteError })
      return
    }
    centro.sitiosWeb = normalizeWebsites(parsed)
  }

  if (suministrosNecesarios !== undefined) {
    const parsed = parseSuministrosNecesarios(suministrosNecesarios)
    if (!parsed) {
      res.status(400).json({
        message: 'Cada suministro debe incluir una categoría válida y una descripción detallada',
      })
      return
    }

    centro.suministrosNecesarios = parsed
    centro.markModified('suministrosNecesarios')
  }

  await centro.save()

  res.json(toPublicCentro(centro))
})

centrosRouter.post('/me/imagenes', authMiddleware, (req, res, next) => {
  uploadImagenes.array('imagenes', MAX_IMAGES)(req, res, (err: unknown) => {
    if (err) {
      const message = err instanceof Error ? err.message : 'No se pudieron subir las imágenes'
      res.status(400).json({ message })
      return
    }
    next()
  })
}, async (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[] | undefined
  if (!files?.length) {
    res.status(400).json({ message: 'Selecciona al menos una imagen' })
    return
  }

  const centro = await Centro.findById(req.centroId).select('-password')
  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  const current = centro.imagenes ?? []
  if (current.length + files.length > MAX_IMAGES) {
    for (const file of files) {
      fs.unlink(file.path, () => {})
    }
    res.status(400).json({ message: `Máximo ${MAX_IMAGES} imágenes por centro` })
    return
  }

  const newUrls = files.map((file) => toPublicImageUrl(String(centro._id), file.filename))
  centro.imagenes = [...current, ...newUrls]

  if (!centro.imagenPrincipal) {
    centro.imagenPrincipal = newUrls[0]
  }

  await centro.save()
  res.json(toPublicCentro(centro))
})

centrosRouter.put('/me/imagen-principal', authMiddleware, async (req: AuthRequest, res) => {
  const { url } = req.body

  if (typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ message: 'URL de imagen inválida' })
    return
  }

  const centro = await Centro.findById(req.centroId).select('-password')
  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  if (!centro.imagenes.includes(url)) {
    res.status(400).json({ message: 'La imagen no pertenece a este centro' })
    return
  }

  centro.imagenPrincipal = url
  await centro.save()
  res.json(toPublicCentro(centro))
})

centrosRouter.delete('/me/imagenes', authMiddleware, async (req: AuthRequest, res) => {
  const { url } = req.body

  if (typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ message: 'URL de imagen inválida' })
    return
  }

  const centro = await Centro.findById(req.centroId).select('-password')
  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  if (!centro.imagenes.includes(url)) {
    res.status(400).json({ message: 'La imagen no pertenece a este centro' })
    return
  }

  const filePath = urlToFilePath(url, String(centro._id))
  if (filePath) {
    fs.unlink(filePath, () => {})
  }

  centro.imagenes = centro.imagenes.filter((item) => item !== url)

  if (centro.imagenPrincipal === url) {
    centro.imagenPrincipal = centro.imagenes[0]
  }

  await centro.save()
  res.json(toPublicCentro(centro))
})
