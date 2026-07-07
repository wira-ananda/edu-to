import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { config } from 'dotenv'

config({ path: '../.env' })

const app = new Hono()

app.use(
  '*',
  cors({
    origin: ['http://localhost:5173'],
    credentials: true
  })
)

app.get('/', (c) => {
  return c.json({
    message: 'EduTryout API running'
  })
})

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch
}
