export const inDevelopment = process.env.NODE_ENV === 'development'

export const inStaging = process.env.REACT_APP_STAGING === 'true'

export const inProduction = !inStaging && process.env.NODE_ENV === 'production'

export const inTest = process.env.NODE_ENV === 'test'

export const inE2EMode = process.env.REACT_APP_E2E === 'true'

export const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

export const BASE_PATH = process.env.BASE_PATH || ''

export const UPDATER_CRON_ENABLED = process.env.UPDATER_CRON_ENABLED === 'true'

// eslint-disable-next-line no-nested-ternary
export const FULL_URL = inProduction
  ? 'https://grapa.ext.ocp-prod-0.k8s.it.helsinki.fi'
  : inStaging
    ? 'https://grapa.ext.ocp-test-0.k8s.it.helsinki.fi'
    : 'http://localhost:3000'

export const FORM_DATA_KEY = 'grapa_local_save'

export const LOGIN_AS_LOCAL_STORAGE_KEY = 'grapa-admin-logged-in-as'
export const LOGIN_AS_HEADER_KEY = 'x-admin-logged-in-as'
