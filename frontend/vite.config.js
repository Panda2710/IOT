import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Cấu hình Vite tích hợp React và Tailwind CSS bản mới nhất (v4)
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
})