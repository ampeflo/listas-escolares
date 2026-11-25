/**
 * Modelo Contador (colección "contadores").
 * Genera folios consecutivos: LE-0001, LE-0002...
 * $inc es ATÓMICO: aunque dos personas guarden al mismo tiempo, nunca se repite el número.
 */
import mongoose from 'mongoose'

const contadorSchema = new mongoose.Schema({
  _id:   String,   // nombre del contador, ej. "listas"
  valor: Number,
})

const Contador = mongoose.model('Contador', contadorSchema, 'contadores')

export async function siguienteFolio() {
  const contador = await Contador.findOneAndUpdate(
    { _id: 'listas' },
    { $inc: { valor: 1 } },
    { upsert: true, new: true }   // si no existe lo crea; devuelve el valor nuevo
  )
  return 'LE-' + String(contador.valor).padStart(4, '0')
}

export default Contador
