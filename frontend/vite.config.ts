import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Uncomment the block below when running locally via `pnpm dev` (without Docker).
  // It proxies /api/* requests to the backend at http://localhost:8000.
  // Not needed in Docker/Podman — Nginx handles proxying via nginx.conf instead.
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: 'http://localhost:8000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
})
