/**
 * Local-only dev server for the /api routes. Vite's dev server doesn't run
 * Vercel serverless functions, so this mounts the same handlers under
 * Express for local testing; vite.config.js proxies /api to this server's
 * port. Production still deploys api/**.js as Vercel functions directly —
 * this file is never used there.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import express from 'express'
import chatHandler from './api/chat/index.js'
import chatExecuteHandler from './api/chat/execute.js'

const app = express()
app.use(express.json())

const wrap = (handler) => (req, res) => {
  Promise.resolve(handler(req, res)).catch((err) => {
    console.error(err)
    if (!res.headersSent) res.status(500).json({ error: err.message })
  })
}

app.post('/api/chat', wrap(chatHandler))
app.post('/api/chat/execute', wrap(chatExecuteHandler))

const port = process.env.API_DEV_PORT || 3001
app.listen(port, () => console.log(`API dev server listening on http://localhost:${port}`))
