import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseTarget = env.VITE_SUPABASE_URL || ''
  const devProxy =
    env.VITE_SUPABASE_DEV_PROXY === '1' || env.VITE_SUPABASE_DEV_PROXY === 'true'

  const proxy: Record<string, import('vite').ProxyOptions> = {
    '/api': {
      target: 'http://localhost:3005',
      changeOrigin: true,
    },
  }

  if (devProxy && /^https:\/\//.test(supabaseTarget)) {
    proxy['/supabase'] = {
      target: supabaseTarget,
      changeOrigin: true,
      secure: true,
      ws: true,
      rewrite: (path) => path.replace(/^\/supabase/, ''),
      configure: (proxyServer) => {
        proxyServer.on('proxyRes', (proxyRes) => {
          delete proxyRes.headers['set-cookie']
        })
      },
    }
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: { proxy },
  }
})
