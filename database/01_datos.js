// =============================================================
//  Sistema B: Listas escolares - Papelería "El Lápiz Feliz"
//  Script 01: Crea la base de datos con datos de ejemplo e índices
//
//  Ejecutar (desde la carpeta del proyecto):
//      mongosh database/01_datos.js
//
//  Usuarios de prueba:
//      admin / admin123   (Administrador)
//      luis  / cajero123  (Cajero)
// =============================================================

db = db.getSiblingDB('listas_escolares')
db.dropDatabase()
print('Base de datos "listas_escolares" reiniciada')

// ---------- 1. ESCUELAS (los grados son un arreglo dentro del documento) ----------
const escuelas = {
  kinder:     { _id: ObjectId(), nombre: 'Jardín de Niños Rosaura Zapata', nivel: 'preescolar', grados: ['1° A', '2° A', '3° A'] },
  primaria:   { _id: ObjectId(), nombre: 'Primaria Benito Juárez',         nivel: 'primaria',   grados: ['1° A', '2° A', '3° A', '4° A', '5° A', '6° A'] },
  primaria2:  { _id: ObjectId(), nombre: 'Primaria Miguel Hidalgo',        nivel: 'primaria',   grados: ['1° A', '1° B', '2° A', '3° A', '4° A', '5° A', '6° A'] },
  secundaria: { _id: ObjectId(), nombre: 'Secundaria Técnica 45',          nivel: 'secundaria', grados: ['1° A', '1° B', '2° A', '3° A'] },
}
db.escuelas.insertMany(Object.values(escuelas))

// ---------- 2. USUARIOS (contraseñas cifradas con bcrypt) ----------
db.usuarios.insertMany([
  { nombre: 'Carmen Ruiz',    usuario: 'admin', rol: 'Administrador', password: '$2a$10$9UxcxqPqnluLIXfQPT5EgeScGXxNpWkAt5VemllfFBHPVo.tMm2h.' },
  { nombre: 'Luis Hernández', usuario: 'luis',  rol: 'Cajero',        password: '$2a$10$JuueUP2TxQlhXqpJ3yxqqOzCnrDAyifwUSWxJnV0BL4AYyXFia5yW' },
])

// ---------- 3. LISTAS ----------
// Artículo: cada uno tiene "detalles" DIFERENTES (aquí se ve la ventaja de los documentos)
function art(nombre, cantidad, precio, detalles = {}, estado = 'pendiente') {
  return { _id: ObjectId(), nombre, cantidad, precio, detalles, estado }
}

function lista(num, cliente, telefono, escuela, grado, articulos, estado, diasAtras) {
  const creada = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000)
  const pasos = ['recibida', 'en_surtido', 'lista', 'entregada']
  const historial = pasos.slice(0, pasos.indexOf(estado) + 1).map((e, i) => ({
    estado: e,
    fecha: new Date(creada.getTime() + i * 6 * 60 * 60 * 1000),
    usuario: i % 2 === 0 ? 'Luis Hernández' : 'Carmen Ruiz',
  }))
  return {
    folio: 'LE-' + String(num).padStart(4, '0'),
    cliente: { nombre: cliente, telefono },
    escuela: { id: escuela._id, nombre: escuela.nombre },   // referencia + copia del nombre
    grado,
    articulos,
    estado,
    historial,
    total: articulos.reduce((s, a) => s + a.cantidad * a.precio, 0),
    createdAt: creada,
    updatedAt: historial[historial.length - 1].fecha,
  }
}

const S = 'surtido', F = 'faltante'

db.listas.insertMany([
  lista(1, 'Ana López García', '5512345678', escuelas.primaria, '3° A', [
    art('Cuaderno profesional', 5, 45, { raya: 'cuadro chico', hojas: '100', forro: 'azul' }, S),
    art('Lápiz', 3, 8, { marca: 'Mirado', numero: '2' }, S),
    art('Colores', 1, 89, { piezas: '12', tipo: 'largos' }, S),
    art('Tijeras', 1, 25, { punta: 'roma' }, S),
  ], 'entregada', 20),

  lista(2, 'Roberto Sánchez', '5534567890', escuelas.secundaria, '1° A', [
    art('Cuaderno profesional', 8, 45, { raya: 'raya', hojas: '100' }, S),
    art('Calculadora científica', 1, 399, { marca: 'Casio', modelo: 'fx-82' }, S),
    art('Juego de geometría', 1, 58, { marca: 'Maped' }, S),
    art('Pluma', 4, 7, { color: 'azul', punta: 'mediana' }, S),
  ], 'entregada', 19),

  lista(3, 'María Fernanda Torres', '5556789012', escuelas.kinder, '2° A', [
    art('Plastilina', 2, 32, { barras: '10' }, S),
    art('Crayolas', 2, 35, { tipo: 'jumbo', piezas: '12' }, S),
    art('Resistol', 1, 28, { tamaño: '110 g' }, S),
    art('Cuaderno de dibujo', 1, 40, { tamaño: 'carta' }, S),
  ], 'entregada', 18),

  lista(4, 'Jorge Ramírez', '5567890123', escuelas.primaria2, '1° B', [
    art('Cuaderno profesional', 4, 45, { raya: 'doble raya', forro: 'rojo' }, S),
    art('Lápiz', 4, 8, { marca: 'Mirado', numero: '2' }, S),
    art('Goma', 2, 6, { marca: 'Pelikan' }, S),
    art('Sacapuntas', 1, 8, { tipo: 'con depósito' }, S),
  ], 'entregada', 15),

  lista(5, 'Laura Méndez', '5578901234', escuelas.primaria, '6° A', [
    art('Cuaderno profesional', 6, 45, { raya: 'cuadro grande', forro: 'verde' }, S),
    art('Juego de geometría', 1, 58, { marca: 'Barrilito' }, S),
    art('Diccionario', 1, 120, { editorial: 'Larousse', idioma: 'español' }, S),
  ], 'lista', 10),

  lista(6, 'Pedro Gómez', '5589012345', escuelas.secundaria, '2° A', [
    art('Cuaderno profesional', 10, 45, { raya: 'raya', hojas: '200' }, S),
    art('Calculadora científica', 1, 399, { marca: 'Casio', modelo: 'fx-991' }, F),
    art('Bata de laboratorio', 1, 180, { talla: 'M', color: 'blanca' }, S),
  ], 'en_surtido', 8),

  lista(7, 'Sofía Castillo', '5590123456', escuelas.kinder, '3° A', [
    art('Plastilina', 1, 32, { barras: '10' }, S),
    art('Pintura dactilar', 1, 65, { colores: '6' }, 'pendiente'),
    art('Cuaderno de dibujo', 2, 40, { tamaño: 'carta' }, S),
    art('Tijeras', 1, 25, { punta: 'roma', mano: 'zurda' }, F),
  ], 'en_surtido', 6),

  lista(8, 'Miguel Ángel Ruiz', '5501234567', escuelas.primaria2, '4° A', [
    art('Cuaderno profesional', 5, 45, { raya: 'cuadro chico' }),
    art('Colores', 1, 89, { piezas: '24', marca: 'Prismacolor' }),
    art('Regla', 1, 10, { medida: '30 cm' }),
    art('Pegamento en barra', 2, 17, { tamaño: '21 g' }),
  ], 'recibida', 4),

  lista(9, 'Gabriela Herrera', '5511223344', escuelas.primaria, '1° A', [
    art('Cuaderno profesional', 4, 45, { raya: 'doble raya', forro: 'azul' }),
    art('Lápiz', 6, 8, { marca: 'Mirado', numero: '2' }),
    art('Crayolas', 1, 35, { piezas: '12' }),
    art('Resistol', 1, 28, { tamaño: '110 g' }),
  ], 'recibida', 3),

  lista(10, 'Fernando Ortiz', '5522334455', escuelas.secundaria, '3° A', [
    art('Cuaderno profesional', 7, 45, { raya: 'raya' }),
    art('Marcatextos', 3, 15, { color: 'amarillo' }),
    art('Memoria USB', 1, 150, { capacidad: '32 GB' }),
  ], 'recibida', 2),

  lista(11, 'Patricia Vega', '5533445566', escuelas.primaria2, '2° A', [
    art('Cuaderno profesional', 5, 45, { raya: 'cuadro grande', forro: 'amarillo' }, S),
    art('Lápiz', 4, 8, { marca: 'Mirado', numero: '2' }, S),
    art('Colores', 1, 89, { piezas: '12' }, F),
  ], 'en_surtido', 1),

  lista(12, 'Ana López García', '5512345678', escuelas.kinder, '1° A', [
    art('Crayolas', 1, 35, { tipo: 'jumbo' }),
    art('Plastilina', 1, 32, { barras: '10' }),
    art('Mochila', 1, 349, { color: 'rosa', tamaño: 'chica' }),
  ], 'recibida', 0),
])

// ---------- 4. CONTADOR de folios (el siguiente será LE-0013) ----------
db.contadores.insertOne({ _id: 'listas', valor: 12 })

// ---------- 5. ÍNDICES ----------
db.usuarios.createIndex({ usuario: 1 }, { unique: true })
db.escuelas.createIndex({ nombre: 1 }, { unique: true })
db.listas.createIndex({ folio: 1 }, { unique: true })                 // búsqueda por folio
db.listas.createIndex({ estado: 1 })                                  // tablero por estado
db.listas.createIndex({ 'escuela.nombre': 1, grado: 1 })              // filtro por escuela y grado
db.listas.createIndex({ 'cliente.telefono': 1 })                      // buscar al entregar

print('Escuelas:', db.escuelas.countDocuments())
print('Usuarios:', db.usuarios.countDocuments())
print('Listas:  ', db.listas.countDocuments())
print('Listo ✔')
