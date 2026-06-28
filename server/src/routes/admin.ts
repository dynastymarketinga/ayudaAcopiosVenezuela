import fs from 'fs'
import path from 'path'
import { Router } from 'express'
import { UPLOADS_ROOT } from '../config/upload.js'
import { Centro } from '../models/Centro.js'
import { adminAuthMiddleware, signAdminToken, toPublicCentro } from '../middleware/auth.js'

export const adminRouter = Router()

function getPanelCredentials() {
  const email = process.env.PANEL_EMAIL?.trim().toLowerCase()
  const password = process.env.PANEL_PASSWORD
  return { email, password }
}

adminRouter.post('/login', (req, res) => {
  const { email, password } = getPanelCredentials()

  if (!email || !password) {
    res.status(503).json({ message: 'Panel no configurado' })
    return
  }

  const { email: inputEmail, password: inputPassword } = req.body

  if (
    typeof inputEmail !== 'string' ||
    typeof inputPassword !== 'string' ||
    inputEmail.trim().toLowerCase() !== email ||
    inputPassword !== password
  ) {
    res.status(401).json({ message: 'Credenciales incorrectas' })
    return
  }

  res.json({ token: signAdminToken() })
})

adminRouter.get('/centros', adminAuthMiddleware, async (_req, res) => {
  const centros = await Centro.find().select('-password').sort({ nombre: 1 })
  res.json(centros.map(toPublicCentro))
})

adminRouter.delete('/centros/:id', adminAuthMiddleware, async (req, res) => {
  const centro = await Centro.findByIdAndDelete(req.params.id)

  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  const uploadsDir = path.join(UPLOADS_ROOT, String(centro._id))
  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true })
  }

  res.status(204).send()
})
