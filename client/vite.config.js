import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = (
    env.VITE_SOCKET_URL ||
    String(env.VITE_API_URL || '').replace(/\/api\/?$/i, '') ||
    'http://localhost:5000'
  ).replace(/\/$/, '') || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      allowedHosts: true,
      proxy: {
        '/api': backendTarget,
        '/uploads': backendTarget,
        '/socket.io': {
          target: backendTarget,
          ws: true,
        },
      },
    },
  }
})
