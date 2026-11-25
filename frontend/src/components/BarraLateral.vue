<!-- Menú lateral. En celular se abre con el botón ☰ -->
<template>
  <aside id="sidebar" ref="el" class="sidebar offcanvas-lg offcanvas-start" tabindex="-1">
    <div class="offcanvas-header d-lg-none pb-0">
      <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="offcanvas" data-bs-target="#sidebar"></button>
    </div>

    <router-link to="/listas" class="marca">
      <span class="logo"><i class="bi bi-backpack2-fill"></i></span>
      <span class="lh-sm">Listas escolares<br><small class="fw-normal opacity-75" style="font-size: .75rem">El Lápiz Feliz</small></span>
    </router-link>

    <nav class="nav flex-column">
      <router-link v-for="ruta in menu" :key="ruta.path" :to="ruta.path" class="nav-link"
                   :class="{ active: estaActiva(ruta.path) }">
        <i class="bi" :class="ruta.meta.icono"></i>{{ ruta.meta.titulo }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { Offcanvas } from 'bootstrap'
import { rutas } from '../router'
import { esAdmin } from '../services/sesion'

const route = useRoute()

// El menú muestra las rutas con título; las de solo administrador se ocultan al cajero
const menu = computed(() => rutas.filter(r => r.meta?.titulo && (!r.meta.soloAdmin || esAdmin.value)))

// "Listas" queda activo también en el detalle y al editar, pero no en "Nueva lista"
function estaActiva(ruta) {
  if (ruta === '/listas') return route.path.startsWith('/listas') && route.path !== '/listas/nueva'
  return route.path === ruta
}

// En celular, cerrar el menú al cambiar de página
const el = ref(null)
watch(() => route.path, () => Offcanvas.getInstance(el.value)?.hide())
</script>
