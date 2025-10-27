import * as Sentry from '@sentry/browser'
import { inProduction, inStaging, inE2EMode, GIT_SHA } from '../../config'

const initializeSentry = () => {
  if (!inProduction || inStaging || inE2EMode) return

  Sentry.init({
    dsn: 'https://211e511b25b531f3c44fe901c279a60a@toska.it.helsinki.fi/20',
    release: GIT_SHA,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
