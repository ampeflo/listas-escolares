<!-- Escuelas: todos consultan; solo el administrador crea, edita y elimina -->
<template>
  <div>
    <div v-if="esAdmin" class="d-flex mb-3">
      <button class="btn btn-primary ms-auto" @click="nueva"><i class="bi bi-plus-lg"></i> Nueva escuela</button>
    </div>

    <div class="row g-3">
      <div v-for="e in escuelas" :key="e._id" class="col-md-6 col-xl-4">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start">
              <div>
                <h3 class="h6 mb-1">{{ e.nombre }}</h3>
                <span class="badge bg-success-subtle text-success-emphasis text-capitalize">{{ e.nivel }}</span>
              </div>
              <div v-if="esAdmin" class="text-nowrap">
                <button class="btn btn-sm btn-outline-primary me-1" title="Editar" @click="editar(e)"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" title="Eliminar" @click="eliminar(e)"><i class="bi bi-trash"></i></button>
              </div>
            </div>
            <!-- Los grados son un arreglo dentro del documento de la escuela -->
            <div class="mt-3">
              <span v-for="g in e.grados" :key="g" class="detalle-chip">{{ g }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <VentanaModal ref="modal" :titulo="idEditando ? 'Editar escuela' : 'Nueva escuela'">
      <form ref="formulario" :class="{ 'was-validated': validado }" novalidate @submit.prevent="guardar">
        <div class="modal-body">
          <label class="form-label requerido" for="nombre">Nombre</label>
          <input id="nombre" v-model.trim="form.nombre" class="form-control" required minlength="3">
          <div class="invalid-feedback">Mínimo 3 caracteres.</div>

          <label class="form-label requerido mt-3" for="nivel">Nivel</label>
          <select id="nivel" v-model="form.nivel" class="form-select" required>
            <option value="">Selecciona...</option>
            <option value="preescolar">Preescolar</option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
            <option value="preparatoria">Preparatoria</option>
          </select>
          <div class="invalid-feedback">Selecciona el nivel.</div>

          <label class="form-label requerido mt-3" for="grados">Grados y grupos</label>
          <input id="grados" v-model="form.grados" class="form-control" required placeholder="1° A, 1° B, 2° A">
          <div class="form-text">Sepáralos con comas.</div>
          <div class="invalid-feedback">Escribe al menos un grado.</div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
          <button class="btn btn-primary">Guardar</button>
        </div>
      </form>
    </VentanaModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../services/api'
import { avisar } from '../services/avisos'
import { esAdmin } from '../services/sesion'
import VentanaModal from '../components/VentanaModal.vue'

const escuelas = ref([])
const modal = ref(null)
const formulario = ref(null)
const validado = ref(false)
const idEditando = ref(null)
const form = ref({ nombre: '', nivel: '', grados: '' })

onMounted(cargar)

async function cargar() {
  try {
    escuelas.value = (await api('/escuelas')).data
  } catch (e) {
    avisar(e.message, 'danger')
  }
}

function nueva() {
  idEditando.value = null
  form.value = { nombre: '', nivel: '', grados: '' }
  validado.value = false
  modal.value.abrir()
}

function editar(escuela) {
  idEditando.value = escuela._id
  form.value = { nombre: escuela.nombre, nivel: escuela.nivel, grados: escuela.grados.join(', ') }
  validado.value = false
  modal.value.abrir()
}

async function guardar() {
  validado.value = true
  if (!formulario.value.checkValidity()) return

  const datos = {
    nombre: form.value.nombre,
    nivel: form.value.nivel,
    // "1° A, 1° B"  ->  ["1° A", "1° B"]
    grados: form.value.grados.split(',').map(g => g.trim()).filter(Boolean),
  }

  try {
    const r = idEditando.value
      ? await api('/escuelas/' + idEditando.value, 'PUT', datos)
      : await api('/escuelas', 'POST', datos)
    avisar(r.mensaje)
    modal.value.cerrar()
    await cargar()
  } catch (e) {
    avisar(e.message, 'danger')
  }
}

async function eliminar(escuela) {
  if (!confirm(`¿Eliminar "${escuela.nombre}"?`)) return
  try {
    avisar((await api('/escuelas/' + escuela._id, 'DELETE')).mensaje)
    await cargar()
  } catch (e) {
    avisar(e.message, 'danger')
  }
}
</script>
