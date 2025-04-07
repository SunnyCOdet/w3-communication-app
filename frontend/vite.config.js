import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow access from network
    port: 3000
  },
  define: {
   // Required by ethers v5 for browser environments
   'global': {},
   'process.env': {}
  }
})
