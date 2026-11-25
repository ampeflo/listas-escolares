<!-- Tablero de listas: contadores por estado, filtros y tabla -->
<template>
  <div>
    <!-- Contadores por estado (clic = filtrar) -->
    <div class="row g-3 mb-3">
      <div v-for="(info, clave) in ESTADOS_LISTA" :key="clave" class="col-6 col-xl-3">
        <div class="card h-100 tarjeta-estado" :class="{ activa: estado === clave }" @click="filtrarEstado(clave)">
          <div class="card-body kpi">
            <div class="icono" :class="'text-bg-' + info.color + ' bg-opacity-25'"><i class="bi" :class="info.icono"></i></div>
            <div>
              <div class="valor">{{ conteo[clave] ?? 0 }}</div>
              <div class="etiqueta">{{ info.texto }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="d-flex flex-wrap gap-2 mb-3">
      <input v-model="buscar" type="search" class="form-control" style="max-width: 280px"
             placeholder="Folio, cliente o teléfono" @input="cargar">
      <select v-model="escuela" class="form-select" style="max-width: 260px" @change="cargar">
        <option value="">Todas las escuelas</option>
        <option v-for="e in escuelas" :key="e._id" :value="e._id">{{ e.nombre }}</option>
      </select>
      <button v-if="estado" class="btn btn-outline-secondary" @click="filtrarEstado('')">
        <i class="bi bi-x"></i> Quitar filtro "{{ ESTADOS_LISTA[estado].texto }}"
      </button>
      <router-link to="/listas/nueva" class="btn btn-primary ms-auto"><i class="bi bi-plus-lg"></i> Nueva lista</router-link>
    </div>

    <div class="card">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead>
            <tr><th>Folio</th><th>Cliente</th><th>Escuela / grado</th><th class="text-center">Surtido</th><th>Estado</th><th class="text-end">Total</th><th></th></tr>
          </thead>
          <tbody>
            <tr v-for="l in listas" :key="l._id" style="cursor: pointer" @click="$router.push('/listas/' + l._id)">
              <td class="fw-semibold">{{ l.folio }}</td>
              <td>
                {{ l.cliente.nombre }}
                <div class="small text-muted">{{ l.cliente.telefono }}</div>
              </td>
              <td>
                {{ l.escuela.nombre }}
                <div class="small text-muted">{{ l.grado }}</div>
              </td>
              <td class="text-center">
                <span class="small">{{ surtidos(l) }} / {{ l.articulos.length }}</span>
                <i v-if="tieneFaltantes(l)" class="bi bi-exclamation-circle-fill text-danger ms-1" title="Tiene artículos faltantes"></i>
              </td>
              <td><EtiquetaEstado :estado="l.estado" /></td>
              <td class="text-end fw-semibold">{{ dinero(l.total) }}</td>
              <td class="acciones"><i class="bi bi-chevron-right text-muted"></i></td>
            </tr>
            <tr v-if="!listas.length"><td colspan="7" class="vacio">No hay listas con estos filtros</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { avisar } from '../services/avisos'
import { dinero } from '../services/formato'
import { ESTADOS_LISTA } from '../services/estados'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'

const todas = ref([])        // listas sin filtro de estado (para los contadores)
const escuelas = ref([])
const buscar = ref('')
const escuela = ref('')
const estado = ref('')

// La tabla muestra solo el estado elegido; los contadores usan todas
const listas = computed(() => estado.value ? todas.value.filter(l => l.estado === estado.value) : todas.value)
const conteo = computed(() => {
  const c = {}
  todas.value.forEach(l => { c[l.estado] = (c[l.estado] ?? 0) + 1 })
  return c
})

const surtidos = l => l.articulos.filter(a => a.estado === 'surtido').length
const tieneFaltantes = l => l.articulos.some(a => a.estado === 'faltante')

onMounted(async () => {
  try {
    escuelas.value = (await api('/escuelas')).data
    await cargar()
  } catch (e) {
    avisar(e.message, 'danger')
  }
})

async function cargar() {
  const params = new URLSearchParams({ buscar: buscar.value, escuela: escuela.value })
  todas.value = (await api('/listas?' + params)).data
}

function filtrarEstado(clave) {
  estado.value = estado.value === clave ? '' : clave
}
</script>
