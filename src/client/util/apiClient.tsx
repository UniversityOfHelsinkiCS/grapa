import axios from 'axios'

import {
  BASE_PATH,
  LOGIN_AS_HEADER_KEY,
  LOGIN_AS_LOCAL_STORAGE_KEY,
} from '../../config'

const baseURL = `${BASE_PATH}/api`

const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const updatedHeaders = { ...config.headers }
  const adminLoggedInAs = localStorage.getItem(LOGIN_AS_LOCAL_STORAGE_KEY)
  if (adminLoggedInAs) {
    const user = JSON.parse(adminLoggedInAs)
    updatedHeaders[LOGIN_AS_HEADER_KEY] = user.id
  }
  return { ...config, headers: updatedHeaders }
})

export default apiClient
