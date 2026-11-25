// =============================================================
//  Script 02: Consultas importantes (para la documentación)
//  Ejecutar:  mongosh database/02_consultas.js
//  Son las mismas operaciones que hace el backend (ver controllers/).
// =============================================================

db = db.getSiblingDB('listas_escolares')
const ver = (titulo, resultado) => { print('\n=== ' + titulo + ' ==='); printjson(resultado) }

// ---------- CONSULTAS (find) ----------

// 1. Buscar una lista por folio (usa el índice único de folio)
ver('1. Lista por folio', db.listas.findOne({ folio: 'LE-0001' }))

// 2. Filtrar por un campo DENTRO de un subdocumento (escuela.nombre)
ver('2. Listas de la Primaria Benito Juárez',
  db.listas.find({ 'escuela.nombre': 'Primaria Benito Juárez' }, { folio: 1, 'cliente.nombre': 1, grado: 1, estado: 1 }).toArray())

// 3. Buscar DENTRO de un arreglo: listas con algún artículo faltante
ver('3. Listas con artículos faltantes',
  db.listas.find({ 'articulos.estado': 'faltante' }, { folio: 1, 'cliente.nombre': 1 }).toArray())

// 4. Buscar por un campo LIBRE de los detalles: artículos de marca Casio
ver('4. Listas que piden algo marca Casio',
  db.listas.find({ 'articulos.detalles.marca': 'Casio' }, { folio: 1, 'escuela.nombre': 1 }).toArray())

// 5. Buscar al cliente por teléfono (usa el índice de cliente.telefono)
ver('5. Listas del teléfono 5512345678',
  db.listas.find({ 'cliente.telefono': '5512345678' }, { folio: 1, estado: 1, total: 1 }).toArray())

// ---------- ACTUALIZACIONES ----------

// 6. Cambiar el estado y AGREGAR al historial en una sola operación ($set + $push)
ver('6. Cambiar estado de LE-0008 a "en_surtido"',
  db.listas.updateOne(
    { folio: 'LE-0008' },
    { $set: { estado: 'en_surtido' }, $push: { historial: { estado: 'en_surtido', fecha: new Date(), usuario: 'Consola' } } }
  ))

// 7. Operador POSICIONAL ($): marcar como surtido SOLO un artículo dentro del arreglo
ver('7. Marcar "Regla" de LE-0008 como surtido',
  db.listas.updateOne(
    { folio: 'LE-0008', 'articulos.nombre': 'Regla' },
    { $set: { 'articulos.$.estado': 'surtido' } }
  ))

// ---------- AGREGACIONES (aggregation pipeline) ----------

// 8. Cuántas listas hay en cada estado
ver('8. Listas por estado',
  db.listas.aggregate([
    { $group: { _id: '$estado', cantidad: { $sum: 1 } } },
    { $sort: { cantidad: -1 } },
  ]).toArray())

// 9. Artículos más pedidos: $unwind separa el arreglo y $group los suma
ver('9. Top 5 artículos más pedidos',
  db.listas.aggregate([
    { $unwind: '$articulos' },
    { $group: { _id: '$articulos.nombre', piezas: { $sum: '$articulos.cantidad' } } },
    { $sort: { piezas: -1 } },
    { $limit: 5 },
  ]).toArray())

// 10. Artículos más pedidos en UNA escuela ($match primero)
ver('10. Artículos más pedidos en la Secundaria Técnica 45',
  db.listas.aggregate([
    { $match: { 'escuela.nombre': 'Secundaria Técnica 45' } },
    { $unwind: '$articulos' },
    { $group: { _id: '$articulos.nombre', piezas: { $sum: '$articulos.cantidad' } } },
    { $sort: { piezas: -1 } },
  ]).toArray())

// 11. Escuelas con más listas e ingresos de la temporada
ver('11. Listas e ingresos por escuela',
  db.listas.aggregate([
    { $group: { _id: '$escuela.nombre', listas: { $sum: 1 }, ingresos: { $sum: '$total' } } },
    { $sort: { listas: -1 } },
  ]).toArray())

// 12. $lookup: unir con la colección escuelas (equivalente a un JOIN)
ver('12. $lookup: lista LE-0001 con los datos completos de su escuela',
  db.listas.aggregate([
    { $match: { folio: 'LE-0001' } },
    { $lookup: { from: 'escuelas', localField: 'escuela.id', foreignField: '_id', as: 'datosEscuela' } },
    { $project: { folio: 1, 'datosEscuela.nombre': 1, 'datosEscuela.nivel': 1, 'datosEscuela.grados': 1 } },
  ]).toArray())

// ---------- ÍNDICES ----------

// 13. Índices de la colección listas
ver('13. Índices de "listas"', db.listas.getIndexes().map(i => i.name))

// 14. explain(): demuestra que la búsqueda por folio USA el índice (IXSCAN) y no recorre todo (COLLSCAN)
const plan = db.listas.find({ folio: 'LE-0005' }).explain('executionStats')
ver('14. explain() de la búsqueda por folio', {
  etapa: plan.queryPlanner.winningPlan.inputStage?.stage ?? plan.queryPlanner.winningPlan.stage,
  documentosRevisados: plan.executionStats.totalDocsExamined,
  documentosDevueltos: plan.executionStats.nReturned,
})
