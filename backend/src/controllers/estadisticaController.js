/**
 * Estadísticas con AGGREGATION PIPELINE.
 * Un pipeline es una lista de pasos; cada paso transforma los documentos:
 *   $match (filtrar) -> $unwind (separar arreglo) -> $group (agrupar) -> $sort -> $limit
 */
import mongoose from 'mongoose'
import Lista from '../models/Lista.js'

// GET /api/estadisticas?escuela=
export async function resumen(req, res) {
  // Filtro opcional por escuela para "artículos más pedidos"
  const idEscuela = String(req.query.escuela ?? '')
  const porEscuela = mongoose.isValidObjectId(idEscuela)
    ? [{ $match: { 'escuela.id': new mongoose.Types.ObjectId(idEscuela) } }]
    : []

  const [totales, porEstado, articulos, escuelas, faltantes] = await Promise.all([

    // 1. Totales generales: número de listas e ingresos
    Lista.aggregate([
      { $group: { _id: null, listas: { $sum: 1 }, ingresos: { $sum: '$total' }, ticketPromedio: { $avg: '$total' } } },
    ]),

    // 2. Cuántas listas hay en cada estado
    Lista.aggregate([
      { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
    ]),

    // 3. Artículos más pedidos: $unwind separa cada artículo del arreglo para poder sumarlos
    Lista.aggregate([
      ...porEscuela,
      { $unwind: '$articulos' },
      { $group: { _id: { $toLower: '$articulos.nombre' }, piezas: { $sum: '$articulos.cantidad' }, listas: { $sum: 1 } } },
      { $sort: { piezas: -1 } },
      { $limit: 10 },
    ]),

    // 4. Escuelas con más listas y lo que han dejado de ingresos
    Lista.aggregate([
      { $group: { _id: '$escuela.nombre', listas: { $sum: 1 }, ingresos: { $sum: '$total' } } },
      { $sort: { listas: -1 } },
    ]),

    // 5. Consulta dentro de un arreglo: listas con al menos un artículo faltante
    Lista.countDocuments({ 'articulos.estado': 'faltante' }),
  ])

  res.json({
    ok: true,
    data: {
      totales: totales[0] ?? { listas: 0, ingresos: 0, ticketPromedio: 0 },
      porEstado,
      articulos,
      escuelas,
      faltantes,
    },
  })
}
