import mongoose from 'mongoose'

import { Centro } from '../models/Centro.js'

async function ensureCentroIndexes(): Promise<void> {
  await Centro.updateMany(
    { $or: [{ email: null }, { email: '' }] },
    { $unset: { email: '' } },
  )

  const collection = Centro.collection
  const indexes = await collection.indexes()
  const emailIndex = indexes.find((index) => index.key?.email === 1)

  if (emailIndex && !emailIndex.sparse) {
    await collection.dropIndex(emailIndex.name)
    console.log('Índice email recreado como sparse')
  }

  await Centro.syncIndexes()
}

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri)
    console.log('MongoDB conectado')
    await ensureCentroIndexes()
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error)
    process.exit(1)
  }
}
