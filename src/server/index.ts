import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// eslint-disable-next-line import/no-extraneous-dependencies
import 'express-async-errors'
import express from 'express'
import session from 'express-session'
import passport from 'passport'

import { inE2EMode, inProduction, inStaging } from '../config'
import { PORT, SESSION_SECRET } from './util/config'
import { redisStore } from './util/redis'
import logger from './util/logger'
import router from './routes'
import setupAuthentication from './util/oidc'
import { connectToDatabase } from './db/connection'
import seed from './db/seeders'
import setupCron from './util/cron'

const app = express()

app.use(
  session({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: inE2EMode ? 'testing' : SESSION_SECRET,
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use(['/api', '/api'], (req, res, next) => router(req, res, next))
app.use(['/api', '/api'], (_, res) => res.sendStatus(404))

if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
  const DIST_PATH = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../dist'
  )
  const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')

  app.use(express.static(DIST_PATH))
  app.get('*', (_, res) => res.sendFile(INDEX_PATH))
}

app.listen(PORT, async () => {
  await connectToDatabase()

  // only seed when in dev environment
  if (process.env.NODE_ENV === 'development') {
    await seed()
  }

  await setupAuthentication()

  if (inProduction || inStaging) {
    await setupCron()
  }

  logger.info(`Server running on port ${PORT}`)
})

export default app
