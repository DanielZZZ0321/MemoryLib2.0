import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'MemoryLib API' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})