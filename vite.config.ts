import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8082,
    proxy: {
      '/api': {
        target: 'https://student-attendance-system-4d0g.onrender.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
