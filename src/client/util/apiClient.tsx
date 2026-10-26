import axios from 'axios'

import {
  BASE_PATH,
  HIDE_STUDENT_NUMBERS_HEADER_KEY,
  HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY,
  LOGIN_AS_HEADER_KEY,
  LOGIN_AS_LOCAL_STORAGE_KEY,
} from '../../config'

const baseURL = `${BASE_PATH}/api`

const apiClient = axios.create({
  baseURL,
  paramsSerializer: {
    indexes: null,
  },
})

apiClient.interceptors.request.use((config) => {
  const updatedHeaders = { ...config.headers }
  const adminLoggedInAs = localStorage.getItem(LOGIN_AS_LOCAL_STORAGE_KEY)
  if (adminLoggedInAs) {
    const user = JSON.parse(adminLoggedInAs)
    updatedHeaders[LOGIN_AS_HEADER_KEY] = user.id
  }
  if (localStorage.getItem(HIDE_STUDENT_NUMBERS_LOCAL_STORAGE_KEY) === 'true') {
    updatedHeaders[HIDE_STUDENT_NUMBERS_HEADER_KEY] = 'true'
  }
  return { ...config, headers: updatedHeaders } as any
})

export default apiClient
