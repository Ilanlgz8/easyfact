import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' : le site fonctionne même s'il est ouvert depuis un sous-dossier
export default defineConfig({
  plugins: [react()],
  base: './',
})
