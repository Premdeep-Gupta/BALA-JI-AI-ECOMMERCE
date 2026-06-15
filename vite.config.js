import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'print-delivery-urls',
      configureServer(server) {
        server.httpServer?.once('listening', () => {
          const port = server.config.server.port || 5175;
          setTimeout(() => {
            console.log(`\n  \x1b[35m🚚 DELIVERY BOY PORTAL:\x1b[0m`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mRegister:\x1b[0m \x1b[36mhttp://localhost:${port}/delivery/register\x1b[0m`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLogin:\x1b[0m    \x1b[36mhttp://localhost:${port}/delivery/login\x1b[0m`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mPortal:\x1b[0m   \x1b[36mhttp://localhost:${port}/delivery/portal\x1b[0m`);
            console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mAdmin:\x1b[0m    \x1b[36mhttp://localhost:${port}/admin\x1b[0m\n`);
          }, 100);
        });
      }
    }
  ],
  server: {
    port: 5175, // Port fix kar diya
    strictPort: true, 
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  // ⚡️ Isse project fast load hoga (Optimization)
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'lucide-react', 
      'react-redux', 
      '@reduxjs/toolkit',
      'framer-motion'
    ],
  },
  // 🚀 Build performance ke liye
  build: {
    sourcemap: false, // Build fast hogi
    chunkSizeWarningLimit: 1600,
  }
})