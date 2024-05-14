import axios from 'axios'

import { BASE_PATH } from '../../config'

const baseURL = `${BASE_PATH}/api`

const apiClient = axios.create({ baseURL })

export default apiClient
