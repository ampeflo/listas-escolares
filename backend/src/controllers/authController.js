/**
 * Inicio y cierre de sesión.
 */
import bcrypt from 'bcryptjs'
import Usuario from '../models/Usuario.js'
import { ErrorApp } from '../middleware/errores.js'

// POST /api/login
export async function login(req, res) {
  const { usuario, password } = req.body
  if (!usuario || !password) throw new ErrorApp('Escribe tu usuario y contraseña.', 422)

  const u = await Usuario.findOne({ usuario: String(usuario).toLowerCase().trim() })

  // bcrypt.compare compara la contraseña escrita con la cifrada
  if (!u || !(await bcrypt.compare(String(password), u.password))) {
    throw new ErrorApp('Usuario o contraseña incorrectos.', 401)
  }

  // Se guarda en la sesión (nunca la contraseña)
  req.session.usuario = { id: u._id, nombre: u.nombre, usuario: u.usuario, rol: u.rol }
  res.json({ ok: true, data: req.session.usuario, mensaje: `Bienvenido(a), ${u.nombre}` })
}

// POST /api/logout
export function logout(req, res) {
  req.session.destroy(() => res.json({ ok: true, mensaje: 'Sesión cerrada.' }))
}

// GET /api/sesion
export function sesion(req, res) {
  res.json({ ok: true, data: req.session.usuario })
}
