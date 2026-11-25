/**
 * Modelo Usuario (colección "usuarios").
 * El rol se guarda dentro del documento: en MongoDB no hace falta
 * una colección aparte para un dato tan pequeño que no cambia.
 */
import mongoose from 'mongoose'

const usuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true },
  usuario:  { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },   // cifrada con bcrypt
  rol:      { type: String, enum: ['Administrador', 'Cajero'], required: true },
})

export default mongoose.model('Usuario', usuarioSchema, 'usuarios')
