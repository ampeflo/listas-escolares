/**
 * CRUD de escuelas.
 */
import Escuela from '../models/Escuela.js'
import Lista from '../models/Lista.js'
import { ErrorApp } from '../middleware/errores.js'

// GET /api/escuelas
export async function listar(req, res) {
  const escuelas = await Escuela.find().sort({ nivel: 1, nombre: 1 })
  res.json({ ok: true, data: escuelas })
}

// POST /api/escuelas
export async function crear(req, res) {
  const { nombre, nivel, grados } = req.body
  await Escuela.create({ nombre, nivel, grados })
  res.status(201).json({ ok: true, mensaje: 'Escuela registrada.' })
}

// PUT /api/escuelas/:id
export async function actualizar(req, res) {
  const escuela = await Escuela.findById(req.params.id)
  if (!escuela) throw new ErrorApp('Escuela no encontrada.', 404)

  const { nombre, nivel, grados } = req.body
  escuela.set({ nombre, nivel, grados })
  await escuela.save()

  // Las listas guardan una COPIA del nombre de la escuela (para no consultar otra colección).
  // Si el nombre cambia, se actualiza en todas sus listas con updateMany.
  await Lista.updateMany({ 'escuela.id': escuela._id }, { $set: { 'escuela.nombre': escuela.nombre } })

  res.json({ ok: true, mensaje: 'Escuela actualizada.' })
}

// DELETE /api/escuelas/:id
export async function eliminar(req, res) {
  // MongoDB no tiene llaves foráneas: la regla se revisa aquí, en el código
  const listas = await Lista.countDocuments({ 'escuela.id': req.params.id })
  if (listas > 0) {
    throw new ErrorApp(`No se puede eliminar: la escuela tiene ${listas} lista(s) registradas.`, 409)
  }

  const eliminada = await Escuela.findByIdAndDelete(req.params.id)
  if (!eliminada) throw new ErrorApp('Escuela no encontrada.', 404)
  res.json({ ok: true, mensaje: 'Escuela eliminada.' })
}
