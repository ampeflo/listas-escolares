/**
 * Manejo central de errores.
 * Cualquier error en un controlador llega aquí y se convierte
 * en un mensaje claro en JSON.
 */

export class ErrorApp extends Error {
  constructor(mensaje, codigo = 400) {
    super(mensaje)
    this.codigo = codigo
  }
}

// eslint-disable-next-line no-unused-vars
export function manejarErrores(error, req, res, next) {
  // Errores que lanzamos nosotros (ej. "Lista no encontrada")
  if (error instanceof ErrorApp) {
    return res.status(error.codigo).json({ ok: false, mensaje: error.message })
  }

  // Validación del esquema de Mongoose (campos obligatorios, mínimos, enum...)
  if (error.name === 'ValidationError') {
    const mensajes = Object.values(error.errors).map(e => e.message)
    return res.status(422).json({ ok: false, mensaje: mensajes.join(' ') })
  }

  // Un _id con formato incorrecto
  if (error.name === 'CastError') {
    return res.status(400).json({ ok: false, mensaje: 'El identificador no es válido.' })
  }

  // Índice único repetido (ej. dos escuelas con el mismo nombre)
  if (error.code === 11000) {
    return res.status(409).json({ ok: false, mensaje: 'Ya existe un registro con ese dato (duplicado).' })
  }

  console.error(error)
  res.status(500).json({ ok: false, mensaje: 'Ocurrió un error en el servidor.' })
}
