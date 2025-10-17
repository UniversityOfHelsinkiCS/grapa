import * as Sentry from '@sentry/node'

import { inProduction, inStaging, inE2EMode, GIT_SHA } from '../../config'

const initializeSentry = () => {
  if (!inProduction || inStaging || inE2EMode) return

  Sentry.init({
    dsn: 'https://da619cebec66a0a08e01dc19b820c7be@toska.it.helsinki.fi/14',
    release: GIT_SHA,
    integrations: [
      Sentry.httpIntegration({ breadcrumbs: true }),
      Sentry.expressIntegration(),
    ],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
