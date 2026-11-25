/**
 * Comunicación con el backend (API en Node.js + Express).
 *
 *   const respuesta = await api('/productos')                     // GET
 *   await api('/productos', 'POST', { nombre: 'Lápiz', ... })      // crear
 *   await api('/productos/5', 'PUT', { ... })                      // editar
 *   await api('/productos/5', 'DELETE')                            // eliminar
 */

// En desarrollo, el proxy de Vite reenvía "/api" al backend (puerto 3000).
// Compilado, Express sirve el frontend y la API en el mismo sitio.
const URL_API = '/api'

export async function api(ruta, metodo = 'GET', datos = null) {
  let respuesta
  try {
    respuesta = await fetch(URL_API + ruta, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: datos ? JSON.stringify(datos) : null,
    })
  } catch {
    throw new Error('No hay conexión con el servidor. ¿Está encendido WampServer?')
  }

  const json = await respuesta.json()
  if (!json.ok) {
    throw new Error(json.mensaje)
  }
  return json // { ok, data, mensaje }
}
