import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tamaguiPlugin } from '@tamagui/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tamaguiPlugin({
      config: './tamagui.config.ts',
      components: ['tamagui'],
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
})
