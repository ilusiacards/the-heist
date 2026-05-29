import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/the-heist/',
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
  },
})
