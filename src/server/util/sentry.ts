import { init as initSentry, Integrations } from '@sentry/node'
import { Express } from 'express-serve-static-core'

import { inProduction, inStaging, inE2EMode, GIT_SHA } from '../../config'

const initializeSentry = (router: Express) => {
  if (!inProduction || inStaging || inE2EMode) return

  initSentry({
    dsn: 'https://4760b7af8d5702d8e858b22d4c182289@toska.cs.helsinki.fi/22',
    release: GIT_SHA,
    integrations: [
      new Integrations.Http({ tracing: true }),
      new Integrations.Express({ router }),
    ],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
