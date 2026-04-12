import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const getPackageName = (id) => {
  const normalizedId = id.split('node_modules/')[1]
  if (!normalizedId) return null

  if (normalizedId.startsWith('@')) {
    const [scope, name] = normalizedId.split('/')
    return `${scope}/${name}`
  }

  return normalizedId.split('/')[0]
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:8002/api/v1/'

  // Resolve proxy target for dev server.
  // Priority: VITE_API_PROXY_TARGET > pattern+subdomain > VITE_API_BASE_URL > fallback.
  // For multi-backend dev: set VITE_API_BASE_URL_PATTERN + VITE_DEV_SUBDOMAIN in .env.local.
  //   VITE_API_BASE_URL_PATTERN=https://{subdomain}.api.sekolah.app/api/v1
  //   VITE_DEV_SUBDOMAIN=smpn1
  const resolveProxyTarget = () => {
    if (env.VITE_API_PROXY_TARGET) return env.VITE_API_PROXY_TARGET
    if (env.VITE_API_BASE_URL_PATTERN) {
      const subdomain = env.VITE_DEV_SUBDOMAIN || 'dev'
      const resolved = env.VITE_API_BASE_URL_PATTERN.replace('{subdomain}', subdomain)
      return resolved.replace(/\/api\/v\d+\/?$/i, '')
    }
    return apiBaseUrl.replace(/\/api\/v\d+\/?$/i, '') || 'http://localhost:8002'
  }

  const apiProxyTarget = resolveProxyTarget()

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      strictPort: true,
      open: false,
      watch: {
        // usePolling is only needed inside Docker / network file systems.
        // Enable via VITE_USE_POLLING=true in .env.local rather than always on.
        usePolling: process.env.VITE_USE_POLLING === 'true',
      },
      hmr: {
        clientPort: 5173,
      },
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const targetHost = options.target ? new URL(options.target).host : req.headers.host || 'localhost:5173'
              const targetProtocol = options.target ? new URL(options.target).protocol.replace(':', '') : 'http'

              proxyReq.removeHeader('origin')
              proxyReq.removeHeader('referer')
              proxyReq.setHeader('host', targetHost)
              proxyReq.setHeader('x-forwarded-host', req.headers.host || 'localhost:5173')
              proxyReq.setHeader('x-forwarded-proto', targetProtocol)
            })
          },
        },
        '/ws': {
          target: env.VITE_WS_PROXY_TARGET || 'ws://localhost:8080',
          ws: true,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (!id.includes('node_modules')) {
              return undefined
            }

            const packageName = getPackageName(id)

            if (!packageName) {
              return undefined
            }

            if (packageName === 'react' || packageName === 'react-dom' || packageName === 'scheduler') {
              return 'react-core-vendor'
            }

            if (packageName === 'react-router' || packageName === 'react-router-dom' || packageName === '@remix-run/router') {
              return 'router-vendor'
            }

            if (
              packageName === 'recharts'
              || packageName.startsWith('d3-')
              || packageName === 'victory-vendor'
              || packageName === 'react-smooth'
              || packageName === 'recharts-scale'
              || packageName === 'eventemitter3'
              || packageName === 'tiny-invariant'
              || packageName === 'lodash'
              || packageName === 'lodash-es'
            ) {
              return 'chart-vendor'
            }

            if (packageName === 'lexical' || packageName.startsWith('@lexical/')) {
              return 'lexical-vendor'
            }

            if (packageName === 'pusher-js' || packageName === 'laravel-echo') {
              return 'realtime-vendor'
            }

            if (packageName === '@ag-grid-community/core') {
              return 'ag-grid-core-vendor'
            }

            if (packageName === '@ag-grid-community/react') {
              return 'ag-grid-react-vendor'
            }

            if (packageName === '@ag-grid-community/client-side-row-model') {
              return 'ag-grid-client-row-model-vendor'
            }

            if (packageName === '@ag-grid-community/infinite-row-model') {
              return 'ag-grid-infinite-row-model-vendor'
            }

            if (packageName.startsWith('@hookform/') || packageName === 'react-hook-form' || packageName === 'zod') {
              return 'form-vendor'
            }

            if (packageName.startsWith('@fullcalendar/')) {
              return 'fullcalendar-vendor'
            }

            if (packageName === 'xlsx') {
              return 'xlsx-vendor'
            }

            if (packageName === 'lucide-react') {
              return 'icons-vendor'
            }

            if (packageName === 'zustand') {
              return 'state-vendor'
            }

            if (packageName === 'axios' || packageName === 'clsx' || packageName === 'sweetalert2') {
              return 'utils-vendor'
            }

            return 'vendor'
          }
        }
      }
    }
  }
})
