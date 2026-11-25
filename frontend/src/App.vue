<!--
  Componente raíz.
  - Login: pantalla completa.
  - Demás páginas: menú lateral + barra superior + vista de la ruta actual.
-->
<template>
  <router-view v-if="$route.meta.publica" />

  <div v-else-if="sesion.usuario" class="layout">
    <BarraLateral />
    <div class="contenido">
      <BarraSuperior />
      <main class="pagina">
        <!-- :key hace que la vista se reinicie al pasar de "editar" a "nueva" -->
        <router-view :key="$route.fullPath" />
      </main>
    </div>
  </div>

  <Avisos />
</template>

<script setup>
import { sesion } from './services/sesion'
import BarraLateral from './components/BarraLateral.vue'
import BarraSuperior from './components/BarraSuperior.vue'
import Avisos from './components/Avisos.vue'
</script>
