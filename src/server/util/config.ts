import * as dotenv from 'dotenv'

import {
  inProduction,
  inDevelopment,
  inE2EMode,
  inStaging,
  inTest,
} from '../../config.ts'

dotenv.config()

export const PORT = process.env.PORT || 8000

export const SESSION_SECRET = process.env.SESSION_SECRET || ''

export const DATABASE_URL = process.env.DATABASE_URL || ''

export const REDIS_HOST = process.env.REDIS_HOST || 'redis'

// The demo data routes wipe the database: only the e2e build started with NODE_ENV=test, never staging or production
export const DEMO_DATA_ENABLED =
  inE2EMode && inTest && !inStaging && !inProduction

export const UPDATER_CRON_ENABLED = process.env.UPDATER_CRON_ENABLED === 'true'

export const JAMI_URL =
  inProduction || inDevelopment
    ? 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/jami/'
    : 'https://api-toska.apps.ocp-test-0.k8s.it.helsinki.fi/jami/'

export const PATE_URL =
  inProduction || inDevelopment
    ? 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/pate/'
    : 'https://api-toska.apps.ocp-test-0.k8s.it.helsinki.fi/pate/'

export const OIDC_ISSUER = inDevelopment
  ? 'http://login.toska.localhost:3042/.well-known/openid-configuration'
  : inProduction
    ? 'https://login.helsinki.fi/.well-known/openid-configuration'
    : 'https://login-test.it.helsinki.fi/.well-known/openid-configuration'

export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || ''

export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || ''

export const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || ''

export const API_TOKEN = process.env.API_TOKEN || ''

export const EMPLOYEE_TOKEN = process.env.EMPLOYEE_TOKEN || ''

export const GW_API_URL = 'https://gw.api.helsinki.fi/'

export const IMPORTER_URL =
  inProduction || inDevelopment
    ? 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/importer'
    : 'https://api-toska.apps.ocp-test-0.k8s.it.helsinki.fi/importer'

export const LOGOUT_REDIRECT_URL = inDevelopment
  ? 'http://login.toska.localhost:3042/session/end'
  : inProduction
    ? 'https://login.helsinki.fi/idp/profile/Logout'
    : 'https://login-test.it.helsinki.fi/idp/profile/Logout'

export const adminIams = ['grp-toska']

export const DEPARTMENT_OF_CS_ID = '8fdce98e-2e9e-4cd7-a4c3-6d0176e29d37'
