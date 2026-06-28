import mongoose from 'mongoose'

export async function connectDB(uri: string): Promise<void> {
  try {
    await mongoose.connect(uri)
    console.log('MongoDB conectado')
  } catch (error) {
    console.error('Error al conectar con MongoDB:', error)
    process.exit(1)
  }
}
