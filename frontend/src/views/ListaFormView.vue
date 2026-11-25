<!--
  Nueva lista / Editar lista.
  Cada artículo puede tener DETALLES LIBRES (forro, marca, raya...):
  aquí se ve la flexibilidad de MongoDB, porque cada artículo guarda campos distintos.
-->
<template>
  <form ref="formulario" :class="{ 'was-validated': validado }" novalidate @submit.prevent="guardar">
    <div class="row g-3">
      <!-- Datos generales -->
      <div class="col-lg-4">
        <div class="card">
          <div class="card-header">Datos de la lista {{ folio && '· ' + folio }}</div>
          <div class="card-body">
            <label class="form-label requerido" for="nombre">Nombre del cliente</label>
            <input id="nombre" v-model.trim="cliente.nombre" class="form-control mb-1" required minlength="3">
            <div class="invalid-feedback mb-2">Mínimo 3 caracteres.</div>

            <label class="form-label requerido mt-2" for="telefono">Teléfono</label>
            <input id="telefono" v-model.trim="cliente.telefono" class="form-control" required pattern="\d{10}" maxlength="10" placeholder="10 dígitos">
            <div class="invalid-feedback">Debe tener 10 dígitos.</div>

            <label class="form-label requerido mt-3" for="escuela">Escuela</label>
            <select id="escuela" v-model="idEscuela" class="form-select" required @change="grado = ''">
              <option value="">Selecciona...</option>
              <option v-for="e in escuelas" :key="e._id" :value="e._id">{{ e.nombre }}</option>
            </select>
            <div class="invalid-feedback">Selecciona una escuela.</div>

            <label class="form-label requerido mt-3" for="grado">Grado y grupo</label>
            <select id="grado" v-model="grado" class="form-select" required :disabled="!escuelaElegida">
              <option value="">Selecciona...</option>
              <option v-for="g in escuelaElegida?.grados" :key="g" :value="g">{{ g }}</option>
            </select>
            <div class="invalid-feedback">Selecciona el grado.</div>

            <hr>
            <div class="d-flex justify-content-between align-items-end">
              <span class="text-muted">Total</span>
              <span class="fs-3 fw-bold text-primary">{{ dinero(total) }}</span>
            </div>
            <div class="d-flex gap-2 mt-3">
              <router-link :to="idLista ? '/listas/' + idLista : '/listas'" class="btn btn-light">Cancelar</router-link>
              <button class="btn btn-primary flex-grow-1" :disabled="guardando">
                <i class="bi bi-save me-1"></i> Guardar lista
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Artículos -->
      <div class="col-lg-8">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <span>Artículos ({{ articulos.length }})</span>
            <button type="button" class="btn btn-sm btn-outline-primary" @click="agregarArticulo">
              <i class="bi bi-plus"></i> Agregar artículo
            </button>
          </div>
          <div class="card-body d-flex flex-column gap-3">
            <div v-for="(a, i) in articulos" :key="a.clave" class="articulo-form">
              <div class="row g-2 align-items-end">
                <div class="col-sm-6">
                  <label class="form-label small mb-1">Artículo</label>
                  <input v-model.trim="a.nombre" class="form-control form-control-sm" required placeholder="Ej. Cuaderno profesional">
                </div>
                <div class="col-4 col-sm-2">
                  <label class="form-label small mb-1">Cantidad</label>
                  <input v-model.number="a.cantidad" type="number" min="1" class="form-control form-control-sm" required>
                </div>
                <div class="col-5 col-sm-3">
                  <label class="form-label small mb-1">Precio c/u</label>
                  <input v-model.number="a.precio" type="number" min="0" step="0.5" class="form-control form-control-sm" required>
                </div>
                <div class="col-3 col-sm-1 text-end">
                  <button type="button" class="btn btn-sm btn-outline-danger" title="Quitar artículo"
                          :disabled="articulos.length === 1" @click="articulos.splice(i, 1)">
                    <i class="bi bi-trash"></i>
                  </button>
                </div>
              </div>

              <!-- Detalles libres: pares "campo: valor" -->
              <div class="mt-2">
                <div v-for="(d, j) in a.detalles" :key="j" class="input-group input-group-sm mb-1" style="max-width: 420px">
                  <input v-model.trim="d.campo" class="form-control" placeholder="Campo (ej. forro)" required>
                  <input v-model.trim="d.valor" class="form-control" placeholder="Valor (ej. azul)" required>
                  <button type="button" class="btn btn-outline-secondary" title="Quitar detalle" @click="a.detalles.splice(j, 1)">
                    <i class="bi bi-x"></i>
                  </button>
                </div>
                <button type="button" class="btn btn-link btn-sm p-0" @click="a.detalles.push({ campo: '', valor: '' })">
                  <i class="bi bi-plus-circle"></i> Agregar detalle (marca, color, forro...)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api } from '../services/api'
import { avisar } from '../services/avisos'
import { dinero } from '../services/formato'

const route = useRoute()
const router = useRouter()
const idLista = route.params.id   // undefined = lista nueva

const escuelas = ref([])
const folio = ref('')
const cliente = ref({ nombre: '', telefono: '' })
const idEscuela = ref('')
const grado = ref('')
const articulos = ref([])
const formulario = ref(null)
const validado = ref(false)
const guardando = ref(false)

let contador = 0  // clave única para cada artículo en pantalla (la usa v-for)
const nuevoArticulo = (a = {}) => ({
  clave: ++contador,
  nombre: a.nombre ?? '',
  cantidad: a.cantidad ?? 1,
  precio: a.precio ?? 0,
  // { forro: 'azul' }  ->  [{ campo: 'forro', valor: 'azul' }]  (más fácil de editar)
  detalles: Object.entries(a.detalles ?? {}).map(([campo, valor]) => ({ campo, valor })),
  estado: a.estado,
})

const escuelaElegida = computed(() => escuelas.value.find(e => e._id === idEscuela.value))
const total = computed(() => articulos.value.reduce((s, a) => s + (a.cantidad || 0) * (a.precio || 0), 0))

onMounted(async () => {
  try {
    escuelas.value = (await api('/escuelas')).data

    if (idLista) {
      const l = (await api('/listas/' + idLista)).data
      folio.value = l.folio
      cliente.value = { ...l.cliente }
      idEscuela.value = l.escuela.id
      grado.value = l.grado
      articulos.value = l.articulos.map(nuevoArticulo)
    } else {
      articulos.value = [nuevoArticulo()]
    }
  } catch (e) {
    avisar(e.message, 'danger')
  }
})

function agregarArticulo() {
  articulos.value.push(nuevoArticulo())
}

async function guardar() {
  validado.value = true
  if (!formulario.value.checkValidity()) {
    return avisar('Revisa los campos marcados en rojo.', 'warning')
  }

  // Se arma el documento tal como se guardará en MongoDB
  const datos = {
    cliente: cliente.value,
    escuela: idEscuela.value,
    grado: grado.value,
    articulos: articulos.value.map(a => ({
      nombre: a.nombre,
      cantidad: a.cantidad,
      precio: a.precio,
      estado: a.estado,
      // [{ campo: 'forro', valor: 'azul' }]  ->  { forro: 'azul' }
      detalles: Object.fromEntries(a.detalles.map(d => [d.campo, d.valor])),
    })),
  }

  guardando.value = true
  try {
    if (idLista) {
      const r = await api('/listas/' + idLista, 'PUT', datos)
      avisar(r.mensaje)
      router.push('/listas/' + idLista)
    } else {
      const r = await api('/listas', 'POST', datos)
      avisar(r.mensaje)
      router.push('/listas/' + r.data._id)
    }
  } catch (e) {
    avisar(e.message, 'danger')
  } finally {
    guardando.value = false
  }
}
</script>
