import * as dotenv from 'dotenv'

import { inProduction, inDevelopment } from '../../config'

dotenv.config()

export const PORT = process.env.PORT || 8000

export const SESSION_SECRET = process.env.SESSION_SECRET || ''

export const DATABASE_URL = process.env.DATABASE_URL || ''

export const REDIS_HOST = process.env.REDIS_HOST || 'redis'

export const JAMI_URL =
  inProduction || inDevelopment
    ? 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/jami/'
    : 'https://api-toska.apps.ocp-test-0.k8s.it.helsinki.fi/jami/'

export const OIDC_ISSUER = inProduction
  ? 'https://login.helsinki.fi/.well-known/openid-configuration'
  : 'https://login-test.it.helsinki.fi/.well-known/openid-configuration'

export const OIDC_CLIENT_ID = process.env.OIDC_CLIENT_ID || ''

export const OIDC_CLIENT_SECRET = process.env.OIDC_CLIENT_SECRET || ''

export const OIDC_REDIRECT_URI = process.env.OIDC_REDIRECT_URI || ''

export const API_TOKEN = process.env.API_TOKEN || ''

export const IMPORTER_URL =
  inProduction || inDevelopment
    ? 'https://api-toska.apps.ocp-prod-0.k8s.it.helsinki.fi/importer'
    : 'https://api-toska.apps.ocp-test-0.k8s.it.helsinki.fi/importer'

export const LOGOUT_REDIRECT_URL =
  inProduction || inDevelopment
    ? 'https://login.helsinki.fi/idp/profile/Logout'
    : 'https://login-test.it.helsinki.fi/idp/profile/Logout'

export const adminIams = ['grp-toska', 'hy-ypa-opa-ote']
