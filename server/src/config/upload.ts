import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import multer from 'multer'
import type { AuthRequest } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const UPLOADS_ROOT = path.join(__dirname, '../../uploads')
export const MAX_IMAGES = 10
export const MAX_FILE_SIZE = 5 * 1024 * 1024

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

export function ensureUploadsDir(centroId: string) {
  const dir = path.join(UPLOADS_ROOT, centroId)
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

export function toPublicImageUrl(centroId: string, filename: string) {
  return `/uploads/${centroId}/${filename}`
}

export function urlToFilePath(url: string, centroId: string): string | null {
  const prefix = `/uploads/${centroId}/`
  if (!url.startsWith(prefix)) return null

  const filename = url.slice(prefix.length)
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return null
  }

  return path.join(UPLOADS_ROOT, centroId, filename)
}

export const uploadImagenes = multer({
  storage: multer.diskStorage({
    destination: (req, _file, cb) => {
      const centroId = (req as AuthRequest).centroId
      if (!centroId) {
        cb(new Error('No autorizado'), '')
        return
      }
      cb(null, ensureUploadsDir(centroId))
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const safeExt = ALLOWED_EXTENSIONS.has(ext) ? ext : '.jpg'
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
    },
  }),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIMES.has(file.mimetype)) {
      cb(null, true)
      return
    }
    cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF'))
  },
})
