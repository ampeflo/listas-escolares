/**
 * Middleware de autenticación: se ejecuta ANTES del controlador.
 * La seguridad real está aquí; ocultar un botón en Vue no basta.
 */

export function requiereLogin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión.' })
  }
  next() // continúa al controlador
}

export function requiereAdmin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ ok: false, mensaje: 'Debes iniciar sesión.' })
  }
  if (req.session.usuario.rol !== 'Administrador') {
    return res.status(403).json({ ok: false, mensaje: 'Acceso denegado: solo el administrador puede hacer esto.' })
  }
  next()
}
