/**
 * Modelo Lista (colección "listas") - la colección principal.
 *
 * Una lista escolar completa es UN SOLO DOCUMENTO:
 *  - cliente     -> subdocumento EMBEBIDO
 *  - escuela     -> REFERENCIA (id) + copia del nombre
 *  - articulos   -> arreglo de subdocumentos EMBEBIDOS
 *      detalles  -> campos LIBRES, distintos en cada artículo (forro, marca, raya...)
 *  - historial   -> arreglo que crece con cada cambio de estado
 */
import mongoose from 'mongoose'

export const ESTADOS_LISTA = ['recibida', 'en_surtido', 'lista', 'entregada']
export const ESTADOS_ARTICULO = ['pendiente', 'surtido', 'faltante']

const articuloSchema = new mongoose.Schema({
  nombre:   { type: String, required: [true, 'Cada artículo necesita nombre.'], trim: true },
  cantidad: { type: Number, required: true, min: [1, 'La cantidad mínima es 1.'] },
  precio:   { type: Number, required: true, min: [0, 'El precio no puede ser negativo.'] },
  // Map = objeto con claves libres. Un cuaderno: { raya, hojas }; un lápiz: { marca, numero }
  detalles: { type: Map, of: String, default: {} },
  estado:   { type: String, enum: ESTADOS_ARTICULO, default: 'pendiente' },
})

const listaSchema = new mongoose.Schema(
  {
    folio: { type: String, unique: true },

    cliente: {
      nombre:   { type: String, required: [true, 'El nombre del cliente es obligatorio.'], trim: true },
      telefono: { type: String, required: [true, 'El teléfono es obligatorio.'], match: [/^\d{10}$/, 'El teléfono debe tener 10 dígitos.'] },
    },

    escuela: {
      id:     { type: mongoose.Schema.Types.ObjectId, ref: 'Escuela', required: [true, 'Selecciona una escuela.'] },
      nombre: { type: String, required: true },
    },

    grado: { type: String, required: [true, 'El grado es obligatorio.'] },

    articulos: {
      type: [articuloSchema],
      validate: { validator: a => a.length > 0, message: 'Agrega al menos un artículo.' },
    },

    estado: { type: String, enum: ESTADOS_LISTA, default: 'recibida' },

    historial: [{
      _id: false,
      estado:  String,
      fecha:   { type: Date, default: Date.now },
      usuario: String,
    }],

    total: { type: Number, default: 0 },
  },
  { timestamps: true } // agrega createdAt y updatedAt automáticamente
)

// Antes de guardar, se calcula el total de la lista
listaSchema.pre('save', function () {
  this.total = this.articulos.reduce((suma, a) => suma + a.cantidad * a.precio, 0)
})

// ÍNDICES: aceleran las búsquedas más frecuentes (folio ya es único arriba)
listaSchema.index({ estado: 1 })                        // tablero por estado
listaSchema.index({ 'escuela.nombre': 1, grado: 1 })    // filtro por escuela y grado
listaSchema.index({ 'cliente.telefono': 1 })            // buscar al entregar

export default mongoose.model('Lista', listaSchema, 'listas')
