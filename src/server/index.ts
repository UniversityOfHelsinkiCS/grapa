import path from 'path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import express from 'express'
import session from 'express-session'
import passport from 'passport'

import { inE2EMode, inProduction, inStaging, inTest } from '../config.ts'
import { PORT, SESSION_SECRET } from './util/config.ts'
import { redisStore } from './util/redis.ts'
import logger from './util/logger.ts'
import router from './routes/index.ts'
import setupAuthentication from './util/oidc.ts'
import { connectToDatabase } from './db/connection.ts'
import seed from './db/seeders/index.ts'
import setupCron from './util/cron.ts'
import maintenanceMode from './middleware/maintenanceMode.ts'

const app = express()

app.use(
  session({
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    secret: inE2EMode || inTest ? 'testing' : SESSION_SECRET,
  })
)

app.use(passport.initialize())
app.use(passport.session())

app.use(maintenanceMode)

app.use(['/api', '/api'], (req, res, next) => router(req, res, next))
app.use(['/api', '/api'], (_, res) => {
  res.sendStatus(404)
})

if (inProduction || inStaging || inTest) {
  const DIST_PATH = path.resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../dist'
  )
  const INDEX_PATH = path.resolve(DIST_PATH, 'index.html')

  app.use(express.static(DIST_PATH))
  app.get(/.*/, (_, res) => res.sendFile(INDEX_PATH))
}

// Integration tests start the app themselves, the e2e server must listen
if (process.env.NODE_ENV !== 'test' || inE2EMode) {
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
}

export default app
