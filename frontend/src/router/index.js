/**
 * Rutas del frontend.
 * meta.titulo / meta.icono -> aparecen en el menú lateral
 * meta.soloAdmin           -> solo el administrador puede entrar
 */
import { createRouter, createWebHashHistory } from 'vue-router'
import { sesion, cargarSesion } from '../services/sesion'

import LoginView from '../views/LoginView.vue'
import ListasView from '../views/ListasView.vue'
import ListaFormView from '../views/ListaFormView.vue'
import ListaDetalleView from '../views/ListaDetalleView.vue'
import EscuelasView from '../views/EscuelasView.vue'
import EstadisticasView from '../views/EstadisticasView.vue'

export const rutas = [
  { path: '/login',             component: LoginView,        meta: { publica: true } },
  { path: '/listas',            component: ListasView,       meta: { titulo: 'Listas',       icono: 'bi-card-checklist' } },
  { path: '/listas/nueva',      component: ListaFormView,    meta: { titulo: 'Nueva lista',  icono: 'bi-plus-square' } },
  { path: '/listas/:id',        component: ListaDetalleView, meta: { tituloPagina: 'Detalle de lista' } },
  { path: '/listas/:id/editar', component: ListaFormView,    meta: { tituloPagina: 'Editar lista' } },
  { path: '/escuelas',          component: EscuelasView,     meta: { titulo: 'Escuelas',     icono: 'bi-building' } },
  { path: '/estadisticas',      component: EstadisticasView, meta: { titulo: 'Estadísticas', icono: 'bi-clipboard-data', soloAdmin: true } },
  { path: '/:pathMatch(.*)*', redirect: '/listas' },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes: rutas,
})

// Guardia: revisa la sesión (y el rol) antes de entrar a cada página
router.beforeEach(async (destino) => {
  if (destino.meta.publica) return true
  if (!sesion.usuario) await cargarSesion()
  if (!sesion.usuario) return '/login'
  if (destino.meta.soloAdmin && sesion.usuario.rol !== 'Administrador') return '/listas'
})

export default router
