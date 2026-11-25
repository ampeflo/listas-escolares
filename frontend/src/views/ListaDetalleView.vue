<!--
  Detalle de una lista: surtir artículos, avanzar el estado y ver el historial.
  - Marcar un artículo usa el operador posicional:  $set: { 'articulos.$.estado': ... }
  - Avanzar el estado usa $set + $push al historial, en una sola operación.
-->
<template>
  <div v-if="lista">
    <!-- Encabezado -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <router-link to="/listas" class="btn btn-light btn-sm"><i class="bi bi-arrow-left"></i></router-link>
      <h2 class="h4 mb-0">{{ lista.folio }}</h2>
      <EtiquetaEstado :estado="lista.estado" />
      <div class="ms-auto d-flex gap-2">
        <router-link v-if="lista.estado !== 'entregada'" :to="`/listas/${lista._id}/editar`" class="btn btn-outline-primary btn-sm">
          <i class="bi bi-pencil"></i> Editar
        </router-link>
        <button v-if="esAdmin" class="btn btn-outline-danger btn-sm" @click="eliminar"><i class="bi bi-trash"></i> Eliminar</button>
      </div>
    </div>

    <div class="row g-3">
      <!-- Artículos -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between">
            <span>Artículos</span>
            <span class="small text-muted fw-normal">{{ surtidos }} de {{ lista.articulos.length }} surtidos</span>
          </div>
          <div class="table-responsive">
            <table class="table mb-0">
              <thead><tr><th>Artículo</th><th class="text-center">Cant.</th><th class="text-end">Importe</th><th class="text-center">Surtido</th></tr></thead>
              <tbody>
                <tr v-for="a in lista.articulos" :key="a._id">
                  <td>
                    <div class="fw-semibold">{{ a.nombre }}</div>
                    <!-- Los detalles son distintos en cada artículo -->
                    <span v-for="(valor, campo) in a.detalles" :key="campo" class="detalle-chip">{{ campo }}: {{ valor }}</span>
                  </td>
                  <td class="text-center">{{ a.cantidad }}</td>
                  <td class="text-end">{{ dinero(a.cantidad * a.precio) }}</td>
                  <td class="text-center">
                    <div class="btn-group btn-group-sm">
                      <button v-for="(info, clave) in ESTADOS_ARTICULO" :key="clave" class="btn"
                              :class="a.estado === clave ? 'btn-' + info.color : 'btn-outline-' + info.color"
                              :disabled="lista.estado === 'entregada'" :title="info.texto"
                              @click="marcarArticulo(a, clave)">
                        <i class="bi" :class="iconoArticulo[clave]"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr><th colspan="2" class="text-end">Total</th><th class="text-end">{{ dinero(lista.total) }}</th><th></th></tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Cliente, estado e historial -->
      <div class="col-lg-4 d-flex flex-column gap-3">
        <div class="card">
          <div class="card-body small">
            <div><i class="bi bi-person me-1"></i> <b>{{ lista.cliente.nombre }}</b></div>
            <div><i class="bi bi-telephone me-1"></i> {{ lista.cliente.telefono }}</div>
            <div><i class="bi bi-building me-1"></i> {{ lista.escuela.nombre }} · {{ lista.grado }}</div>
            <div class="text-muted mt-1">Registrada: {{ fecha(lista.createdAt) }}</div>
          </div>
        </div>

        <div v-if="siguienteEstado" class="card">
          <div class="card-body">
            <p class="small text-muted mb-2">Siguiente paso</p>
            <div v-if="siguienteEstado === 'lista' && faltan" class="alert alert-warning small py-2">
              Aún hay {{ faltan }} artículo(s) sin surtir.
            </div>
            <button class="btn btn-primary w-100" @click="avanzarEstado">
              <i class="bi me-1" :class="ESTADOS_LISTA[siguienteEstado].icono"></i>
              Marcar como "{{ ESTADOS_LISTA[siguienteEstado].texto }}"
            </button>
          </div>
        </div>

        <div class="card">
          <div class="card-header">Historial</div>
          <div class="card-body">
            <ul class="linea-tiempo">
              <li v-for="(h, i) in lista.historial" :key="i">
                <div class="fw-semibold small">{{ ESTADOS_LISTA[h.estado]?.texto }}</div>
                <div class="text-muted" style="font-size: .78rem">{{ fecha(h.fecha) }} · {{ h.usuario }}</div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { avisar } from '../services/avisos'
import { esAdmin } from '../services/sesion'
import { dinero, fecha } from '../services/formato'
import { ESTADOS_LISTA, ESTADOS_ARTICULO, ORDEN_ESTADOS } from '../services/estados'
import EtiquetaEstado from '../components/EtiquetaEstado.vue'

const route = useRoute()
const router = useRouter()
const lista = ref(null)

const iconoArticulo = { pendiente: 'bi-hourglass', surtido: 'bi-check-lg', faltante: 'bi-x-lg' }

const surtidos = computed(() => lista.value.articulos.filter(a => a.estado === 'surtido').length)
const faltan = computed(() => lista.value.articulos.length - surtidos.value)
const siguienteEstado = computed(() => ORDEN_ESTADOS[ORDEN_ESTADOS.indexOf(lista.value.estado) + 1])

onMounted(cargar)

async function cargar() {
  try {
    lista.value = (await api('/listas/' + route.params.id)).data
  } catch (e) {
    avisar(e.message, 'danger')
    router.push('/listas')
  }
}

async function marcarArticulo(articulo, estado) {
  try {
    await api(`/listas/${lista.value._id}/articulos/${articulo._id}`, 'PATCH', { estado })
    articulo.estado = estado   // se actualiza en pantalla sin recargar todo
  } catch (e) {
    avisar(e.message, 'danger')
  }
}

async function avanzarEstado() {
  try {
    avisar((await api(`/listas/${lista.value._id}/estado`, 'PATCH', { estado: siguienteEstado.value })).mensaje)
    await cargar()   // recarga para ver el nuevo evento en el historial
  } catch (e) {
    avisar(e.message, 'danger')
  }
}

async function eliminar() {
  if (!confirm(`¿Eliminar la lista ${lista.value.folio}? No se puede deshacer.`)) return
  try {
    avisar((await api('/listas/' + lista.value._id, 'DELETE')).mensaje)
    router.push('/listas')
  } catch (e) {
    avisar(e.message, 'danger')
  }
}
</script>
