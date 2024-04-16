import * as Sentry from '@sentry/browser'
import { inProduction, inStaging, inE2EMode, GIT_SHA } from '../../config'

const initializeSentry = () => {
  if (!inProduction || inStaging || inE2EMode) return

  Sentry.init({
    dsn: 'https://144f4b59d562a36afcdca13de964eb9a@toska.cs.helsinki.fi/3',
    release: GIT_SHA,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
  })
}

export default initializeSentry
