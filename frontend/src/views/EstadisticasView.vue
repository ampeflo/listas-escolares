<!--
  Estadísticas (solo administrador).
  Todos los datos se calculan en MongoDB con AGGREGATION PIPELINE (ver estadisticaController.js).
-->
<template>
  <div v-if="datos">
    <!-- Indicadores -->
    <div class="row g-3 mb-3">
      <div v-for="k in indicadores" :key="k.etiqueta" class="col-6 col-lg-3">
        <div class="card h-100">
          <div class="card-body kpi">
            <div class="icono" :class="k.color"><i class="bi" :class="k.icono"></i></div>
            <div>
              <div class="valor">{{ k.valor }}</div>
              <div class="etiqueta">{{ k.etiqueta }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row g-3">
      <!-- Artículos más pedidos -->
      <div class="col-lg-7">
        <div class="card h-100">
          <div class="card-header d-flex flex-wrap gap-2 justify-content-between align-items-center">
            <span>Artículos más pedidos <span class="badge bg-light text-muted fw-normal">$unwind + $group</span></span>
            <select v-model="escuela" class="form-select form-select-sm" style="max-width: 260px" @change="cargar">
              <option value="">Todas las escuelas</option>
              <option v-for="e in escuelas" :key="e._id" :value="e._id">{{ e.nombre }}</option>
            </select>
          </div>
          <table class="table mb-0">
            <thead><tr><th>#</th><th>Artículo</th><th class="text-center">Piezas</th><th class="text-center">Listas</th></tr></thead>
            <tbody>
              <tr v-for="(a, i) in datos.articulos" :key="a._id">
                <td>{{ i + 1 }}</td>
                <td class="text-capitalize">{{ a._id }}</td>
                <td class="text-center fw-semibold">{{ a.piezas }}</td>
                <td class="text-center">{{ a.listas }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Listas por estado -->
      <div class="col-lg-5">
        <div class="card h-100">
          <div class="card-header">Listas por estado <span class="badge bg-light text-muted fw-normal">$group</span></div>
          <ul class="list-group list-group-flush">
            <li v-for="e in porEstado" :key="e._id" class="list-group-item d-flex justify-content-between align-items-center">
              <EtiquetaEstado :estado="e._id" />
              <span class="fw-semibold">{{ e.cantidad }} lista(s)</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Escuelas -->
      <div class="col-12">
        <div class="card">
          <div class="card-header">Listas e ingresos por escuela <span class="badge bg-light text-muted fw-normal">$group + $sort</span></div>
          <div class="table-responsive">
            <table class="table mb-0">
              <thead><tr><th>Escuela</th><th class="text-center">Listas</th><th class="text-end">Ingresos</th></tr></thead>
              <tbody>
                <tr v-for="e in datos.escuelas" :key="e._id">
                  <td>{{ e._id }}</td>
                  <td class="text-center">{{ e.listas }}</td>
                  <td class="text-end fw-semibold">{{ dinero(e.ingresos) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api } from '../services/api'
import { avisar } from '../services/avisos'
import { dinero } from '../services/formato'
import { ORDEN_ESTADOS } from '../services/estados'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'

const datos = ref(null)
const escuelas = ref([])
const escuela = ref('')

const indicadores = computed(() => [
  { etiqueta: 'Listas registradas',    valor: datos.value.totales.listas,                 icono: 'bi-card-checklist',     color: 'bg-suave-azul' },
  { etiqueta: 'Ingresos de temporada', valor: dinero(datos.value.totales.ingresos),       icono: 'bi-cash-stack',         color: 'bg-suave-verde' },
  { etiqueta: 'Ticket promedio',       valor: dinero(datos.value.totales.ticketPromedio), icono: 'bi-receipt',            color: 'bg-suave-amarillo' },
  { etiqueta: 'Con faltantes',         valor: datos.value.faltantes,                      icono: 'bi-exclamation-circle', color: 'bg-suave-rojo' },
])

// Ordena los estados en el orden del proceso (recibida → entregada)
const porEstado = computed(() =>
  [...datos.value.porEstado].sort((a, b) => ORDEN_ESTADOS.indexOf(a._id) - ORDEN_ESTADOS.indexOf(b._id))
)

onMounted(async () => {
  try {
    escuelas.value = (await api('/escuelas')).data
    await cargar()
  } catch (e) {
    avisar(e.message, 'danger')
  }
})

async function cargar() {
  datos.value = (await api('/estadisticas?escuela=' + escuela.value)).data
}
</script>
