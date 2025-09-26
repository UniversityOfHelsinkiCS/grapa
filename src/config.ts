export const inDevelopment = process.env.NODE_ENV === 'development'

export const inStaging = process.env.REACT_APP_STAGING === 'true'

export const inProduction = !inStaging && process.env.NODE_ENV === 'production'

export const inTest = process.env.NODE_ENV === 'test'

export const inE2EMode = process.env.REACT_APP_E2E === 'true'

export const GIT_SHA = process.env.REACT_APP_GIT_SHA || ''

export const BASE_PATH = process.env.BASE_PATH || ''

export const UPDATER_CRON_ENABLED = process.env.UPDATER_CRON_ENABLED === 'true'

export const FULL_URL = inProduction
  ? 'https://prethesis.helsinki.fi'
  : inStaging
    ? 'https://grapa.ext.ocp-test-0.k8s.it.helsinki.fi'
    : 'http://localhost:3000'

export const SELECTED_LANGUAGE_STORAGE_KEY = 'grapa-admin-selected-language'

export const LOGIN_AS_LOCAL_STORAGE_KEY = 'grapa-admin-logged-in-as'
export const LOGIN_AS_HEADER_KEY = 'x-admin-logged-in-as'

export const VALID_EVENT_LOG_TYPES = [
  'THESIS_CREATED',
  'THESIS_DELETED',
  'THESIS_SUPERVISIONS_CHANGED',
  'THESIS_GRADERS_CHANGED',
  'THESIS_STATUS_CHANGED',
] as const

export const THESIS_STATUSES = {
  PLANNING: 'PLANNING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  ETHESIS: 'ETHESIS',
  ETHESIS_SENT: 'ETHESIS_SENT',
}
