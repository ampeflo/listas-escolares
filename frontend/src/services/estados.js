/**
 * Textos, colores e íconos de cada estado (se usan en varias vistas).
 */

export const ESTADOS_LISTA = {
  recibida:   { texto: 'Recibida',            color: 'secondary', icono: 'bi-inbox' },
  en_surtido: { texto: 'En surtido',          color: 'warning',   icono: 'bi-basket' },
  lista:      { texto: 'Lista para entregar', color: 'info',      icono: 'bi-bag-check' },
  entregada:  { texto: 'Entregada',           color: 'success',   icono: 'bi-check-circle' },
}

// Orden en que avanza una lista
export const ORDEN_ESTADOS = ['recibida', 'en_surtido', 'lista', 'entregada']

export const ESTADOS_ARTICULO = {
  pendiente: { texto: 'Pendiente', color: 'secondary' },
  surtido:   { texto: 'Surtido',   color: 'success' },
  faltante:  { texto: 'Faltante',  color: 'danger' },
}
