import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// En local (npm run dev), /api/extraire est servi par la même fonction que sur Vercel.
// Les variables viennent de .env (ignoré par git) et ne sont jamais envoyées au navigateur.
function apiLocale() {
  return {
    name: 'api-locale',
    configureServer(server) {
      const env = loadEnv('development', process.cwd(), '')
      for (const k of ['IA_ACTIVE', 'OVH_AI_ENDPOINTS_ACCESS_TOKEN']) if (env[k] !== undefined) process.env[k] = env[k]
      server.middlewares.use('/api/extraire', async (req, res) => {
        let corps = ''
        for await (const morceau of req) corps += morceau
        try { req.body = corps ? JSON.parse(corps) : {} } catch { req.body = {} }
        res.status = (code) => { res.statusCode = code; return res }
        res.json = (obj) => { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) }
        const { default: handler } = await server.ssrLoadModule('/api/extraire.js')
        await handler(req, res)
      })
    },
  }
}

// base './' : le site fonctionne même s'il est ouvert depuis un sous-dossier
export default defineConfig({
  plugins: [react(), apiLocale()],
  base: './',
})
