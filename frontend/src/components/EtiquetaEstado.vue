<!-- Etiqueta de color para el estado de una lista -->
<template>
  <span class="badge" :class="'text-bg-' + info.color">
    <i class="bi me-1" :class="info.icono"></i>{{ info.texto }}
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { ESTADOS_LISTA } from '../services/estados'

const props = defineProps({ estado: String })
const info = computed(() => ESTADOS_LISTA[props.estado] ?? ESTADOS_LISTA.recibida)
</script>
