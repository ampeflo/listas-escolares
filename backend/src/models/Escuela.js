/**
 * Modelo Escuela (colección "escuelas").
 * Los grados se guardan como un ARREGLO dentro del documento:
 * cada escuela tiene los suyos, sin necesidad de otra tabla.
 */
import mongoose from 'mongoose'

const escuelaSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre es obligatorio.'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre debe tener al menos 3 caracteres.'],
  },
  nivel: {
    type: String,
    required: [true, 'El nivel es obligatorio.'],
    enum: { values: ['preescolar', 'primaria', 'secundaria', 'preparatoria'], message: 'Nivel no válido.' },
  },
  grados: {
    type: [String],
    validate: { validator: g => g.length > 0, message: 'Agrega al menos un grado.' },
  },
})

export default mongoose.model('Escuela', escuelaSchema, 'escuelas')
