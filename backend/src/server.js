/**
 * PUNTO DE ENTRADA del backend.
 *   Vue -> /api/... -> Express -> routes/api.js -> middleware -> controller -> model -> MongoDB
 */
import 'dotenv/config'
import { fileURLToPath } from 'node:url'
import express from 'express'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import { conectarDB } from './config/db.js'
import rutas from './routes/api.js'
import { manejarErrores } from './middleware/errores.js'

const app = express()

// 1. Leer el cuerpo JSON de las peticiones
app.use(express.json())

// 2. Sesiones: se guardan en MongoDB (colección "sesiones"), así no se pierden al reiniciar
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI, collectionName: 'sesiones' }),
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 8 * 60 * 60 * 1000 }, // 8 horas
}))

// 3. Rutas de la API
app.use('/api', rutas)

// 4. Ruta no encontrada
app.use('/api', (req, res) => res.status(404).json({ ok: false, mensaje: 'Ruta no encontrada.' }))

// 5. Versión compilada del frontend (después de "npm run build" en frontend/)
//    Así, con "npm start" todo funciona en http://localhost:3000
const carpetaFrontend = fileURLToPath(new URL('../../frontend/dist', import.meta.url))
app.use(express.static(carpetaFrontend))

// 6. Manejo central de errores (siempre al final)
app.use(manejarErrores)

await conectarDB()
app.listen(process.env.PORT, () => {
  console.log(`✔ API lista en http://localhost:${process.env.PORT}/api`)
})
