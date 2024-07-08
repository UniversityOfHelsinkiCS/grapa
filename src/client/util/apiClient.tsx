import axios from 'axios'

import { BASE_PATH } from '../../config'

const baseURL = `${BASE_PATH}/api`

const apiClient = axios.create({ baseURL })

apiClient.interceptors.request.use((config) => {
  const updatedHeaders = { ...config.headers }
  const adminLoggedInAs = localStorage.getItem('grapa-admin-logged-in-as')
  if (adminLoggedInAs) {
    const user = JSON.parse(adminLoggedInAs)
    updatedHeaders['x-admin-logged-in-as'] = user.id
  }
  return { ...config, headers: updatedHeaders }
})

export default apiClient
