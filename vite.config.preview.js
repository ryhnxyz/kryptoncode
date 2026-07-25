// Build preview single-file: seluruh JS/CSS/font di-inline ke satu index.html
// sehingga bisa di-hosting di file host statis mana pun (dipakai untuk preview
// dari sandbox agent). Tidak dipakai untuk build produksi.
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist-preview',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 100_000,
  },
})
