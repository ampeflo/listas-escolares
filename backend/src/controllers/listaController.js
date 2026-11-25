/**
 * Listas escolares: CRUD, cambio de estado y surtido de artículos.
 */
import Lista, { ESTADOS_LISTA, ESTADOS_ARTICULO } from '../models/Lista.js'
import Escuela from '../models/Escuela.js'
import { siguienteFolio } from '../models/Contador.js'
import { ErrorApp } from '../middleware/errores.js'

// GET /api/listas?estado=&escuela=&buscar=
export async function listar(req, res) {
  const { estado, escuela, buscar } = req.query
  const filtro = {}

  if (estado) filtro.estado = estado
  if (escuela) filtro['escuela.id'] = escuela           // busca DENTRO del subdocumento

  if (buscar) {
    // Busca por folio, nombre o teléfono del cliente (sin distinguir mayúsculas)
    const texto = new RegExp(buscar.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    filtro.$or = [{ folio: texto }, { 'cliente.nombre': texto }, { 'cliente.telefono': texto }]
  }

  const listas = await Lista.find(filtro)
    .select('folio cliente escuela.nombre grado estado total articulos.estado createdAt') // solo lo necesario
    .sort({ createdAt: -1 })

  res.json({ ok: true, data: listas })
}

// GET /api/listas/:id
export async function ver(req, res) {
  const lista = await Lista.findById(req.params.id)
  if (!lista) throw new ErrorApp('Lista no encontrada.', 404)
  res.json({ ok: true, data: lista })
}

// POST /api/listas
export async function crear(req, res) {
  const escuela = await buscarEscuela(req.body.escuela)

  const lista = new Lista({
    cliente: req.body.cliente,
    escuela: { id: escuela._id, nombre: escuela.nombre },
    grado: req.body.grado,
    articulos: req.body.articulos,
    historial: [{ estado: 'recibida', usuario: req.session.usuario.nombre }],
  })

  await lista.validate()                 // 1. si hay errores, se detiene aquí (sin gastar un folio)
  lista.folio = await siguienteFolio()   // 2. folio consecutivo
  await lista.save()                     // 3. guarda y calcula el total

  res.status(201).json({ ok: true, data: { _id: lista._id, folio: lista.folio }, mensaje: `Lista ${lista.folio} registrada.` })
}

// PUT /api/listas/:id
export async function actualizar(req, res) {
  const lista = await Lista.findById(req.params.id)
  if (!lista) throw new ErrorApp('Lista no encontrada.', 404)
  if (lista.estado === 'entregada') throw new ErrorApp('Una lista entregada ya no se puede editar.', 409)

  const escuela = await buscarEscuela(req.body.escuela)
  lista.set({
    cliente: req.body.cliente,
    escuela: { id: escuela._id, nombre: escuela.nombre },
    grado: req.body.grado,
    articulos: req.body.articulos,
  })
  await lista.save()

  res.json({ ok: true, mensaje: `Lista ${lista.folio} actualizada.` })
}

// DELETE /api/listas/:id   (solo administrador)
export async function eliminar(req, res) {
  const lista = await Lista.findByIdAndDelete(req.params.id)
  if (!lista) throw new ErrorApp('Lista no encontrada.', 404)
  res.json({ ok: true, mensaje: `Lista ${lista.folio} eliminada.` })
}

// PATCH /api/listas/:id/estado   { estado }
export async function cambiarEstado(req, res) {
  const { estado } = req.body
  if (!ESTADOS_LISTA.includes(estado)) throw new ErrorApp('Estado no válido.', 422)

  // UNA sola operación: cambia el estado y AGREGA un evento al historial ($push)
  const resultado = await Lista.updateOne(
    { _id: req.params.id },
    {
      $set: { estado },
      $push: { historial: { estado, fecha: new Date(), usuario: req.session.usuario.nombre } },
    }
  )
  if (resultado.matchedCount === 0) throw new ErrorApp('Lista no encontrada.', 404)

  res.json({ ok: true, mensaje: 'Estado actualizado.' })
}

// PATCH /api/listas/:id/articulos/:articuloId   { estado }
export async function cambiarEstadoArticulo(req, res) {
  const { estado } = req.body
  if (!ESTADOS_ARTICULO.includes(estado)) throw new ErrorApp('Estado no válido.', 422)

  // Operador POSICIONAL ($): actualiza solo el artículo que coincide, dentro del arreglo
  const resultado = await Lista.updateOne(
    { _id: req.params.id, 'articulos._id': req.params.articuloId },
    { $set: { 'articulos.$.estado': estado } }
  )
  if (resultado.matchedCount === 0) throw new ErrorApp('Artículo no encontrado.', 404)

  res.json({ ok: true, mensaje: 'Artículo actualizado.' })
}

/** Revisa que la escuela exista (MongoDB no lo valida solo, como una llave foránea). */
async function buscarEscuela(id) {
  if (!id) throw new ErrorApp('Selecciona una escuela.', 422)
  const escuela = await Escuela.findById(id)
  if (!escuela) throw new ErrorApp('La escuela seleccionada no existe.', 422)
  return escuela
}
