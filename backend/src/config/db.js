/**
 * Conexión a MongoDB con Mongoose.
 */
import mongoose from 'mongoose'

export async function conectarDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✔ Conectado a MongoDB:', mongoose.connection.name)
  } catch (error) {
    console.error('✘ No se pudo conectar a MongoDB. ¿Está encendido el servidor?')
    console.error(error.message)
    process.exit(1)
  }
}
