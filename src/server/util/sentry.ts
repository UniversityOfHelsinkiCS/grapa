import * as Sentry from '@sentry/node'

import { inProduction, inStaging, inE2EMode, GIT_SHA } from '../../config'

const initializeSentry = () => {
  if (!inProduction || inStaging || inE2EMode) return

  Sentry.init({
    dsn: 'https://4760b7af8d5702d8e858b22d4c182289@toska.cs.helsinki.fi/22',
    release: GIT_SHA,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration()],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
