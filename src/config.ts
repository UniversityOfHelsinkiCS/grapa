export const inDevelopment = process.env.NODE_ENV === 'development'

export const inStaging = process.env.REACT_APP_STAGING === 'true'

export const inProduction = !inStaging && process.env.NODE_ENV === 'production'

export const inE2EMode = process.env.REACT_APP_E2E === 'true'

export const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

export const BASE_PATH = process.env.BASE_PATH || ''

// eslint-disable-next-line no-nested-ternary
export const FULL_URL = inProduction
  ? 'https://grapa.ext.ocp-prod-0.k8s.it.helsinki.fi'
  : inStaging
    ? 'https://toska-staging.cs.helsinki.fi/grapa'
    : 'http://localhost:3000'

export const FORM_DATA_KEY = 'grapa_local_save'
