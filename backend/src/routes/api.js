/**
 * RUTAS DE LA API
 * Formato:  router.metodo('/ruta', middleware, controlador.funcion)
 *
 *   requiereLogin -> Administrador o Cajero
 *   requiereAdmin -> solo Administrador
 */
import { Router } from 'express'
import { requiereLogin, requiereAdmin } from '../middleware/auth.js'
import * as auth from '../controllers/authController.js'
import * as escuelas from '../controllers/escuelaController.js'
import * as listas from '../controllers/listaController.js'
import * as estadisticas from '../controllers/estadisticaController.js'

const router = Router()

// --- Sesión ---
router.post('/login', auth.login)
router.post('/logout', auth.logout)
router.get('/sesion', requiereLogin, auth.sesion)

// --- Listas escolares ---
router.get('/listas', requiereLogin, listas.listar)
router.get('/listas/:id', requiereLogin, listas.ver)
router.post('/listas', requiereLogin, listas.crear)
router.put('/listas/:id', requiereLogin, listas.actualizar)
router.delete('/listas/:id', requiereAdmin, listas.eliminar)
router.patch('/listas/:id/estado', requiereLogin, listas.cambiarEstado)
router.patch('/listas/:id/articulos/:articuloId', requiereLogin, listas.cambiarEstadoArticulo)

// --- Escuelas ---
router.get('/escuelas', requiereLogin, escuelas.listar)
router.post('/escuelas', requiereAdmin, escuelas.crear)
router.put('/escuelas/:id', requiereAdmin, escuelas.actualizar)
router.delete('/escuelas/:id', requiereAdmin, escuelas.eliminar)

// --- Estadísticas ---
router.get('/estadisticas', requiereAdmin, estadisticas.resumen)

export default router
