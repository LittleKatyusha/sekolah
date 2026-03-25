import { defineConfig } from 'vite'
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

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    open: false,
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
    },
    proxy: {
      '/api': {
        target: 'https://api.akademihub.id',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Some upstream nginx/WAF setups reject browser Origin/Referer in dev proxy requests.
            // Align forwarded request behavior closer to Postman/cURL for auth endpoints.
            proxyReq.removeHeader('origin')
            proxyReq.removeHeader('referer')

            // Ensure upstream sees expected host/scheme headers.
            proxyReq.setHeader('host', 'api.akademihub.id')
            proxyReq.setHeader('x-forwarded-host', req.headers.host || 'localhost:5173')
            proxyReq.setHeader('x-forwarded-proto', 'http')
          })
        },
      },
      // WebSocket proxy – forwards ws://localhost:5173/ws → wss://api.akademihub.id/ws
      '/ws': {
        target: 'wss://api.akademihub.id',
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
})
