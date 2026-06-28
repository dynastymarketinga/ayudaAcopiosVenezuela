import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { connectDB } from './config/db.js'
import { UPLOADS_ROOT } from './config/upload.js'
import { authRouter } from './routes/auth.js'
import { centrosRouter } from './routes/centros.js'
import { geocodeRouter } from './routes/geocode.js'
import { hospitalsRouter } from './routes/hospitals.js'

const PORT = Number(process.env.PORT) || 3000
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/helpAcopio'

async function main() {
  await connectDB(MONGODB_URI)

  const app = express()

  app.use(cors())
  app.use(express.json())
  app.use('/uploads', express.static(UPLOADS_ROOT))

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: 'API funcionando' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/centros', centrosRouter)
  app.use('/api/geocode', geocodeRouter)
  app.use('/api/hospitals', hospitalsRouter)

  app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`)
  })
}

main()
