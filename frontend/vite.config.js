import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  // vueDevTools: botón flotante para inspeccionar componentes (solo con "npm run dev")
  plugins: [vue(), vueDevTools()],

  server: {
    port: 5174,
    // PROXY: en desarrollo, todo lo que empiece con /api se reenvía al backend de Express
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
