# Sistema B: Listas escolares de la Papelería "El Lápiz Feliz"

Sistema web para **recibir, surtir y entregar listas de útiles escolares** durante la temporada
de regreso a clases. Usa una **base de datos no relacional (MongoDB)** orientada a documentos.

## El problema

En temporada escolar la papelería recibe cientos de listas en papel o por WhatsApp.
Se pierden, se revuelven y nadie sabe cuáles están listas para entregar.
Además, **cada lista es diferente**: una de kínder pide "plastilina de 10 barras" y una de
secundaria pide "calculadora Casio fx-82". Cada artículo trae detalles distintos
(forro, marca, tipo de raya, talla...).

## ¿Por qué una base de datos NO relacional?

| Necesidad del problema                                   | Cómo la resuelve MongoDB                                         |
|----------------------------------------------------------|------------------------------------------------------------------|
| Cada artículo tiene detalles distintos                    | El campo `detalles` acepta cualquier par campo-valor, sin columnas vacías |
| Una lista se consulta siempre completa                    | Cliente, artículos e historial van **dentro de un solo documento**: una lectura trae todo |
| El historial de estados solo crece                        | Se agrega con `$push` en la misma operación que cambia el estado |
| Las escuelas piden cosas nuevas cada año                  | Se agregan campos sin modificar ninguna estructura (no hay `ALTER TABLE`) |

En **MySQL** esto necesitaría al menos 5 tablas (listas, clientes, artículos, detalles de artículo,
historial) y varios JOIN para mostrar una sola lista.

### Tipos de bases NoSQL y por qué se eligió "documentos"

| Tipo         | Ejemplo    | ¿Sirve aquí? |
|--------------|------------|--------------|
| **Documentos** | **MongoDB** | ✅ Una lista es un "documento" natural con partes anidadas y campos variables |
| Clave-valor  | Redis      | ❌ Solo busca por la clave; no permite filtrar por escuela ni agregar estadísticas |
| Columnas     | Cassandra  | ❌ Pensada para millones de escrituras distribuidas; demasiado para una papelería |
| Grafos       | Neo4j      | ❌ Sirve para relaciones complejas (redes sociales, rutas); aquí casi no hay relaciones |

**¿Por qué MongoDB y no otro motor de documentos (como CouchDB o Firestore)?** Es gratuito, funciona
localmente sin internet, tiene *aggregation pipeline* para las estadísticas, índices y un cliente
gráfico (MongoDB Compass). También es el más documentado y el más usado con Node.js.

## Tecnologías

| Parte          | Tecnología                       | Por qué                                                   |
|----------------|----------------------------------|-----------------------------------------------------------|
| Base de datos  | MongoDB 8                        | Base de documentos (ver arriba)                           |
| Backend        | Node.js + Express 5 (MVC)        | JavaScript en servidor; Express es simple y muy usado     |
| Modelado       | Mongoose                         | Define la forma de los documentos y los valida            |
| Sesiones       | express-session + connect-mongo  | Las sesiones se guardan en MongoDB (colección `sesiones`) |
| Contraseñas    | bcryptjs                         | Se guardan cifradas                                       |
| Frontend       | Vue 3 + Vite + Vue Router        | Misma tecnología que el Sistema A                         |
| Estilos           | Bootstrap 5 + Bootstrap Icons | Diseño responsivo                                         |

## Arquitectura

```
┌────────── FRONTEND (Vue) ──────────┐          ┌──────────────── BACKEND (Node · Express · MVC) ────────────────┐
│ views/ListaDetalleView.vue         │          │ src/server.js                                                   │
│   └ services/api.js → fetch('/api')│ ──JSON──▶│   └ routes/api.js       (qué controlador atiende cada URL)       │
│ router/index.js (páginas y rol)    │          │       └ middleware/auth.js (¿tiene sesión? ¿es admin?)            │
│ services/sesion.js (usuario)       │ ◀─JSON── │           └ controllers/listaController.js (valida, decide)        │
└────────────────────────────────────┘          │               └ models/Lista.js (Mongoose: esquema + consultas)    │
                                                └───────────────────────────────┬────────────────────────────────┘
                                                                                ▼
                                                                  MongoDB · base "listas_escolares"
```

**Ejemplo: marcar un artículo como surtido**
1. En `ListaDetalleView.vue` se presiona ✓ → `api('/listas/ID/articulos/ID_ART', 'PATCH', { estado: 'surtido' })`.
2. `routes/api.js` dirige la petición a `listaController.cambiarEstadoArticulo` pasando por `requiereLogin`.
3. El controlador ejecuta en MongoDB:
   `updateOne({ _id, 'articulos._id': idArt }, { $set: { 'articulos.$.estado': 'surtido' } })`
   El operador posicional `$` modifica **solo ese artículo** dentro del arreglo.
4. Responde `{ ok: true }` y Vue actualiza el botón sin recargar la página.

## Estructura de carpetas

```
listas-escolares/
├── database/
│   ├── 01_datos.js           Crea la BD con datos de ejemplo e índices (mongosh)
│   └── 02_consultas.js       Consultas, actualizaciones, agregaciones y explain() para la documentación
├── backend/
│   ├── .env.example          Configuración (puerto, conexión, clave de sesión)
│   └── src/
│       ├── server.js         Punto de entrada
│       ├── config/db.js      Conexión a MongoDB
│       ├── routes/api.js     Rutas → middleware → controlador
│       ├── middleware/       auth.js (login / admin) y errores.js (manejo central de errores)
│       ├── controllers/      auth, lista, escuela, estadistica
│       └── models/           Usuario, Escuela, Lista, Contador
└── frontend/
    ├── vite.config.js        Proxy /api → backend (puerto 3000)
    └── src/
        ├── router/           Rutas y guardia de sesión/rol
        ├── services/         api, sesion, avisos, formato, estados
        ├── components/       BarraLateral, BarraSuperior, VentanaModal, EtiquetaEstado, Avisos
        └── views/            Login, Listas, ListaForm, ListaDetalle, Escuelas, Estadisticas
```

## Modelo de datos

**Base de datos:** `listas_escolares` · **Colecciones:** `listas`, `escuelas`, `usuarios`, `contadores` (+ `sesiones`)

### `listas` (principal)
```json
{
  "_id": ObjectId("..."),
  "folio": "LE-0001",
  "cliente": { "nombre": "Ana López García", "telefono": "5512345678" },
  "escuela": { "id": ObjectId("..."), "nombre": "Primaria Benito Juárez" },
  "grado": "3° A",
  "articulos": [
    { "_id": ObjectId("..."), "nombre": "Cuaderno profesional", "cantidad": 5, "precio": 45,
      "detalles": { "raya": "cuadro chico", "hojas": "100", "forro": "azul" }, "estado": "surtido" },
    { "_id": ObjectId("..."), "nombre": "Lápiz", "cantidad": 3, "precio": 8,
      "detalles": { "marca": "Mirado", "numero": "2" }, "estado": "pendiente" }
  ],
  "estado": "en_surtido",
  "historial": [
    { "estado": "recibida",   "fecha": ISODate("2026-08-10T10:00:00Z"), "usuario": "Luis Hernández" },
    { "estado": "en_surtido", "fecha": ISODate("2026-08-10T16:00:00Z"), "usuario": "Carmen Ruiz" }
  ],
  "total": 249,
  "createdAt": ISODate("..."), "updatedAt": ISODate("...")
}
```

### `escuelas`
```json
{ "_id": ObjectId("..."), "nombre": "Primaria Benito Juárez", "nivel": "primaria",
  "grados": ["1° A", "2° A", "3° A", "4° A", "5° A", "6° A"] }
```

### `usuarios`
```json
{ "_id": ObjectId("..."), "nombre": "Carmen Ruiz", "usuario": "admin", "rol": "Administrador", "password": "$2a$10$..." }
```

### `contadores`
```json
{ "_id": "listas", "valor": 12 }
```

### Decisiones de modelado

| Decisión | Tipo | Por qué |
|---|---|---|
| `cliente` dentro de la lista | **Embebido** | Solo sirve para contactar y entregar esa lista; no se consulta por separado |
| `articulos` dentro de la lista | **Embebido** | Nunca existen sin su lista y siempre se leen juntos |
| `detalles` de cada artículo | **Campos libres** (`Map`) | Cada artículo tiene datos distintos: la ventaja principal de los documentos |
| `historial` dentro de la lista | **Embebido** | Es la línea de tiempo de esa lista; se agrega con `$push` |
| `escuela` | **Referencia (id) + copia del nombre** | La escuela se comparte entre muchas listas. El nombre se copia para mostrarlo sin consultar otra colección; si cambia, se actualiza con `updateMany` |
| `rol` dentro del usuario | **Embebido** | Son solo 2 valores fijos; una colección aparte no aporta nada |
| `total` guardado | **Dato calculado guardado** | Se calcula al guardar y las estadísticas lo suman directo. En MongoDB se acepta guardar datos calculados para leer más rápido |
| Folio con `contadores` + `$inc` | **Operación atómica** | Garantiza folios consecutivos sin repetir |

### Índices

| Colección | Índice | Para qué |
|---|---|---|
| listas | `folio` (único) | Buscar por folio; evita folios repetidos |
| listas | `estado` | Tablero por estado |
| listas | `escuela.nombre` + `grado` | Filtrar por escuela y grupo |
| listas | `cliente.telefono` | Encontrar la lista cuando el cliente viene a recogerla |
| escuelas | `nombre` (único) | No repetir escuelas |
| usuarios | `usuario` (único) | No repetir nombres de usuario |

`02_consultas.js` usa `explain()` para mostrar que la búsqueda por folio **usa el índice** (`IXSCAN`)
y revisa 1 documento en lugar de recorrer toda la colección (`COLLSCAN`).

## API (rutas)

| Método | Ruta | Acción | Acceso |
|---|---|---|---|
| POST | `/api/login` · `/api/logout` | Iniciar / cerrar sesión | Público |
| GET | `/api/sesion` | Usuario actual | Sesión |
| GET | `/api/listas?estado=&escuela=&buscar=` | Buscar listas | Sesión |
| GET | `/api/listas/:id` | Ver una lista | Sesión |
| POST | `/api/listas` | Crear lista | Sesión |
| PUT | `/api/listas/:id` | Editar lista | Sesión |
| DELETE | `/api/listas/:id` | Eliminar lista | Admin |
| PATCH | `/api/listas/:id/estado` | Avanzar estado (`$set` + `$push`) | Sesión |
| PATCH | `/api/listas/:id/articulos/:articuloId` | Surtir artículo (`$` posicional) | Sesión |
| GET / POST / PUT / DELETE | `/api/escuelas[/:id]` | CRUD de escuelas | Ver: sesión · Cambiar: admin |
| GET | `/api/estadisticas?escuela=` | Agregaciones | Admin |

## Operaciones de MongoDB que usa el sistema

| Operación | Dónde | Qué demuestra |
|---|---|---|
| `find` con `$or` y expresiones regulares | Buscar listas | Búsqueda por folio, nombre o teléfono |
| Filtro por subdocumento `'escuela.id'` | Filtro de escuela | Consultar dentro de objetos anidados |
| `'articulos.estado': 'faltante'` | Estadísticas | Consultar dentro de arreglos |
| `$set` + `$push` | Cambiar estado | Dos cambios en una sola operación atómica |
| `$set` con `articulos.$` | Surtir artículo | Modificar un elemento de un arreglo |
| `$inc` | Folio | Contador atómico |
| `updateMany` | Renombrar escuela | Mantener actualizada la copia del nombre |
| `aggregate`: `$unwind`, `$group`, `$sort`, `$limit`, `$match` | Estadísticas | Reportes calculados en la base |
| `$lookup` | `02_consultas.js` | Equivalente a un JOIN cuando se necesita |

## Descargar el proyecto

Repositorio: https://github.com/ampeflo/listas-escolares

**Opción 1, con Git:**
```
cd C:\wamp64\www
git clone https://github.com/ampeflo/listas-escolares.git
```

**Opción 2, sin Git:** en la página del repositorio, botón verde **Code → Download ZIP**. Descomprimir y renombrar la carpeta `listas-escolares-main` a `listas-escolares`.

> El archivo `backend/.env` no se sube al repositorio (tiene datos privados). Se crea copiando `backend/.env.example` (ver el paso 3 de la instalación).

## Instalación

**Requisitos:** MongoDB 8 (servidor + `mongosh`), Node.js 18 o superior. Opcional: MongoDB Compass.

1. **Encender MongoDB** (ver *Notas sobre MongoDB* abajo).
2. **Cargar los datos de ejemplo** (desde la carpeta `listas-escolares`):
   ```
   mongosh database/01_datos.js
   ```
3. **Backend:**
   ```
   cd backend
   copy .env.example .env
   npm install
   npm run dev
   ```
   Debe mostrar `✔ Conectado a MongoDB` y `✔ API lista en http://localhost:3000/api`.
4. **Frontend** (en otra terminal):
   ```
   cd frontend
   npm install
   npm run dev
   ```
   Abrir `http://localhost:5174`.

**Versión final (un solo servidor):** `npm run build` en `frontend/` y `npm start` en `backend/`.
Express sirve la aplicación completa en `http://localhost:3000`.

### Usuarios de prueba

| Usuario | Contraseña | Rol |
|---|---|---|
| admin | admin123 | Administrador |
| luis | cajero123 | Cajero |

## Roles

| Acción | Administrador | Cajero |
|---|:---:|:---:|
| Ver, crear y editar listas; surtir artículos; cambiar estado | ✅ | ✅ |
| Ver escuelas | ✅ | ✅ |
| Eliminar listas; crear, editar y eliminar escuelas | ✅ | ❌ |
| Estadísticas | ✅ | ❌ |

Los permisos se revisan en el **backend** (`middleware/auth.js`). Vue solo oculta los botones.

## Seguridad y buenas prácticas
- **Validación doble:** HTML5 en Vue y esquemas de Mongoose en el servidor (obligatorios, mínimos, `enum`, formato de teléfono).
- **Manejo central de errores** (`middleware/errores.js`): validación, ids inválidos y duplicados se convierten en mensajes claros.
- **Contraseñas cifradas** con bcrypt; la contraseña nunca se envía al frontend.
- **Sesión en cookie `httpOnly`**, guardada en MongoDB.
- **Búsquedas seguras:** el texto que escribe el usuario se escapa antes de usarlo como expresión regular.
- **Integridad sin llaves foráneas:** MongoDB no las tiene, así que el código revisa que la escuela exista
  al guardar una lista y no deja borrar una escuela con listas.
- **El folio solo se genera si la lista es válida**, para no saltarse números.
- Configuración privada en `.env` (no se sube al repositorio; se comparte `.env.example`).

## Comparación con el Sistema A (punto de venta en MySQL)

| | Sistema A: Ventas (MySQL) | Sistema B: Listas escolares (MongoDB) |
|---|---|---|
| Estructura de los datos | Fija: todas las ventas tienen los mismos campos | Variable: cada artículo tiene detalles distintos |
| Prioridad | Integridad del dinero y del inventario | Flexibilidad y rapidez de captura |
| Organización | 7 tablas normalizadas (3FN) | 1 documento por lista, con partes embebidas |
| Para mostrar un ticket o una lista | JOIN de 4 tablas | 1 lectura (`findById`) |
| Integridad | Llaves foráneas y `CHECK` en la base | Validación en Mongoose y reglas en el código |
| Transacciones | Esenciales (venta + stock) | No se necesitan: cada cambio afecta un solo documento, y eso ya es atómico |
| Reportes | `GROUP BY`, subconsultas | *Aggregation pipeline* (`$unwind`, `$group`) |
| Cambiar la estructura | `ALTER TABLE` | Agregar el campo y listo |
| Datos repetidos | Se evitan (normalización) | Se aceptan si aceleran la lectura (nombre de la escuela, total) |

**Conclusión:** en la misma papelería, el **dinero y el inventario** van en **MySQL** porque necesitan
exactitud y relaciones estrictas. Las **listas escolares** van en **MongoDB** porque cada una es
diferente y se trabajan completas.

## Notas sobre MongoDB en este equipo

El servicio de Windows "MongoDB" no arranca porque su archivo de configuración
(`C:\Program Files\MongoDB\Server\8.3\bin\mongod.cfg`) tiene `%MONGO_DATA_PATH%` y `%MONGO_LOG_PATH%`
en lugar de rutas reales. Mientras se corrige, se puede encender manualmente:

```
"C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe" --dbpath "%USERPROFILE%\mongodb-datos"
```

(Debe quedar abierta esa ventana mientras se usa el sistema.)
