import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { Centro } from '../models/Centro.js'
import { authMiddleware, signToken, toPublicCentro, type AuthRequest } from '../middleware/auth.js'

export const authRouter = Router()

authRouter.post('/register', async (req, res) => {
  const { email, password, nombre } = req.body

  if (!email || typeof email !== 'string') {
    res.status(400).json({ message: 'El correo es obligatorio' })
    return
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' })
    return
  }

  if (!nombre || typeof nombre !== 'string') {
    res.status(400).json({ message: 'El nombre del centro es obligatorio' })
    return
  }

  const existing = await Centro.findOne({ email: email.toLowerCase().trim() })
  if (existing) {
    res.status(409).json({ message: 'Ya existe un centro con ese correo' })
    return
  }

  const hashed = await bcrypt.hash(password, 10)
  const centro = await Centro.create({
    email: email.toLowerCase().trim(),
    password: hashed,
    nombre: nombre.trim(),
    suministrosNecesarios: [],
  })

  const token = signToken(String(centro._id))
  res.status(201).json({ token, centro: toPublicCentro(centro) })
})

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    res.status(400).json({ message: 'Correo y contraseña son obligatorios' })
    return
  }

  const centro = await Centro.findOne({ email: email.toLowerCase().trim() })
  if (!centro) {
    res.status(401).json({ message: 'Credenciales incorrectas' })
    return
  }

  const valid = await bcrypt.compare(password, centro.password)
  if (!valid) {
    res.status(401).json({ message: 'Credenciales incorrectas' })
    return
  }

  const token = signToken(String(centro._id))
  res.json({ token, centro: toPublicCentro(centro) })
})

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res) => {
  const centro = await Centro.findById(req.centroId).select('-password')
  if (!centro) {
    res.status(404).json({ message: 'Centro no encontrado' })
    return
  }

  res.json(toPublicCentro(centro))
})
