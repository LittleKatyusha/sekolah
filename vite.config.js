import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

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
          // React ecosystem
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
            return 'react-vendor'
          }
          // Charts
          if (id.includes('recharts')) {
            return 'chart-vendor'
          }
          // AG Grid
          if (id.includes('ag-grid')) {
            return 'grid-vendor'
          }
          // Form handling
          if (id.includes('@hookform') || id.includes('react-hook-form') || id.includes('zod')) {
            return 'form-vendor'
          }
          // Icons
          if (id.includes('lucide-react')) {
            return 'icons-vendor'
          }
          // State management
          if (id.includes('zustand')) {
            return 'state-vendor'
          }
          // Utilities
          if (id.includes('clsx') || id.includes('axios') || id.includes('sweetalert2')) {
            return 'utils-vendor'
          }
        }
      }
    }
  }
})
